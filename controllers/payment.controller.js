import Appointment from '../models/Appointment.js';
import MedicineOrder from '../models/MedicineOrder.js';
import Transaction from '../models/Transaction.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

// @desc    Simulate creating a checkout session
// @route   POST /api/payment/checkout
// @access  Private (Patient)
export const createCheckoutSession = async (req, res, next) => {
    try {
        const { itemId, type } = req.body; // type: 'appointment' or 'medicine_order'
        
        let item;
        let amount = 0;
        let itemName = '';

        if (type === 'appointment') {
            item = await Appointment.findById(itemId).populate('doctor', 'fullName');
            if (!item) return res.status(404).json({ success: false, message: 'Appointment not found' });
            amount = item.amount || 500;
            itemName = `Consultation with Dr. ${item.doctor.fullName}`;
        } else if (type === 'medicine_order') {
            item = await MedicineOrder.findById(itemId);
            if (!item) return res.status(404).json({ success: false, message: 'Order not found' });
            // Calculate mock amount for medicines
            amount = item.items.reduce((sum, i) => sum + (i.quantity * 100), 0) + 50; // 100 per medicine + 50 delivery
            item.totalAmount = amount;
            await item.save();
            itemName = `Pharmacy Order #${item._id.toString().substring(0, 8).toUpperCase()}`;
        } else {
            return res.status(400).json({ success: false, message: 'Invalid payment type' });
        }

        // Return a simulated checkout URL
        const checkoutUrl = `/payment/checkout?type=${type}&id=${item._id}&amount=${amount}&name=${encodeURIComponent(itemName)}`;
        
        res.status(200).json({ success: true, data: { url: checkoutUrl } });
    } catch (error) {
        next(error);
    }
};

// @desc    Simulate successful payment webhook
// @route   POST /api/payment/simulate-webhook
// @access  Private
export const simulateWebhook = async (req, res, next) => {
    try {
        const { itemId, type } = req.body;
        
        let updatedItem;
        if (type === 'appointment') {
            updatedItem = await Appointment.findByIdAndUpdate(itemId, { paymentStatus: 'paid', status: 'scheduled' }, { new: true });
        } else if (type === 'medicine_order') {
            updatedItem = await MedicineOrder.findByIdAndUpdate(itemId, { paymentStatus: 'paid' }, { new: true });
        } else {
            return res.status(400).json({ success: false, message: 'Invalid payment type' });
        }

        if (!updatedItem) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }

        const admins = await User.find({ role: 'admin' });

        if (type === 'appointment') {
            const populatedApt = await Appointment.findById(itemId);
            await Transaction.create({
                patient: populatedApt.patient,
                doctor: populatedApt.doctor,
                appointment: populatedApt._id,
                amount: populatedApt.amount || 500,
                status: 'completed',
                transactionType: 'consultation'
            });

            // Notify Admins
            for (const admin of admins) {
                await Notification.create({
                    recipient: admin._id,
                    recipientModel: 'User',
                    title: 'Appointment Payment Received',
                    message: `A payment of ₹${populatedApt.amount || 500} was received for an appointment.`,
                    type: 'general',
                    route: '/admin/transactions'
                });
            }
            
            const io = req.app.get('io');
            if (io) {
                io.to('admin_room').emit('new_appointment_payment', {
                    patientName: populatedApt.patient?.fullName || 'A Patient',
                    amount: populatedApt.amount || 500
                });
                io.to('admin_room').emit('new_transaction');
            }
        } else if (type === 'medicine_order') {
            const io = req.app.get('io');
            const populatedOrder = await MedicineOrder.findById(itemId).populate('patient', 'fullName');
            
            await Transaction.create({
                patient: populatedOrder.patient._id,
                medicineOrder: populatedOrder._id,
                amount: populatedOrder.totalAmount || 0,
                status: 'completed',
                transactionType: 'pharmacy'
            });

            // Notify Admins via DB
            for (const admin of admins) {
                await Notification.create({
                    recipient: admin._id,
                    recipientModel: 'User',
                    title: 'Pharmacy Payment Received',
                    message: `Payment of ₹${populatedOrder.totalAmount} received from ${populatedOrder.patient?.fullName || 'Patient'} for Order #${populatedOrder._id.toString().substring(0, 8).toUpperCase()}.`,
                    type: 'general',
                    route: '/admin/transactions'
                });
            }

            if (io) {
                io.to('admin_room').emit('new_medicine_order', {
                    orderId: populatedOrder._id,
                    patientName: populatedOrder.patient?.fullName || 'A Patient',
                    items: populatedOrder.items.length
                });
                io.to('admin_room').emit('new_transaction');
            }
        }

        res.status(200).json({ success: true, message: 'Payment simulated successfully', data: updatedItem });
    } catch (error) {
        next(error);
    }
};

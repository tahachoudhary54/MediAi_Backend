import MedicineOrder from '../models/MedicineOrder.js';

// @desc    Create new order
// @route   POST /api/medicine-orders
// @access  Private (Patient)
export const createOrder = async (req, res, next) => {
    try {
        const { items, deliveryAddress, prescriptionUrl } = req.body;
        
        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: 'No items in order' });
        }

        const order = await MedicineOrder.create({
            patient: req.user._id,
            items,
            deliveryAddress,
            prescriptionUrl
        });

        res.status(201).json({ success: true, data: order });
    } catch (error) {
        next(error);
    }
};

// @desc    Get logged in patient orders
// @route   GET /api/medicine-orders/patient
// @access  Private (Patient)
export const getPatientOrders = async (req, res, next) => {
    try {
        const orders = await MedicineOrder.find({ patient: req.user._id })
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: orders });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all orders
// @route   GET /api/medicine-orders
// @access  Private (Admin)
export const getAllOrders = async (req, res, next) => {
    try {
        const orders = await MedicineOrder.find()
            .populate('patient', 'fullName email phone')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: orders });
    } catch (error) {
        next(error);
    }
};

// @desc    Update order status
// @route   PUT /api/medicine-orders/:id/status
// @access  Private (Admin)
export const updateOrderStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        
        const validStatuses = ['pending', 'confirmed', 'out_for_delivery', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const order = await MedicineOrder.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        ).populate('patient', 'fullName email phone');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        res.status(200).json({ success: true, data: order });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete order
// @route   DELETE /api/medicine-orders/:id
// @access  Private (Patient/Admin)
export const deleteOrder = async (req, res, next) => {
    try {
        const order = await MedicineOrder.findById(req.params.id);
        
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Only Admin or the Patient who placed the order can delete it
        if (req.user.role !== 'admin' && order.patient.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this order' });
        }

        await order.deleteOne();

        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        next(error);
    }
};

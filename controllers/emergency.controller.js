import EmergencyCase from '../models/EmergencyCase.js';
import Doctor from '../models/Doctor.js';
import calculateDistance from '../utils/calculateDistance.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

// @desc    Create emergency case & find nearby doctors
// @route   POST /api/emergency
// @access  Private (Patient)
export const createEmergencyCase = async (req, res, next) => {
    try {
        const { symptoms, riskLevel, latitude, longitude } = req.body;
        
        // Find approved active doctors
        const approvedDoctors = await Doctor.find({ verificationStatus: 'approved', accountStatus: 'active' });
        
        // Calculate distances and find nearest
        const nearbyDoctors = approvedDoctors
            .filter(doc => doc.location && doc.location.latitude && doc.location.longitude)
            .map(doc => {
                const distance = calculateDistance(latitude, longitude, doc.location.latitude, doc.location.longitude);
                return { doctor: doc._id, distance };
            })
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 5); // top 5 nearest doctors

        const emergency = await EmergencyCase.create({
            patient: req.user._id,
            symptoms,
            riskLevel,
            latitude,
            longitude,
            accuracy: req.body.accuracy || 0,
            status: 'pending',
            nearestDoctors: nearbyDoctors
        });
        
        // Return full populated case
        const populatedEmergency = await EmergencyCase.findById(emergency._id)
            .populate('patient', 'fullName phone emergencyContact')
            .populate('nearestDoctors.doctor', 'fullName specialization phone clinicAddress');
            
        // Mock nearby hospitals if needed (can be static list or based on logic)
        const mockHospitals = [
            { name: "City General Hospital", distance: 2.5, phone: "911" },
            { name: "Medicare Center", distance: 4.1, phone: "112" }
        ];
        
        // Emit Socket Event to Admin Room
        const io = req.app.get('io');
        if (io) {
            io.to('admin').emit('emergency_alert', populatedEmergency);
        }

        res.status(201).json({ success: true, data: populatedEmergency, mockHospitals });

        // Notify Admins
        const admins = await User.find({ role: 'admin' });
        for (const admin of admins) {
            await Notification.create({
                recipient: admin._id,
                recipientModel: 'User',
                title: 'EMERGENCY SOS ALERT!',
                message: `Patient ${req.user.fullName} triggered an emergency SOS. Risk: ${riskLevel}`,
                type: 'emergency',
                route: '/admin/emergency-monitoring'
            });
        }

        // Notify Nearby Doctors
        for (const nearby of nearbyDoctors) {
            await Notification.create({
                recipient: nearby.doctor,
                recipientModel: 'Doctor',
                title: 'NEARBY EMERGENCY!',
                message: `An emergency case was triggered near your clinic. Please check your dashboard.`,
                type: 'emergency',
                route: '/doctor/dashboard'
            });
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Get patient emergency cases
// @route   GET /api/emergency/patient
// @access  Private (Patient)
export const getPatientEmergencyCases = async (req, res, next) => {
    try {
        const emergencies = await EmergencyCase.find({ patient: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: emergencies });
    } catch (error) {
        next(error);
    }
};

// @desc    Update emergency status
// @route   PUT /api/emergency/:id/status
// @access  Private (Admin or assigned Doctor)
export const updateEmergencyStatus = async (req, res, next) => {
    try {
        const { status } = req.body; // 'assigned', 'resolved'
        
        const emergency = await EmergencyCase.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!emergency) return res.status(404).json({ success: false, message: 'Emergency case not found' });
        
        res.status(200).json({ success: true, data: emergency });
    } catch (error) {
        next(error);
    }
};

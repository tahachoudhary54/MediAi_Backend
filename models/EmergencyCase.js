import mongoose from 'mongoose';

const emergencyCaseSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    symptoms: { type: String, required: true },
    riskLevel: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    accuracy: { type: Number },
    status: {
        type: String,
        enum: ['pending', 'assigned', 'resolved'],
        default: 'pending'
    },
    isArchived: { type: Boolean, default: false },
    nearestDoctors: [{
        doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
        distance: Number
    }]
}, { timestamps: true });

const EmergencyCase = mongoose.model('EmergencyCase', emergencyCaseSchema);
export default EmergencyCase;

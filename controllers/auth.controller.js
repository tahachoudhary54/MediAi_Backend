import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import Chat from '../models/Chat.js';
import { computeDoctorStatus } from '../utils/statusHelper.js';
import generateToken from '../utils/generateToken.js';
import crypto from 'crypto';
import sendEmail from '../utils/sendEmail.js';

// Helper to generate OTP
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const getOtpTemplate = (otp) => `
<div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px;">
  <h2 style="color: #0d9488; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">MediAI Healthcare</h2>
  <p>Hello,</p>
  <p>We received a request to verify your email address. Your verification code is:</p>
  <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #0d9488; margin: 20px 0; padding: 15px; background: #f0fdfa; border-radius: 8px; text-align: center; border: 1px dashed #5eead4;">
    ${otp}
  </div>
  <p>This code will expire in 10 minutes. If you did not request this, you can safely ignore this email.</p>
  <br>
  <p style="color: #64748b; font-size: 14px;">Best regards,<br>The MediAI Team</p>
</div>
`;

// Helper to send token response
const sendTokenResponse = (user, statusCode, res, isDoctor = false) => {
    const token = generateToken(user._id, user.role);

    const responseData = {
        success: true,
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword || false,
        token
    };

    if (isDoctor) {
        responseData.verificationStatus = user.verificationStatus;
    }

    res.status(statusCode).json(responseData);
};

// @desc    Register a new user (Patient)
// @route   POST /api/auth/register
// @access  Public
export const registerPatient = async (req, res, next) => {
    try {
        let { fullName, email, password, age, sex, bloodGroup, allergies, currentMedications, previousDiseaseHistory, familyDiseaseHistory, emergencyContact, location } = req.body;
        if (email) email = email.toLowerCase();

        let userExists = await User.findOne({ email });
        const doctorExists = await Doctor.findOne({ email });
        
        if (doctorExists) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        const otp = generateOtp();
        const otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        let user;
        if (userExists) {
            if (userExists.isVerified) {
                return res.status(400).json({ success: false, message: 'Email already registered and verified' });
            }
            userExists.fullName = fullName;
            userExists.password = password;
            userExists.age = age;
            userExists.sex = sex;
            userExists.bloodGroup = bloodGroup;
            userExists.allergies = allergies;
            userExists.currentMedications = currentMedications;
            userExists.previousDiseaseHistory = previousDiseaseHistory;
            userExists.familyDiseaseHistory = familyDiseaseHistory;
            userExists.emergencyContact = emergencyContact;
            userExists.location = location;
            userExists.otp = otp;
            userExists.otpExpire = otpExpire;
            await userExists.save();
            user = userExists;
        } else {
            user = await User.create({
                fullName, email, password, role: 'patient', age, sex, bloodGroup, allergies, currentMedications, previousDiseaseHistory, familyDiseaseHistory, emergencyContact, location,
                otp, otpExpire, isVerified: false
            });
        }

        try {
            await sendEmail({
                email: user.email,
                subject: 'MediAI - Verify Your Email',
                message: `Hello,\n\nWe received a request to verify your email address. Your verification code is: ${otp}\n\nThis code will expire in 10 minutes. If you did not request this, you can safely ignore this email.\n\nBest regards,\nThe MediAI Team`,
                html: getOtpTemplate(otp)
            });
        } catch (error) {
            console.error('Email sending failed', error);
        }

        res.status(200).json({ success: true, message: 'OTP sent to email', requireOtp: true });
    } catch (error) {
        next(error);
    }
};

// @desc    Register a new doctor
// @route   POST /api/auth/doctor/register
// @access  Public
export const registerDoctor = async (req, res, next) => {
    try {
        let { fullName, email, password, specialization, licenseNumber, yearsOfExperience, hospitalName, clinicAddress, phone, location } = req.body;
        if (email) email = email.toLowerCase();

        const userExists = await User.findOne({ email });
        let doctorExists = await Doctor.findOne({ email });
        
        if (userExists) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        const otp = generateOtp();
        const otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        let degreeCertificate = req.files?.['degreeCertificate']?.[0]?.filename || '';
        let governmentId = req.files?.['governmentId']?.[0]?.filename || '';
        let medicalLicenseProof = req.files?.['medicalLicenseProof']?.[0]?.filename || '';
        let avatar = req.files?.['profilePhoto']?.[0]?.filename || '';

        let doctor;
        if (doctorExists) {
            if (doctorExists.isVerified) {
                return res.status(400).json({ success: false, message: 'Email already registered and verified' });
            }
            doctorExists.fullName = fullName;
            doctorExists.password = password;
            doctorExists.specialization = specialization;
            doctorExists.licenseNumber = licenseNumber;
            doctorExists.yearsOfExperience = yearsOfExperience;
            doctorExists.hospitalName = hospitalName;
            doctorExists.clinicAddress = clinicAddress;
            doctorExists.phone = phone;
            doctorExists.location = location;
            if (degreeCertificate) doctorExists.degreeCertificate = degreeCertificate;
            if (governmentId) doctorExists.governmentId = governmentId;
            if (medicalLicenseProof) doctorExists.medicalLicenseProof = medicalLicenseProof;
            if (avatar) doctorExists.avatar = avatar;
            doctorExists.otp = otp;
            doctorExists.otpExpire = otpExpire;
            await doctorExists.save();
            doctor = doctorExists;
        } else {
            doctor = await Doctor.create({
                fullName, email, password, role: 'doctor', specialization, licenseNumber, yearsOfExperience, hospitalName, clinicAddress, phone, location,
                degreeCertificate, governmentId, medicalLicenseProof, avatar, verificationStatus: 'pending',
                otp, otpExpire, isVerified: false
            });
        }

        try {
            await sendEmail({
                email: doctor.email,
                subject: 'MediAI - Verify Your Email',
                message: `Hello,\n\nWe received a request to verify your email address. Your verification code is: ${otp}\n\nThis code will expire in 10 minutes. If you did not request this, you can safely ignore this email.\n\nBest regards,\nThe MediAI Team`,
                html: getOtpTemplate(otp)
            });
        } catch (error) {
            console.error('Email sending failed', error);
        }

        res.status(200).json({ success: true, message: 'OTP sent to email', requireOtp: true, verificationStatus: 'pending' });
    } catch (error) {
        next(error);
    }
};

// @desc    Verify OTP for registration
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOtp = async (req, res, next) => {
    try {
        let { email, otp, role } = req.body;
        if (email) email = email.toLowerCase();

        if (!email || !otp) {
            return res.status(400).json({ success: false, message: 'Please provide email and OTP' });
        }

        let user;
        let isDoctor = false;

        if (role === 'doctor') {
            user = await Doctor.findOne({ email });
            isDoctor = true;
        } else {
            user = await User.findOne({ email });
        }

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ success: false, message: 'User is already verified' });
        }

        if (user.otp !== otp) {
            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }

        if (user.otpExpire < new Date()) {
            return res.status(400).json({ success: false, message: 'OTP has expired. Please register again.' });
        }

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpire = undefined;
        await user.save();

        sendTokenResponse(user, 200, res, isDoctor);

    } catch (error) {
        next(error);
    }
};

// @desc    Resend OTP for registration
// @route   POST /api/auth/resend-otp
// @access  Public
export const resendOtp = async (req, res, next) => {
    try {
        let { email, role } = req.body;
        if (email) email = email.toLowerCase();

        if (!email) {
            return res.status(400).json({ success: false, message: 'Please provide email' });
        }

        let user;
        if (role === 'doctor') {
            user = await Doctor.findOne({ email });
        } else {
            user = await User.findOne({ email });
        }

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ success: false, message: 'User is already verified' });
        }

        const otp = generateOtp();
        const otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        user.otp = otp;
        user.otpExpire = otpExpire;
        await user.save();

        try {
            await sendEmail({
                email: user.email,
                subject: 'MediAI - Resend OTP Verification',
                message: `Hello,\n\nWe received a request to verify your email address. Your verification code is: ${otp}\n\nThis code will expire in 10 minutes. If you did not request this, you can safely ignore this email.\n\nBest regards,\nThe MediAI Team`,
                html: getOtpTemplate(otp)
            });
        } catch (error) {
            console.error('Email sending failed', error);
        }

        res.status(200).json({ success: true, message: 'New OTP sent to your email' });

    } catch (error) {
        next(error);
    }
};

// @desc    Re-submit doctor verification
// @route   PUT /api/auth/doctor/reverify
// @access  Private (Doctor)
export const reverifyDoctor = async (req, res, next) => {
    try {
        const doctor = await Doctor.findById(req.user._id);
        if (!doctor) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }

        const { fullName, specialization, licenseNumber, yearsOfExperience, hospitalName, clinicAddress, phone, location } = req.body;

        // Update basic info
        if (fullName) doctor.fullName = fullName;
        if (specialization) doctor.specialization = specialization;
        if (licenseNumber) doctor.licenseNumber = licenseNumber;
        if (yearsOfExperience) doctor.yearsOfExperience = yearsOfExperience;
        if (hospitalName) doctor.hospitalName = hospitalName;
        if (clinicAddress) doctor.clinicAddress = clinicAddress;
        if (phone) doctor.phone = phone;
        if (location) doctor.location = location;

        // Update files if provided
        if (req.files) {
            if (req.files['degreeCertificate']) doctor.degreeCertificate = req.files['degreeCertificate'][0].filename;
            if (req.files['governmentId']) doctor.governmentId = req.files['governmentId'][0].filename;
            if (req.files['medicalLicenseProof']) doctor.medicalLicenseProof = req.files['medicalLicenseProof'][0].filename;
            if (req.files['profilePhoto']) doctor.avatar = req.files['profilePhoto'][0].filename;
        }

        // Reset status to pending
        doctor.verificationStatus = 'pending';
        doctor.rejectionReason = '';

        await doctor.save();

        res.status(200).json({
            success: true,
            message: 'Verification request re-submitted successfully',
            verificationStatus: 'pending'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Login User / Doctor / Admin
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
    try {
        let { email, password, adminAccessCode, role: requestedRole } = req.body;
        
        if (email) email = email.toLowerCase();

        console.log(`[Login] Attempt for ${email} as ${requestedRole || 'unknown'}`);

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        let user = null;
        let isDoctor = false;

        // Strict role-based collection selection
        if (requestedRole === 'doctor') {
            user = await Doctor.findOne({ email }).select('+password');
            isDoctor = true;
            if (user) user.role = 'doctor'; // Ensure role is set correctly
        } else if (requestedRole === 'admin' || requestedRole === 'patient') {
            user = await User.findOne({ email }).select('+password +adminAccessCode');
            // Ensure the found user actually has the requested role (e.g. don't log in as patient if admin was requested)
            if (user && user.role !== requestedRole) {
                console.log(`[Login] Role mismatch: Found ${user.role} but requested ${requestedRole}`);
                user = null; 
            }
        } else {
            // Fallback for cases where role is not provided
            console.log('[Login] No role provided, performing fallback search');
            user = await User.findOne({ email }).select('+password +adminAccessCode');
            if (!user) {
                user = await Doctor.findOne({ email }).select('+password');
                if (user) {
                    isDoctor = true;
                    user.role = 'doctor';
                }
            }
        }

        if (!user) {
            console.log('[Login] User not found or role mismatch');
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Validate password
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            console.log('[Login] Password mismatch');
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Check admin access code if role is admin
        if (user.role === 'admin') {
            if (adminAccessCode !== user.adminAccessCode) {
                console.log('[Login] Admin access code mismatch');
                return res.status(401).json({ success: false, message: 'Invalid admin access code' });
            }
        }

        // Account status check
        const accountStatus = isDoctor ? user.accountStatus : (user.isActive ? 'active' : 'suspended');
        if (accountStatus === 'suspended') {
            console.log('[Login] Account suspended');
            return res.status(403).json({ success: false, message: 'Account is suspended' });
        }
        
        if (user.isVerified === false && user.role !== 'admin') {
            console.log('[Login] Account not verified');
            return res.status(401).json({ success: false, message: 'Please verify your email to log in' });
        }

        console.log(`[Login] Success: ${user.email} logged in as ${user.role}`);
        sendTokenResponse(user, 200, res, isDoctor);

    } catch (error) {
        console.error('[Login] Error:', error);
        next(error);
    }
};

// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;

        let user = await User.findOne({ email });
        let isDoctor = false;

        if (!user) {
            user = await Doctor.findOne({ email });
            isDoctor = true;
        }

        if (!user) {
            return res.status(404).json({ success: false, message: 'There is no user with that email' });
        }

        // Get reset token
        const resetToken = crypto.randomBytes(20).toString('hex');

        // Hash token and set to resetPasswordToken field
        user.resetPasswordToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        // Set expire
        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 mins

        await user.save({ validateBeforeSave: false });

        // Mock email sending
        console.log(`[FORGOT PASSWORD] Token for ${email}: ${resetToken}`);

        res.status(200).json({ 
            success: true, 
            message: 'Password reset token generated. Check console for token (Mock).',
            token: resetToken // In production, don't send this back. Send via email.
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password/:token
// @access  Public
export const resetPassword = async (req, res, next) => {
    try {
        // Get hashed token
        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(req.params.token)
            .digest('hex');

        let user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            user = await Doctor.findOne({
                resetPasswordToken,
                resetPasswordExpire: { $gt: Date.now() }
            });
        }

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired token' });
        }

        // Set new password
        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        user.mustChangePassword = false;
        await user.save();

        res.status(200).json({ success: true, message: 'Password reset successful' });

    } catch (error) {
        next(error);
    }
};

// @desc    Update Password (logged in)
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        let user;
        if (req.user.role === 'doctor') {
            user = await Doctor.findById(req.user.id).select('+password');
        } else {
            user = await User.findById(req.user.id).select('+password');
        }

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Check current password
        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect' });
        }

        user.password = newPassword;
        user.mustChangePassword = false;
        await user.save();

        res.status(200).json({ success: true, message: 'Password updated successfully' });

    } catch (error) {
        next(error);
    }
};
export const getMe = async (req, res, next) => {
    try {
        if (req.user) {
            let userData = req.user.toObject ? req.user.toObject() : { ...req.user };
            
            if (req.user.role === 'doctor') {
                const doctor = await Doctor.findById(req.user._id);
                if (doctor) {
                    const computed = await computeDoctorStatus(doctor);
                    userData.onlineStatus = computed;
                    userData.breakExpiresAt = doctor.breakExpiresAt;
                    userData.dailyBreak = doctor.dailyBreak;
                }
            }
            
            return res.status(200).json({
                success: true,
                data: userData
            });
        }
        res.status(401).json({ success: false, message: 'Not authorized' });
    } catch (error) {
        next(error);
    }
};

// @desc    Update current user's profile
// @route   PATCH /api/auth/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
    try {
        const { fullName, email, phone, sex, address, dob, bloodGroup, emergencyContact, emergencyLocationEnabled, bio, specialization, licenseNumber, yearsOfExperience, hospitalName, clinicAddress, weeklyAvailability, onlineStatus, breakDuration, dailyBreak, wearableSource } = req.body;

        let user;
        if (req.user.role === 'doctor') {
            user = await Doctor.findById(req.user._id);
        } else {
            user = await User.findById(req.user._id);
        }

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (fullName) user.fullName = fullName;
        if (phone !== undefined) user.phone = phone;
        if (sex !== undefined) user.sex = sex;
        if (address !== undefined) user.address = address;
        if (dob !== undefined) user.dob = dob;
        if (bloodGroup !== undefined) user.bloodGroup = bloodGroup;
        if (emergencyContact !== undefined) user.emergencyContact = emergencyContact;
        
        // Patient specific field: wearable source and location tracking
        if (wearableSource !== undefined && req.user.role === 'patient') {
            user.wearableSource = wearableSource;
        }
        if (emergencyLocationEnabled !== undefined && req.user.role === 'patient') {
            user.emergencyLocationEnabled = emergencyLocationEnabled;
        }
        
        // Doctor specific fields
        if (bio !== undefined) user.bio = bio;
        if (specialization !== undefined) user.specialization = specialization;
        if (licenseNumber !== undefined) user.licenseNumber = licenseNumber;
        if (yearsOfExperience !== undefined) user.yearsOfExperience = yearsOfExperience;
        if (hospitalName !== undefined) user.hospitalName = hospitalName;
        if (clinicAddress !== undefined) user.clinicAddress = clinicAddress;
        if (weeklyAvailability !== undefined) user.weeklyAvailability = weeklyAvailability;
        if (dailyBreak !== undefined) user.dailyBreak = dailyBreak;
        
        if (onlineStatus !== undefined) {
            user.onlineStatus = onlineStatus;
            if (onlineStatus === 'break') {
                if (breakDuration && breakDuration !== 'indefinite') {
                    const durationMinutes = parseInt(breakDuration, 10);
                    user.breakExpiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);
                } else {
                    user.breakExpiresAt = undefined; // Indefinite
                }
            } else {
                user.breakExpiresAt = undefined;
            }

            // Emit socket event for real-time status updates
            const io = req.app.get('io');
            if (io && req.user.role === 'doctor') {
                io.emit('doctorStatusChanged', { doctorId: user._id, status: onlineStatus, breakExpiresAt: user.breakExpiresAt });
            }
        }

        // If email is changing, check it's not taken
        if (email && email !== user.email) {
            const emailLower = email.toLowerCase();
            const existingUser = await User.findOne({ email: emailLower });
            const existingDoctor = await Doctor.findOne({ email: emailLower });
            if (existingUser || existingDoctor) {
                return res.status(400).json({ success: false, message: 'Email already in use' });
            }
            user.email = emailLower;
        }

        await user.save({ validateBeforeSave: false });

        let calculatedStatus = user.onlineStatus;
        if (req.user.role === 'doctor') {
            calculatedStatus = await computeDoctorStatus(user);
        }

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                sex: user.sex,
                address: user.address,
                dob: user.dob,
                bloodGroup: user.bloodGroup,
                emergencyContact: user.emergencyContact,
                emergencyLocationEnabled: user.emergencyLocationEnabled,
                wearableSource: user.wearableSource,
                bio: user.bio,
                specialization: user.specialization,
                licenseNumber: user.licenseNumber,
                yearsOfExperience: user.yearsOfExperience,
                hospitalName: user.hospitalName,
                clinicAddress: user.clinicAddress,
                weeklyAvailability: user.weeklyAvailability,
                onlineStatus: calculatedStatus,
                breakExpiresAt: user.breakExpiresAt,
                dailyBreak: user.dailyBreak,
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update profile photo (avatar)
// @route   PATCH /api/auth/avatar
// @access  Private
export const updateAvatar = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        let user;
        if (req.user.role === 'doctor') {
            user = await Doctor.findById(req.user._id);
        } else {
            user = await User.findById(req.user._id);
        }

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.avatar = req.file.filename;
        await user.save({ validateBeforeSave: false });

        res.status(200).json({
            success: true,
            message: 'Avatar updated successfully',
            data: { avatar: req.file.filename }
        });
    } catch (error) {
        next(error);
    }
};

import express from 'express';
import { createGuestEmergency, createEmergencyCase, getPatientEmergencyCases, updateEmergencyStatus } from '../controllers/emergency.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { guestSosRateLimiter } from '../middleware/rateLimiter.middleware.js';

const router = express.Router();

// PUBLIC route — Guest SOS (no login required)
router.post('/guest-sos', guestSosRateLimiter, createGuestEmergency);

// Protected routes below
router.use(protect);

router.post('/', createEmergencyCase);
router.get('/patient', getPatientEmergencyCases);
router.put('/:id/status', updateEmergencyStatus);

export default router;

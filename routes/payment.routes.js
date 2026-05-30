import express from 'express';
import { createCheckoutSession, simulateWebhook } from '../controllers/payment.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.post('/checkout', createCheckoutSession);
router.post('/simulate-webhook', simulateWebhook);

export default router;

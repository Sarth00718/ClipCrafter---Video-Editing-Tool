import { Router } from 'express';
import {
    register,
    login,
    getMe,
    sendOtp,
    verifyOtp,
    refreshTokenHandler,
    logout,
    requestPasswordOtp,
    resetPasswordWithOtp,
    updateAvatar,
    updateProfile,
    deleteAccount,
    getActivityHistory,
    getActivityStats,
} from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { validateRegister, validateLogin, validateVerifyOtp } from '../validators/auth.validator.js';
import { authLimiter } from '../middlewares/rateLimit.middleware.js';
import upload from '../middlewares/upload.middleware.js';

const router = Router();

// ── Public ─────────────────────────────────────────────────────────────────────
router.post('/register', authLimiter, validateRegister, register);
router.post('/login', authLimiter, validateLogin, login);
router.post('/refresh', refreshTokenHandler);
router.post('/password/request-otp', authLimiter, requestPasswordOtp);
router.post('/password/reset', authLimiter, resetPasswordWithOtp);

// ── Protected ──────────────────────────────────────────────────────────────────
router.get('/me', protect, getMe);
router.post('/send-otp', protect, authLimiter, sendOtp);
router.post('/verify-otp', protect, authLimiter, validateVerifyOtp, verifyOtp);
router.post('/logout', protect, logout);
router.put('/avatar', protect, upload.single('avatar'), updateAvatar);
router.put('/update', protect, updateProfile);
router.delete('/me', protect, deleteAccount);
router.get('/activity', protect, getActivityHistory);
router.get('/activity-stats', protect, getActivityStats);

export default router;

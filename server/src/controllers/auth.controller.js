// Full auth controller — register, login, getMe, sendOtp, verifyOtp, refresh, logout, password reset, profile updates
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, ApiError } from '../utils/apiResponse.js';
import * as authService from '../services/auth.service.js';
import { sendOTPviaSMS, sendOTPviaEmail, verifyOTP } from '../services/notification/otp.service.js';
import { sendEmail } from '../services/notification/email.service.js';
import { createRefreshToken, rotateRefreshToken, revokeAllUserTokens, writeAuditLog } from '../services/refreshToken.service.js';
import { signAccessToken } from '../utils/token.js';
import User from '../models/User.js';
import { uploadBuffer } from '../services/cloudinary.service.js';
import { logger } from '../utils/logger.js';

// ─── Helper: Add Activity ─────────────────────────────────────────────────────
const addActivity = async (user, action, metadata = {}) => {
    if (!user.activityHistory) user.activityHistory = [];
    user.activityHistory.push({ action, metadata, createdAt: new Date() });
    const MAX_HISTORY = 100;
    if (user.activityHistory.length > MAX_HISTORY) {
        user.activityHistory = user.activityHistory.slice(-MAX_HISTORY);
    }
    user.lastActiveAt = new Date();
};

// ─── Helper: Get Safe User (remove sensitive fields) ─────────────────────────
const getSafeUser = (user) => {
    const obj = user.toObject ? user.toObject() : { ...user };
    delete obj.password;
    delete obj.passwordResetOtp;
    delete obj.passwordResetOtpExpiresAt;
    return obj;
};

// ─── Register ─────────────────────────────────────────────────────────────────
export const register = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    const result = await authService.registerUser({ name, email, password });
    const user = result.user;
    const uid = user._id || user.id;

    const accessToken = signAccessToken(uid);
    const refreshToken = await createRefreshToken(uid);

    await writeAuditLog({ userId: uid, action: 'auth.register', resourceType: 'user', resourceId: uid, req });

    sendSuccess(res, 201, 'Account created successfully', { token: accessToken, refreshToken, user });
});

// ─── Login ────────────────────────────────────────────────────────────────────
export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await authService.loginUser({ email, password });
    const user = result.user;
    const uid = user._id || user.id;

    const accessToken = signAccessToken(uid);
    const refreshToken = await createRefreshToken(uid);

    await writeAuditLog({ userId: uid, action: 'auth.login', resourceType: 'user', resourceId: uid, req });

    sendSuccess(res, 200, 'Login successful', { token: accessToken, refreshToken, user });
});

// ─── Get Current User ─────────────────────────────────────────────────────────
export const getMe = asyncHandler(async (req, res) => {
    const user = await authService.getUserProfile(req.user._id);
    sendSuccess(res, 200, 'User profile retrieved', { user });
});

// ─── Send OTP ─────────────────────────────────────────────────────────────────
export const sendOtp = asyncHandler(async (req, res) => {
    const { method, phone, email: emailAddr } = req.body;
    const userId = req.user._id;

    if (!method || !['sms', 'email'].includes(method)) {
        throw new ApiError(400, '"method" must be "sms" or "email"');
    }

    if (method === 'sms') {
        if (!phone) throw new ApiError(400, '"phone" is required for SMS delivery');
        const result = await sendOTPviaSMS(userId, phone);
        return sendSuccess(res, 200, `OTP sent via SMS to ${phone}`, { sid: result.sid });
    }

    const recipient = emailAddr || req.user.email;
    if (!recipient) throw new ApiError(400, '"email" is required for email delivery');
    const result = await sendOTPviaEmail(userId, recipient);
    sendSuccess(res, 200, `OTP sent via email to ${recipient}`, { id: result.id });
});

// ─── Verify OTP ───────────────────────────────────────────────────────────────
export const verifyOtp = asyncHandler(async (req, res) => {
    const { otp, method } = req.body;
    const userId = req.user._id;

    if (!otp || !method) throw new ApiError(400, '"otp" and "method" are required');
    if (!['sms', 'email'].includes(method)) throw new ApiError(400, '"method" must be "sms" or "email"');
    if (!/^\d{6}$/.test(String(otp))) throw new ApiError(400, '"otp" must be a 6-digit number');

    const isValid = await verifyOTP(userId, otp, method);
    if (!isValid) throw new ApiError(401, 'Invalid or expired OTP');

    await writeAuditLog({ userId, action: 'auth.verify-otp', resourceType: 'user', resourceId: userId, req });

    sendSuccess(res, 200, 'OTP verified successfully — account is now verified', { verified: true });
});

// ─── Refresh Token ────────────────────────────────────────────────────────────
export const refreshTokenHandler = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new ApiError(400, '"refreshToken" is required');

    const { accessToken, refreshToken: newRefresh } = await rotateRefreshToken(refreshToken);

    sendSuccess(res, 200, 'Token refreshed', { token: accessToken, refreshToken: newRefresh });
});

// ─── Logout ───────────────────────────────────────────────────────────────────
export const logout = asyncHandler(async (req, res) => {
    await revokeAllUserTokens(req.user._id);
    await writeAuditLog({ userId: req.user._id, action: 'auth.logout', resourceType: 'user', resourceId: req.user._id, req });
    sendSuccess(res, 200, 'Logged out successfully');
});

// ─── Request Password Reset OTP ───────────────────────────────────────────────
export const requestPasswordOtp = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) throw new ApiError(400, 'Email is required');

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) throw new ApiError(404, 'User not found');

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const now = new Date();

    user.passwordResetOtp = otp;
    user.passwordResetOtpExpiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 min
    await addActivity(user, 'REQUEST_PASSWORD_OTP', {});
    await user.save({ validateBeforeSave: false });

    // Send OTP via email directly (not using the OTP service which has its own storage)
    try {
        await sendEmail({
            to: user.email,
            subject: 'Reset Your ClipCrafters Password',
            html: `
                <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0f0f0f;color:#fff;border-radius:12px">
                    <h2 style="color:#c9a84c;margin:0 0 8px">ClipCrafters 🎬</h2>
                    <p style="color:#aaa;margin:0 0 24px;font-size:14px">Password Reset Code</p>
                    <div style="background:#1a1a1a;border-radius:8px;padding:24px;text-align:center;letter-spacing:12px;font-size:36px;font-weight:700;color:#fff">
                        ${otp}
                    </div>
                    <p style="color:#aaa;font-size:13px;margin:20px 0 0;text-align:center">
                        This code expires in <strong style="color:#fff">10 minutes</strong>.
                        Never share this code with anyone.
                    </p>
                    <p style="color:#666;font-size:12px;margin:16px 0 0;text-align:center">
                        If you didn't request this, please ignore this email.
                    </p>
                </div>
            `,
            text: `Your ClipCrafters password reset code is: ${otp}\nExpires in 10 minutes.\n\nIf you didn't request this, please ignore this email.`,
        });
    } catch (emailError) {
        logger.error('Failed to send password reset email:', emailError);
        throw new ApiError(500, 'Failed to send OTP email');
    }

    sendSuccess(res, 200, 'OTP sent to registered email');
});

// ─── Reset Password with OTP ──────────────────────────────────────────────────
export const resetPasswordWithOtp = asyncHandler(async (req, res) => {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
        throw new ApiError(400, 'Email, OTP, and new password are required');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedOtp = String(otp).trim();
    
    const user = await User.findOne({ email: normalizedEmail })
        .select('+passwordResetOtp +passwordResetOtpExpiresAt');

    if (!user) throw new ApiError(404, 'User not found');

    if (!user.passwordResetOtp) {
        throw new ApiError(400, 'No OTP request found. Please request a new OTP.');
    }

    const now = new Date();
    if (user.passwordResetOtpExpiresAt < now) {
        throw new ApiError(400, 'OTP has expired. Please request a new one.');
    }

    if (user.passwordResetOtp !== normalizedOtp) {
        logger.warn(`Invalid OTP attempt for user ${user.email}. Expected: ${user.passwordResetOtp}, Got: ${normalizedOtp}`);
        throw new ApiError(400, 'Invalid OTP. Please check and try again.');
    }

    user.password = newPassword;
    user.passwordResetOtp = null;
    user.passwordResetOtpExpiresAt = null;
    await addActivity(user, 'RESET_PASSWORD_OTP', {});
    await user.save();

    // Revoke all existing tokens
    await revokeAllUserTokens(user._id);

    logger.info(`Password reset successful for user ${user.email}`);
    sendSuccess(res, 200, 'Password reset successfully');
});

// ─── Update Avatar ────────────────────────────────────────────────────────────
export const updateAvatar = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    if (!req.file || !req.file.buffer) {
        throw new ApiError(400, 'Avatar file is required');
    }

    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');

    const uploadResult = await uploadBuffer(req.file.buffer, 'avatars', 'image');
    if (!uploadResult || !uploadResult.url) {
        throw new ApiError(500, 'Failed to upload avatar');
    }

    user.avatar = {
        publicId: uploadResult.publicId,
        url: uploadResult.url,
    };

    await addActivity(user, 'UPDATE_AVATAR', { avatarUrl: user.avatar.url });
    await user.save({ validateBeforeSave: false });

    sendSuccess(res, 200, 'Avatar updated successfully', { user: getSafeUser(user) });
});

// ─── Update User Profile ──────────────────────────────────────────────────────
export const updateProfile = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { name, phone } = req.body;

    const user = await User.findById(userId);
    if (!user || user.isDeleted) throw new ApiError(404, 'User not found');

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;

    await addActivity(user, 'UPDATE_PROFILE', { updatedFields: Object.keys(req.body) });
    await user.save({ validateBeforeSave: false });

    sendSuccess(res, 200, 'Profile updated successfully', { user: getSafeUser(user) });
});

// ─── Delete Account (Soft Delete) ─────────────────────────────────────────────
export const deleteAccount = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');

    user.isDeleted = true;
    user.deletedAt = new Date();
    await addActivity(user, 'DELETE_ACCOUNT', {});
    await user.save({ validateBeforeSave: false });

    // Revoke all tokens
    await revokeAllUserTokens(userId);

    sendSuccess(res, 200, 'Account deleted successfully');
});

// ─── Get Activity History ─────────────────────────────────────────────────────
export const getActivityHistory = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { limit = 50 } = req.query;

    const user = await User.findById(userId).select('activityHistory');
    if (!user) throw new ApiError(404, 'User not found');

    const activities = (user.activityHistory || [])
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, parseInt(limit));

    sendSuccess(res, 200, 'Activity history retrieved', { activities, total: activities.length });
});

// ─── Get Activity Stats ───────────────────────────────────────────────────────
export const getActivityStats = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const user = await User.findById(userId).select('activityHistory lastActiveAt createdAt');
    if (!user) throw new ApiError(404, 'User not found');

    const activityHistory = user.activityHistory || [];
    const totalActivities = activityHistory.length;

    // Calculate unique active days
    const uniqueDays = new Set();
    activityHistory.forEach(activity => {
        const date = new Date(activity.createdAt).toDateString();
        uniqueDays.add(date);
    });
    const activeDays = uniqueDays.size;

    // Calculate this week's activities
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const thisWeekActivities = activityHistory.filter(
        activity => new Date(activity.createdAt) >= oneWeekAgo
    ).length;

    const stats = {
        totalActivities,
        activeDays,
        thisWeek: thisWeekActivities,
        lastActive: user.lastActiveAt,
        memberSince: user.createdAt,
    };

    sendSuccess(res, 200, 'Activity stats retrieved', stats);
});

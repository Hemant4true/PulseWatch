import rateLimit from 'express-rate-limit';

export const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 100, // 100 requests per IP
  message: { success: false, message: 'Too many requests from this IP, please try again after a minute' }
});

export const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 10, // 10 requests per IP for auth
  message: { success: false, message: 'Too many login attempts, please try again after a minute' }
});

export const createMonitorLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 30, // 30 monitors per IP/user per hour
  message: { success: false, message: 'Monitor creation limit reached. Please try again later.' }
});

export const teamInviteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 10,
  message: { success: false, message: 'Invite limit reached. Please try again later.' }
});

export const testAlertLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 5,
  message: { success: false, message: 'Test alert limit reached. Please try again later.' }
});

export const pdfExportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 10,
  message: { success: false, message: 'PDF export limit reached. Please try again later.' }
});

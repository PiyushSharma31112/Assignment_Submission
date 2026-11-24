import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { loadConfig } from '../config/env.js';
import HttpError from '../utils/HttpError.js';
import asyncHandler from '../utils/asyncHandler.js';

const cookieName = 'assignhub_session';

export function issueSession(res, user) {
  const { jwtSecret, nodeEnv } = loadConfig();
  const token = jwt.sign({ sub: String(user._id), role: user.role }, jwtSecret, { expiresIn: '7d' });
  res.cookie(cookieName, token, {
    httpOnly: true,
    secure: nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearSession(res) {
  const { nodeEnv } = loadConfig();
  res.clearCookie(cookieName, { httpOnly: true, secure: nodeEnv === 'production', sameSite: 'lax', path: '/' });
}

export const requireAuth = asyncHandler(async (req, res, next) => {
  const token = req.cookies[cookieName];
  if (!token) throw new HttpError(401, 'Please sign in to continue.');
  try {
    const { jwtSecret } = loadConfig();
    const payload = jwt.verify(token, jwtSecret);
    const user = await User.findById(payload.sub);
    if (!user) throw new HttpError(401, 'Your session is no longer valid. Please sign in again.');
    req.user = user;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(401, 'Your session is invalid or has expired. Please sign in again.');
  }
  next();
});

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) return next(new HttpError(403, 'You do not have permission to perform this action.'));
    next();
  };
}

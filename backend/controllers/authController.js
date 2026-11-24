import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import HttpError from '../utils/HttpError.js';
import { serializeUser } from '../utils/serializers.js';
import { issueSession, clearSession } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';

function validateCredentials(email, password) {
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || email.length > 254) {
    throw new HttpError(400, 'Enter a valid email address.');
  }
  if (typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
    throw new HttpError(400, 'Password must be at least 8 characters and no more than 72 bytes.');
  }
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 80) {
    throw new HttpError(400, 'Name must be between 2 and 80 characters.');
  }
  validateCredentials(email, password);
  if (!['Student', 'Teacher'].includes(role)) throw new HttpError(400, 'Choose a valid account role.');

  const normalizedEmail = email.trim().toLowerCase();
  if (await User.exists({ email: normalizedEmail })) throw new HttpError(409, 'An account with this email already exists.');
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name: name.trim(), email: normalizedEmail, password: passwordHash, role });
  issueSession(res, user);
  res.status(201).json({ user: serializeUser(user) });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  validateCredentials(email, password);
  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new HttpError(401, 'Email or password is incorrect.');
  }
  issueSession(res, user);
  res.json({ user: serializeUser(user) });
});

export const currentUser = asyncHandler(async (req, res) => {
  res.json({ user: serializeUser(req.user) });
});

export const logout = (req, res) => {
  clearSession(res);
  res.status(204).end();
};

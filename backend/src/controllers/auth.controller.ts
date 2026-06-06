import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/db';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { sendPasswordResetEmail } from '../utils/email';

// POST /api/auth/register
export async function register(req: Request, res: Response) {
  try {
    const { firstName, lastName, username, email, phone, country, additionalInfo, password, role } = req.body;
    const avatarUrl = (req as any).file?.path || null; // Cloudinary URL via Multer

    const exists = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });
    if (exists) return res.status(409).json({ message: 'Email or username already taken' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { firstName, lastName, username, email, phone, country, additionalInfo, avatarUrl, passwordHash, role: role || 'PROCUREMENT_OFFICER' },
    });

    const accessToken = signAccessToken(user.id, user.role);
    const refreshToken = signRefreshToken(user.id);
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.status(201).json({ accessToken, user: { id: user.id, firstName: user.firstName, lastName: user.lastName, username: user.username, email: user.email, role: user.role, avatarUrl: user.avatarUrl } });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err });
  }
}

// POST /api/auth/login
export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !await bcrypt.compare(password, user.passwordHash))
      return res.status(401).json({ message: 'Invalid credentials' });
    if (!user.isActive) return res.status(403).json({ message: 'Account disabled' });

    const accessToken = signAccessToken(user.id, user.role);
    const refreshToken = signRefreshToken(user.id);
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ accessToken, user: { id: user.id, firstName: user.firstName, lastName: user.lastName, username: user.username, email: user.email, role: user.role, avatarUrl: user.avatarUrl } });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err });
  }
}

// POST /api/auth/forgot-password
export async function forgotPassword(req: Request, res: Response) {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.json({ message: 'If account exists, reset email sent' }); // don't leak

    const resetToken = uuidv4();
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await prisma.user.update({ where: { id: user.id }, data: { resetToken, resetTokenExpiry } });
    await sendPasswordResetEmail(email, resetToken);

    res.json({ message: 'Password reset email sent' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send reset email', error: err });
  }
}

// POST /api/auth/reset-password
export async function resetPassword(req: Request, res: Response) {
  try {
    const { token, password } = req.body;
    const user = await prisma.user.findFirst({ where: { resetToken: token, resetTokenExpiry: { gt: new Date() } } });
    if (!user) return res.status(400).json({ message: 'Invalid or expired reset token' });

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash, resetToken: null, resetTokenExpiry: null } });
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Reset failed', error: err });
  }
}

// POST /api/auth/refresh-token
export async function refreshToken(req: Request, res: Response) {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ message: 'No refresh token' });

    const { userId } = verifyRefreshToken(token);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.refreshToken !== token) return res.status(401).json({ message: 'Invalid refresh token' });

    const accessToken = signAccessToken(user.id, user.role);
    res.json({ accessToken });
  } catch {
    res.status(401).json({ message: 'Refresh token expired' });
  }
}

// POST /api/auth/logout
export async function logout(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    if (userId) await prisma.user.update({ where: { id: userId }, data: { refreshToken: null } });
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out' });
  } catch (err) {
    res.status(500).json({ message: 'Logout failed', error: err });
  }
}
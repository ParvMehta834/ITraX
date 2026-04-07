const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const UserModel = require('../config/userModel');
const { isConnected } = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

const DEFAULT_ORG_ID = process.env.DEFAULT_ORG_ID || '000000000000000000000001';
const BOOTSTRAP_ADMIN_EMAIL = (process.env.BOOTSTRAP_ADMIN_EMAIL || 'admin@gmail.com').trim().toLowerCase();
const isProduction = process.env.NODE_ENV === 'production';
const refreshCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const router = express.Router();

router.post('/signup', async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await UserModel.findOne({ email: normalizedEmail, orgId: DEFAULT_ORG_ID });
    if (existing) return res.status(400).json({ message: 'User already exists' });
    const hash = await bcrypt.hash(password, 10);
    const user = await UserModel.create({
      firstName,
      lastName,
      email: normalizedEmail,
      passwordHash: hash,
      role: 'ADMIN',
      orgId: DEFAULT_ORG_ID,
    });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'change_me', { expiresIn: '15m' });
    const refresh = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET || (process.env.JWT_SECRET || 'change_me') + '_refresh', { expiresIn: '7d' });
    res.cookie('refreshToken', refresh, refreshCookieOptions);
    res.json({ token, user: { id: user._id, email: user.email, role: user.role, employeeCode: user.employeeCode || '', firstName, lastName, name: `${firstName} ${lastName}`, orgId: user.orgId } });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
  try {
    const normalizedEmail = email.trim().toLowerCase();
    let user = await UserModel.findOne({ email: normalizedEmail });

    // In mock mode, allow the fixed admin credentials requested for local demo flow.
    if (!isConnected() && normalizedEmail === 'admin@gmail.com' && password === '123456') {
      if (!user) {
        const passwordHash = await bcrypt.hash('123456', 10);
        user = await UserModel.create({
          firstName: 'Admin',
          lastName: 'User',
          email: normalizedEmail,
          passwordHash,
          role: 'ADMIN',
          orgId: DEFAULT_ORG_ID,
          status: 'ACTIVE'
        });
      }

      if (user.role !== 'ADMIN') {
        await UserModel.findByIdAndUpdate(user._id, { role: 'ADMIN' });
        user.role = 'ADMIN';
      }

      if (!user.orgId) {
        await UserModel.findByIdAndUpdate(user._id, { orgId: DEFAULT_ORG_ID });
        user.orgId = DEFAULT_ORG_ID;
      }

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'change_me', { expiresIn: '15m' });
      const refresh = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET || (process.env.JWT_SECRET || 'change_me') + '_refresh', { expiresIn: '7d' });
      res.cookie('refreshToken', refresh, refreshCookieOptions);
      return res.json({ token, user: { id: user._id, email: user.email, role: user.role, employeeCode: user.employeeCode || '', firstName: user.firstName, lastName: user.lastName, name: `${user.firstName} ${user.lastName}`, orgId: user.orgId } });
    }

    // Demo employee account for tracking visibility in mock mode.
    if (!isConnected() && normalizedEmail === 'rahul@itrax.local' && password === '123456') {
      if (!user) {
        const passwordHash = await bcrypt.hash('123456', 10);
        user = await UserModel.create({
          firstName: 'Rahul',
          lastName: 'Sharma',
          email: normalizedEmail,
          employeeCode: '100001',
          passwordHash,
          role: 'EMPLOYEE',
          orgId: DEFAULT_ORG_ID,
          status: 'ACTIVE'
        });
      }

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'change_me', { expiresIn: '15m' });
      const refresh = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET || (process.env.JWT_SECRET || 'change_me') + '_refresh', { expiresIn: '7d' });
      res.cookie('refreshToken', refresh, refreshCookieOptions);
      return res.json({ token, user: { id: user._id, email: user.email, role: user.role, employeeCode: user.employeeCode || '', firstName: user.firstName, lastName: user.lastName, name: `${user.firstName} ${user.lastName}`, orgId: user.orgId } });
    }

    // Test employee account for professor demo.
    if (!isConnected() && normalizedEmail === 'user@gmail.com' && password === '000000') {
      if (!user) {
        const passwordHash = await bcrypt.hash('000000', 10);
        user = await UserModel.create({
          firstName: 'Test',
          lastName: 'User',
          email: normalizedEmail,
          employeeCode: '100002',
          passwordHash,
          role: 'EMPLOYEE',
          orgId: DEFAULT_ORG_ID,
          status: 'ACTIVE'
        });
      }

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'change_me', { expiresIn: '15m' });
      const refresh = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET || (process.env.JWT_SECRET || 'change_me') + '_refresh', { expiresIn: '7d' });
      res.cookie('refreshToken', refresh, refreshCookieOptions);
      return res.json({ token, user: { id: user._id, email: user.email, role: user.role, employeeCode: user.employeeCode || '', firstName: user.firstName, lastName: user.lastName, name: `${user.firstName} ${user.lastName}`, orgId: user.orgId } });
    }

    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const ok = await user.comparePassword(password);
    if (!ok) return res.status(400).json({ message: 'Invalid credentials' });
    if (normalizedEmail === BOOTSTRAP_ADMIN_EMAIL && user.role !== 'ADMIN') {
      await UserModel.findByIdAndUpdate(user._id, { role: 'ADMIN' });
      user.role = 'ADMIN';
    }
    if (!user.orgId) {
      await UserModel.findByIdAndUpdate(user._id, { orgId: DEFAULT_ORG_ID });
      user.orgId = DEFAULT_ORG_ID;
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'change_me', { expiresIn: '15m' });
    const refresh = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET || (process.env.JWT_SECRET || 'change_me') + '_refresh', { expiresIn: '7d' });
    res.cookie('refreshToken', refresh, refreshCookieOptions);
    res.json({ token, user: { id: user._id, email: user.email, role: user.role, employeeCode: user.employeeCode || '', firstName: user.firstName, lastName: user.lastName, name: `${user.firstName} ${user.lastName}`, orgId: user.orgId } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'change_me');
    const user = await UserModel.findById(payload.id);
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    // Return without passwordHash
    const userObj = user.toObject ? user.toObject() : { ...user };
    const { passwordHash, ...userWithoutPassword } = userObj;
    res.json({ user: userWithoutPassword });
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

router.put('/me', authMiddleware, async (req, res) => {
  try {
    const { firstName, lastName, phone, department, password } = req.body || {};
    const updates = {};

    if (typeof firstName === 'string' && firstName.trim()) updates.firstName = firstName.trim();
    if (typeof lastName === 'string' && lastName.trim()) updates.lastName = lastName.trim();
    if (typeof phone === 'string') updates.phone = phone.trim();
    if (typeof department === 'string') updates.department = department.trim();

    if (typeof password === 'string' && password.trim()) {
      if (password.trim().length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
      }
      updates.passwordHash = await bcrypt.hash(password.trim(), 10);
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No valid profile fields provided' });
    }

    const updated = await UserModel.findByIdAndUpdate(req.user._id, updates, { new: true });
    const userObj = updated?.toObject ? updated.toObject() : { ...updated };
    if (userObj.passwordHash) delete userObj.passwordHash;

    return res.json({ user: userObj });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update profile', error: err.message });
  }
});

router.post('/refresh', async (req, res) => {
  const token = req.cookies && req.cookies.refreshToken;
  if (!token) return res.status(401).json({ message: 'No refresh token' });
  try {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET || (process.env.JWT_SECRET || 'change_me') + '_refresh');
    const user = await UserModel.findById(payload.id);
    if (!user) return res.status(401).json({ message: 'Invalid refresh token' });
    const newToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'change_me', { expiresIn: '15m' });
    const userObj = user.toObject ? user.toObject() : { ...user };
    if (userObj.passwordHash) delete userObj.passwordHash;
    res.json({ token: newToken, user: userObj });
  } catch (err) {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: refreshCookieOptions.secure,
    sameSite: refreshCookieOptions.sameSite,
  });
  res.json({ ok: true });
});

module.exports = router;

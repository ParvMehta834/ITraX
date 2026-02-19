const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const UserModel = require('../config/userModel');

const DEFAULT_ORG_ID = process.env.DEFAULT_ORG_ID || new mongoose.Types.ObjectId().toString();

const router = express.Router();

router.post('/signup', async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await UserModel.findOne({ email: normalizedEmail, orgId: DEFAULT_ORG_ID });
    if (existing) return res.status(400).json({ message: 'User already exists' });
    const isFirst = (await UserModel.countDocuments({})) === 0;
    const role = isFirst ? 'ADMIN' : 'EMPLOYEE';
    const hash = await bcrypt.hash(password, 10);
    const user = await UserModel.create({
      firstName,
      lastName,
      email: normalizedEmail,
      passwordHash: hash,
      role,
      orgId: DEFAULT_ORG_ID,
    });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'change_me', { expiresIn: '15m' });
    const refresh = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET || (process.env.JWT_SECRET || 'change_me') + '_refresh', { expiresIn: '7d' });
    res.cookie('refreshToken', refresh, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ token, user: { id: user._id, email: user.email, role: user.role, firstName, lastName, name: `${firstName} ${lastName}`, orgId: user.orgId } });
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
    const user = await UserModel.findOne({ email: normalizedEmail });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const ok = await user.comparePassword(password);
    if (!ok) return res.status(400).json({ message: 'Invalid credentials' });
    if (!user.orgId) {
      await UserModel.findByIdAndUpdate(user._id, { orgId: DEFAULT_ORG_ID });
      user.orgId = DEFAULT_ORG_ID;
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'change_me', { expiresIn: '15m' });
    const refresh = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET || (process.env.JWT_SECRET || 'change_me') + '_refresh', { expiresIn: '7d' });
    res.cookie('refreshToken', refresh, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ token, user: { id: user._id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName, name: `${user.firstName} ${user.lastName}`, orgId: user.orgId } });
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
    const { passwordHash, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
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
    res.json({ token: newToken, user });
  } catch (err) {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('refreshToken');
  res.json({ ok: true });
});

module.exports = router;

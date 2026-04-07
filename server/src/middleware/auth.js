const jwt = require('jsonwebtoken');
const UserModel = require('../config/userModel');

const BOOTSTRAP_ADMIN_EMAIL = (process.env.BOOTSTRAP_ADMIN_EMAIL || 'admin@gmail.com').trim().toLowerCase();

const normalizeRole = (role) => String(role || '').trim().toUpperCase();

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'change_me');
    let user = await UserModel.findById(payload.id);
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    // Repair legacy bootstrap admin records so admin-only endpoints do not fail on stale role values.
    if (String(user.email || '').trim().toLowerCase() === BOOTSTRAP_ADMIN_EMAIL && normalizeRole(user.role) !== 'ADMIN') {
      user.role = 'ADMIN';
      await user.save();
    }

    const userObj = user.toObject ? user.toObject() : { ...user };
    userObj.role = normalizeRole(userObj.role);
    if (userObj.passwordHash) delete userObj.passwordHash;
    req.user = userObj;
    req.userId = String(userObj._id);
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const requireRole = (role) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  if (normalizeRole(req.user.role) !== normalizeRole(role)) return res.status(403).json({ message: 'Forbidden' });
  next();
};

module.exports = { authMiddleware, requireRole };

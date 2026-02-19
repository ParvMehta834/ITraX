const jwt = require('jsonwebtoken');
const UserModel = require('../config/userModel');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'change_me');
    const user = await UserModel.findById(payload.id);
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    const userObj = user.toObject ? user.toObject() : { ...user };
    if (userObj.passwordHash) delete userObj.passwordHash;
    req.user = userObj;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const requireRole = (role) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  if (req.user.role !== role) return res.status(403).json({ message: 'Forbidden' });
  next();
};

module.exports = { authMiddleware, requireRole };

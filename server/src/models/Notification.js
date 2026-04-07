const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  targetRole: { type: String },
  title: String,
  message: String,
  type: String,
  createdAt: { type: Date, default: Date.now },
  read: { type: Boolean, default: false }
});

NotificationSchema.index({ orgId: 1, userId: 1, createdAt: -1 });
NotificationSchema.index({ orgId: 1, targetRole: 1, createdAt: -1 });

module.exports = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

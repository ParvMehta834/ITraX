const mongoose = require('mongoose');

const OrganizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Organization name is required'],
    trim: true,
  },
  plan: {
    type: String,
    enum: ['Free', 'Paid', 'Enterprise'],
    default: 'Free',
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

OrganizationSchema.index({ name: 1 });

module.exports = mongoose.models.Organization || mongoose.model('Organization', OrganizationSchema);

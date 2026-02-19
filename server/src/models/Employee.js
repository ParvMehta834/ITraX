const mongoose = require('mongoose');

const EmployeeSchema = new mongoose.Schema({
  orgId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization ID is required'],
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
  },
  phone: String,
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
  },
  locationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
  },
  status: {
    type: String,
    enum: ['Active', 'OnLeave', 'Inactive'],
    default: 'Active',
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

// Unique compound indexes
EmployeeSchema.index({ orgId: 1, email: 1 }, { unique: true });
EmployeeSchema.index({ orgId: 1, departmentId: 1 });
EmployeeSchema.index({ orgId: 1, locationId: 1 });
EmployeeSchema.index({ orgId: 1, status: 1 });

module.exports = mongoose.models.Employee || mongoose.model('Employee', EmployeeSchema);

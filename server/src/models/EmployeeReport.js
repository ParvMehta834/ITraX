const mongoose = require('mongoose');

const EmployeeReportSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Employee ID is required'],
    },
    employeeName: {
      type: String,
      required: [true, 'Employee name is required'],
      trim: true,
    },
    employeeEmail: {
      type: String,
      required: [true, 'Employee email is required'],
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['OPEN', 'SOLVED'],
      default: 'OPEN',
    },
    adminFeedback: {
      type: String,
      default: '',
      trim: true,
    },
    feedbackBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    feedbackAt: Date,
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

EmployeeReportSchema.index({ orgId: 1, employeeId: 1, createdAt: -1 });
EmployeeReportSchema.index({ orgId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.models.EmployeeReport || mongoose.model('EmployeeReport', EmployeeReportSchema);
const mongoose = require('mongoose');

const DepartmentSchema = new mongoose.Schema({
  orgId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization ID is required'],
  },
  name: {
    type: String,
    required: [true, 'Department name is required'],
    trim: true,
  },
  description: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Unique compound index
DepartmentSchema.index({ orgId: 1, name: 1 }, { unique: true });
DepartmentSchema.index({ orgId: 1 });

module.exports = mongoose.models.Department || mongoose.model('Department', DepartmentSchema);

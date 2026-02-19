const mongoose = require('mongoose');

const ReportDefinitionSchema = new mongoose.Schema({
  orgId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Report name is required'],
    trim: true,
  },
  category: {
    type: String,
    enum: ['Assets', 'Employees', 'Licenses', 'Inventory', 'Orders'],
    required: true,
  },
  format: {
    type: String,
    enum: ['PDF', 'CSV', 'Excel'],
    default: 'CSV',
  },
  queryKey: {
    type: String,
    required: [true, 'Query key is required'],
  },
  description: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

ReportDefinitionSchema.index({ orgId: 1, category: 1 });
ReportDefinitionSchema.index({ orgId: 1, queryKey: 1 });

module.exports = mongoose.models.ReportDefinition || mongoose.model('ReportDefinition', ReportDefinitionSchema);

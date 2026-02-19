const mongoose = require('mongoose');

const AssetAssignmentHistorySchema = new mongoose.Schema({
  orgId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  assetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
    required: true,
  },
  fromEmployeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
  },
  toEmployeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  changedAt: {
    type: Date,
    default: Date.now,
  },
  note: String,
});

AssetAssignmentHistorySchema.index({ orgId: 1, assetId: 1 });
AssetAssignmentHistorySchema.index({ orgId: 1, toEmployeeId: 1 });
AssetAssignmentHistorySchema.index({ orgId: 1, changedAt: -1 });

module.exports = mongoose.models.AssetAssignmentHistory || mongoose.model('AssetAssignmentHistory', AssetAssignmentHistorySchema);

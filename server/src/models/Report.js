const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  reportType: { type: String, enum: ['ASSET','EMPLOYEE','LICENSE'] },
  title: String,
  description: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['OPEN','RESOLVED'], default: 'OPEN' },
  adminNotes: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Report || mongoose.model('Report', ReportSchema);

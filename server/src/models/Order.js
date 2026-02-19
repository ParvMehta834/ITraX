const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  orderId: String,
  type: { type: String, enum: ['COMPANY','EMPLOYEE'], default: 'EMPLOYEE' },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assetRequestDetails: String,
  supplier: String,
  statusTimeline: [{ status: String, date: Date, location: String }],
  currentLocation: String,
  estDelivery: Date,
  status: String
});

module.exports = mongoose.models.Order || mongoose.model('Order', OrderSchema);

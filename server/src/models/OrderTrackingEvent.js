const mongoose = require('mongoose');

const OrderTrackingEventSchema = new mongoose.Schema({
  orgId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProcurementOrder',
    required: true,
  },
  stage: {
    type: String,
    enum: ['Ordered', 'Processing', 'Shipped', 'InTransit', 'OutForDelivery', 'Delivered', 'Cancelled'],
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  note: String,
});

OrderTrackingEventSchema.index({ orgId: 1, orderId: 1 });
OrderTrackingEventSchema.index({ orgId: 1, stage: 1 });
OrderTrackingEventSchema.index({ orgId: 1, date: -1 });

module.exports = mongoose.models.OrderTrackingEvent || mongoose.model('OrderTrackingEvent', OrderTrackingEventSchema);

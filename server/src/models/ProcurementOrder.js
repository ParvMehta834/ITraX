const mongoose = require('mongoose');

const ProcurementOrderSchema = new mongoose.Schema({
  orgId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  orderId: {
    type: String,
    required: [true, 'Order ID is required'],
    trim: true,
  },
  supplier: {
    type: String,
    required: [true, 'Supplier is required'],
    trim: true,
  },
  assetName: {
    type: String,
    required: [true, 'Asset name is required'],
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: 1,
  },
  orderDate: {
    type: Date,
    default: Date.now,
  },
  estimatedDelivery: Date,
  currentLocationText: String,
  status: {
    type: String,
    enum: ['Ordered', 'Processing', 'Shipped', 'InTransit', 'OutForDelivery', 'Delivered', 'Cancelled'],
    default: 'Ordered',
  },
  createdBy: {
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

// Indexes
ProcurementOrderSchema.index({ orgId: 1, orderId: 1 }, { unique: true });
ProcurementOrderSchema.index({ orgId: 1, status: 1 });
ProcurementOrderSchema.index({ orgId: 1, orderDate: -1 });
// Text index
ProcurementOrderSchema.index({ orgId: 1, orderId: 'text', supplier: 'text', assetName: 'text' });

module.exports = mongoose.models.ProcurementOrder || mongoose.model('ProcurementOrder', ProcurementOrderSchema);

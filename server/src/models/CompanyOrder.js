const mongoose = require('mongoose');

const CompanyOrderSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    orderId: { type: String, required: true, unique: true },
    assetName: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 },
    supplier: { type: String, required: true },
    assignedEmployeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assignedEmployeeCode: { type: String },
    assignedEmployeeName: { type: String },
    orderDate: { type: Date, default: Date.now },
    estimatedDelivery: { type: Date, required: true },
    currentLocation: { type: String, required: true },
    status: {
      type: String,
      enum: ['Ordered', 'Processing', 'Shipped', 'InTransit', 'OutForDelivery', 'Delivered'],
      default: 'Ordered'
    },
    trackingHistory: [
      {
        stage: String,
        date: { type: Date, default: Date.now },
        _id: false
      }
    ],
    notes: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

// Text indexes for search
CompanyOrderSchema.index({ orderId: 'text', assetName: 'text', supplier: 'text' });
CompanyOrderSchema.index({ assignedEmployeeId: 1 });
CompanyOrderSchema.index({ assignedEmployeeCode: 1 });

module.exports = mongoose.models.CompanyOrder || mongoose.model('CompanyOrder', CompanyOrderSchema);

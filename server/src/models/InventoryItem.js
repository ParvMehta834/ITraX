const mongoose = require('mongoose');

const InventoryItemSchema = new mongoose.Schema({
  orgId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization ID is required'],
  },
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
  },
  locationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: false,
  },
  location: {
    type: String,
    trim: true,
  },
  quantityOnHand: {
    type: Number,
    default: 0,
    min: 0,
  },
  quantityMinimum: {
    type: Number,
    default: 0,
    min: 0,
  },
  costPerItem: {
    type: Number,
    default: 0,
    min: 0,
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
InventoryItemSchema.index({ orgId: 1, name: 1 });
InventoryItemSchema.index({ orgId: 1, locationId: 1 });
// Text index for search
InventoryItemSchema.index({ orgId: 1, name: 'text' });

// Virtual for computed total (not stored)
InventoryItemSchema.virtual('total').get(function () {
  return this.quantityOnHand * this.costPerItem;
});

module.exports = mongoose.models.InventoryItem || mongoose.model('InventoryItem', InventoryItemSchema);

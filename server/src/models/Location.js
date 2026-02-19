const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
    },
    name: {
      type: String,
      required: [true, 'Location name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['Office', 'Warehouse'],
      required: true,
    },
    address: String,
    city: String,
    state: String,
    country: String,
    capacity: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
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
  },
  { timestamps: false }
);

// Compound unique index
LocationSchema.index({ orgId: 1, name: 1 }, { unique: true });
LocationSchema.index({ orgId: 1, type: 1 });
LocationSchema.index({ orgId: 1, status: 1 });
// Text index for search
LocationSchema.index({ orgId: 1, name: 'text', city: 'text', state: 'text' });

module.exports = mongoose.models.Location || mongoose.model('Location', LocationSchema);

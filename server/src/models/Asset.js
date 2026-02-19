const mongoose = require('mongoose');

const AssetSchema = new mongoose.Schema({
  orgId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization ID is required'],
  },
  assetTag: {
    type: String,
    required: [true, 'Asset tag is required'],
    trim: true,
  },
  assetId: {
    type: String,
    trim: true,
  },
  name: {
    type: String,
    required: [true, 'Asset name is required'],
    trim: true,
  },
  category: {
    type: String,
    trim: true,
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
  },
  category: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['Available', 'Assigned', 'Maintenance', 'Retired'],
    default: 'Available',
  },
  manufacturer: String,
  model: String,
  serialNumber: {
    type: String,
    sparse: true,
  },
  purchaseDate: Date,
  warrantyExpiry: Date,
  warrantyExpiryDate: Date,
  endOfLifeDate: Date,
  locationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
  },
  currentLocation: {
    type: String,
    trim: true,
  },
  assignedToEmployeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
  },
  currentEmployee: {
    type: String,
    trim: true,
  },
  assignedAt: Date,
  returnedAt: Date,
  cost: {
    type: Number,
    default: 0,
  },
  notes: String,
  imageUrl: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  isDeleted: {
    type: Boolean,
    default: false,
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

// Compound unique indexes (sparse for optional fields)
AssetSchema.index({ orgId: 1, assetTag: 1 }, { unique: true });
AssetSchema.index({ orgId: 1, serialNumber: 1 }, { unique: true, sparse: true });

// Standard indexes for filtering and aggregations
AssetSchema.index({ orgId: 1, categoryId: 1 });
AssetSchema.index({ orgId: 1, locationId: 1 });
AssetSchema.index({ orgId: 1, assignedToEmployeeId: 1 });
AssetSchema.index({ orgId: 1, status: 1 });
AssetSchema.index({ orgId: 1, isDeleted: 1 });
AssetSchema.index({ orgId: 1, warrantyExpiry: 1 });

// Text index for search
AssetSchema.index({
  orgId: 1,
  assetTag: 'text',
  name: 'text',
  manufacturer: 'text',
  model: 'text',
  serialNumber: 'text',
});

// Pre-validate hook: backfill required fields for legacy payloads
AssetSchema.pre('validate', function (next) {
  if (!this.assetTag && this.assetId) {
    this.assetTag = this.assetId;
  }
  if (!this.name) {
    if (this.manufacturer || this.model) {
      this.name = [this.manufacturer, this.model].filter(Boolean).join(' ');
    } else {
      this.name = this.assetTag || this.assetId || 'Asset';
    }
  }
  next();
});

// Pre-save hook: Validate status and assignedToEmployeeId relationship
AssetSchema.pre('save', function (next) {
  if (this.assignedToEmployeeId && this.status !== 'Assigned') {
    this.status = 'Assigned';
  }
  if (!this.assignedToEmployeeId && this.status === 'Assigned') {
    // Clear assignment fields
    this.assignedAt = null;
  }
  next();
});

module.exports = mongoose.models.Asset || mongoose.model('Asset', AssetSchema);

const mongoose = require('mongoose');

const LicenseSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
    },
    name: {
      type: String,
      required: [true, 'License name is required'],
      trim: true,
    },
    vendor: String,
    seatsTotal: {
      type: Number,
      required: [true, 'Total seats required'],
      min: 1,
    },
    seats: {
      type: Number,
      min: 1,
    },
    seatsAssigned: {
      type: Number,
      default: 0,
      min: 0,
    },
    renewalDate: {
      type: Date,
      required: [true, 'Renewal date is required'],
    },
    cost: {
      type: Number,
      required: [true, 'Cost is required'],
      min: 0,
    },
    status: {
      type: String,
      enum: ['Active', 'ExpiringSoon', 'Expired'],
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

// Indexes
LicenseSchema.index({ orgId: 1, name: 1 });
LicenseSchema.index({ orgId: 1, renewalDate: 1 });
LicenseSchema.index({ orgId: 1, status: 1 });
// Text index for search
LicenseSchema.index({ orgId: 1, name: 'text', vendor: 'text' });

// Pre-validate hook to normalize legacy fields
LicenseSchema.pre('validate', function (next) {
  if ((!this.seatsTotal || this.seatsTotal < 1) && this.seats) {
    this.seatsTotal = this.seats;
  }
  if (this.status === 'Expiring Soon') {
    this.status = 'ExpiringSoon';
  }
  next();
});

// Pre-save hook to update status based on renewal date
LicenseSchema.pre('save', function (next) {
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  if (this.renewalDate < now) {
    this.status = 'Expired';
  } else if (this.renewalDate <= thirtyDaysFromNow) {
    this.status = 'ExpiringSoon';
  } else {
    this.status = 'Active';
  }

  next();
});

module.exports = mongoose.models.License || mongoose.model('License', LicenseSchema);

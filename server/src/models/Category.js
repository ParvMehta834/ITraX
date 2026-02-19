const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
    },
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
    },
    description: String,
    iconKey: {
      type: String,
      default: 'Package',
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
CategorySchema.index({ orgId: 1, name: 1 }, { unique: true });
CategorySchema.index({ orgId: 1 });
// Text index for search
CategorySchema.index({ orgId: 1, name: 'text', description: 'text' });

module.exports = mongoose.models.Category || mongoose.model('Category', CategorySchema);

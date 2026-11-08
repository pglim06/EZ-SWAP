const mongoose = require('mongoose');

// Embedded subdocument schema for listing images (maps to ListingImage entity)
const listingImageSchema = new mongoose.Schema(
  {
    imageUrl: {
      type: String,
      required: [true, 'Image URL is required'],
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    _id: true,
  }
);

const listingSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Seller is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['Textbooks', 'Electronics', 'Dorm', 'Services', 'Clothing', 'Other'],
        message: '{VALUE} is not a valid category',
      },
    },
    condition: {
      type: String,
      required: [true, 'Condition is required'],
      enum: {
        values: ['New', 'Like New', 'Good', 'Fair', 'Poor'],
        message: '{VALUE} is not a valid condition',
      },
    },
    images: [listingImageSchema],
    status: {
      type: String,
      enum: ['active', 'reserved', 'sold', 'removed'],
      default: 'active',
    },
  },
  {
    timestamps: true, // createdAt + updatedAt
  }
);

// Compound index for category browsing with status filter (F-18, F-05)
listingSchema.index({ category: 1, status: 1 });

// Text index for keyword search (F-05: Product Discovery & Search)
listingSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Listing', listingSchema);

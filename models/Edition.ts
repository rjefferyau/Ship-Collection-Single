import mongoose from 'mongoose';

export interface IEdition extends Document {
  name: string;
  internalName: string; // Unique identifier combining name and franchise
  description?: string;
  retailPrice?: number; // Recommended Retail Price for the collection
  franchise: string; // The franchise this edition belongs to (e.g., "Star Trek", "Battlestar Galactica")
  isDefault?: boolean; // Whether this edition should be shown by default
  createdAt: Date;
  updatedAt: Date;
}

// Define schema
const EditionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Edition name is required'],
      trim: true
    },
    internalName: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    retailPrice: {
      type: Number
    },
    franchise: {
      type: String,
      required: [true, 'Franchise is required'],
      trim: true
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret._id = ret._id.toString();
        return ret;
      },
      virtuals: true
    }
  }
);

// Generate internal name from name and franchise
EditionSchema.pre('save', function(next) {
  // Only generate internal name if one is not provided
  if (!this.internalName && (this.isModified('name') || this.isModified('franchise'))) {
    // Create a slug-like internal name by combining name and franchise
    // Convert to lowercase, replace spaces with hyphens, and remove special characters
    const nameSlug = this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    const franchiseSlug = this.franchise.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    this.internalName = `${nameSlug}-${franchiseSlug}`;
  }
  next();
});

// Create a compound index on name and franchise to ensure uniqueness within a franchise
EditionSchema.index({ name: 1, franchise: 1 }, { unique: true });

// Create or get the model
export default mongoose.models.Edition || mongoose.model('Edition', EditionSchema); 
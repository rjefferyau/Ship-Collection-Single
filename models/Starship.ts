import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IStarship extends Document {
  originalId?: mongoose.Types.ObjectId; // Reference to the original ID from starshipv4
  issue: string;
  edition: string;  // Display name of the edition (for backward compatibility)
  editionInternalName?: string; // Internal name of the edition (for uniqueness across franchises)
  shipName: string;  // "Ship Name" from CSV
  faction: string;   // "Race/Faction" from CSV
  franchise?: string; // The franchise this item belongs to
  manufacturer?: string; // The manufacturer of the starship
  releaseDate?: Date; // "Release Date" from CSV
  imageUrl?: string;  // "Image" field
  magazinePdfUrl?: string; // URL to the PDF magazine
  owned: boolean;
  wishlist: boolean; // Added to wishlist for future purchase
  wishlistPriority?: number; // Priority in the wishlist (lower number = higher priority)
  onOrder: boolean; // Whether the item is currently on order
  pricePaid?: number; // Price paid for the order
  orderDate?: Date; // When the order was placed
  retailPrice?: number; // Recommended Retail Price
  purchasePrice?: number; // My Purchase Price
  marketValue?: number; // Current Market Value
  condition?: string; // Condition of the item (Mint, Near Mint, etc.)
  conditionNotes?: string; // Notes about the condition
  conditionPhotos?: string[]; // URLs to photos documenting condition
  lastInspectionDate?: Date; // When the item was last inspected
  editionObjectId?: mongoose.Types.ObjectId; // Add edition ObjectId reference for improved MongoDB relationships
  sightings?: Array<{
    location: string; // Where the item was seen (store name, website, etc.)
    date: Date; // When it was seen
    price: number; // Price at the time of sighting
    url?: string; // Link to the listing if available
    notes?: string; // Any additional notes about the sighting
  }>;
}

const StarshipSchema: Schema = new Schema({
  originalId: { type: Schema.Types.ObjectId, ref: 'Starship', index: true },
  issue: {
    type: String,
    required: [true, 'Issue number is required'],
    trim: true
  },
  edition: {
    type: String,
    required: [true, 'Edition is required'],
    trim: true
  },
  editionInternalName: {
    type: String,
    trim: true
  },
  editionObjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Edition'
  },
  shipName: {
    type: String,
    required: [true, 'Ship name is required'],
    trim: true
  },
  faction: {
    type: String,
    required: [true, 'Faction is required'],
    trim: true
  },
  franchise: {
    type: String,
    trim: true
  },
  manufacturer: {
    type: String,
    trim: true
  },
  collectionType: {
    type: String,
    trim: true
  },
  releaseDate: { type: Date },
  imageUrl: {
    type: String,
    trim: true
  },
  magazinePdfUrl: { type: String },
  owned: {
    type: Boolean,
    default: true
  },
  wishlist: { type: Boolean, default: false },
  wishlistPriority: { type: Number },
  onOrder: { type: Boolean, default: false },
  pricePaid: { type: Number },
  orderDate: { type: Date },
  retailPrice: { type: Number },
  purchasePrice: { type: Number },
  purchaseDate: { type: Date },
  marketValue: { type: Number },
  condition: {
    type: String,
    trim: true
  },
  conditionNotes: { type: String },
  conditionPhotos: [{ type: String }],
  lastInspectionDate: { type: Date },
  notes: {
    type: String,
    trim: true
  },
  sightings: [{
    location: {
      type: String,
      required: true,
      trim: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    price: {
      type: Number
    },
    url: {
      type: String,
      trim: true
    },
    notes: {
      type: String,
      trim: true
    }
  }]
}, {
  timestamps: true,
  collection: 'starshipv5',
  toJSON: {
    transform: function (doc, ret) {
      if (ret._id) ret._id = ret._id.toString();
      if (ret.editionObjectId) ret.editionObjectId = ret.editionObjectId.toString();
      return ret;
    },
    virtuals: true
  }
});

// Create a compound unique index for issue and edition
StarshipSchema.index({ issue: 1, edition: 1 }, { unique: true });

// Create indexes for improved query performance
StarshipSchema.index({ edition: 1 });
StarshipSchema.index({ shipName: 1 });
StarshipSchema.index({ faction: 1 });
StarshipSchema.index({ franchise: 1 });
StarshipSchema.index({ manufacturer: 1 });
StarshipSchema.index({ owned: 1 });
StarshipSchema.index({ editionObjectId: 1 });

// Check if the model already exists to prevent overwriting during hot reloads
let Starship: Model<IStarship>;

// Use a different model name to avoid conflicts with existing models
const MODEL_NAME = 'StarshipV5';

try {
  // Try to get the existing model
  Starship = mongoose.model<IStarship>(MODEL_NAME);
} catch (e) {
  // Model doesn't exist, create it
  Starship = mongoose.model<IStarship>(MODEL_NAME, StarshipSchema);
}

export default Starship; 
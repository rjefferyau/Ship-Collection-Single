import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IStarship extends Document {
  issue: string;
  edition: string;
  shipName: string;  // "Ship Name" from CSV
  faction: string;   // "Race/Faction" from CSV
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
}

const StarshipSchema: Schema = new Schema({
  issue: { type: String, required: true },
  edition: { type: String, required: true },
  shipName: { type: String, required: true },
  faction: { type: String, required: true },
  releaseDate: { type: Date },
  imageUrl: { type: String },
  magazinePdfUrl: { type: String },
  owned: { type: Boolean, default: false },
  wishlist: { type: Boolean, default: false },
  wishlistPriority: { type: Number },
  onOrder: { type: Boolean, default: false },
  pricePaid: { type: Number },
  orderDate: { type: Date },
  retailPrice: { type: Number },
  purchasePrice: { type: Number },
  marketValue: { type: Number },
  condition: { type: String },
  conditionNotes: { type: String },
  conditionPhotos: [{ type: String }],
  lastInspectionDate: { type: Date }
}, {
  timestamps: true
});

// Create a compound unique index for issue and edition
StarshipSchema.index({ issue: 1, edition: 1 }, { unique: true });

// Check if the model already exists to prevent overwriting during hot reloads
let Starship: Model<IStarship>;

// Use a different model name to avoid conflicts with existing models
const MODEL_NAME = 'StarshipV4';

try {
  // Try to get the existing model
  Starship = mongoose.model<IStarship>(MODEL_NAME);
} catch (e) {
  // Model doesn't exist, create it
  Starship = mongoose.model<IStarship>(MODEL_NAME, StarshipSchema);
}

export default Starship; 
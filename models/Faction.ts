import mongoose, { Document, Schema } from 'mongoose';

export interface IFaction extends Document {
  name: string;
  description?: string;
  franchise: string; // The franchise this faction belongs to (e.g., "Star Trek", "Battlestar Galactica")
  createdAt: Date;
  updatedAt: Date;
}

const FactionSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Faction name is required'],
      unique: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    franchise: {
      type: String,
      required: [true, 'Franchise is required'],
      default: 'Star Trek',
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Create or retrieve the model
export default mongoose.models.Faction || mongoose.model<IFaction>('Faction', FactionSchema); 
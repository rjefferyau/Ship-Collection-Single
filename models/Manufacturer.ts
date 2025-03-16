import mongoose, { Document, Schema } from 'mongoose';

export interface IManufacturer extends Document {
  name: string;
  description?: string;
  website?: string;
  country?: string;
  franchises?: string[]; // Associated franchises
  createdAt: Date;
  updatedAt: Date;
}

const ManufacturerSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Manufacturer name is required'],
      unique: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    website: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      trim: true
    },
    franchises: [{
      type: String,
      trim: true
    }]
  },
  {
    timestamps: true
  }
);

// Create or retrieve the model
export default mongoose.models.Manufacturer || mongoose.model<IManufacturer>('Manufacturer', ManufacturerSchema); 
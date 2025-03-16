import mongoose, { Document, Schema } from 'mongoose';

export interface IFranchise extends Document {
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FranchiseSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Franchise name is required'],
      unique: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Create or retrieve the model
export default mongoose.models.Franchise || mongoose.model<IFranchise>('Franchise', FranchiseSchema); 
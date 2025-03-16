import mongoose, { Document, Schema } from 'mongoose';

export interface ICollectionType extends Document {
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CollectionTypeSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Collection type name is required'],
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
export default mongoose.models.CollectionType || mongoose.model<ICollectionType>('CollectionType', CollectionTypeSchema); 
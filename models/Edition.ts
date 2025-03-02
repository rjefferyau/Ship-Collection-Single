import mongoose, { Document, Schema } from 'mongoose';

export interface IEdition extends Document {
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EditionSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Edition name is required'],
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
export default mongoose.models.Edition || mongoose.model<IEdition>('Edition', EditionSchema); 
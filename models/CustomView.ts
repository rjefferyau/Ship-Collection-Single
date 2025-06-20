import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomView extends Document {
  name: string;
  columns: {
    key: string;
    order: number;
    alignment?: 'left' | 'center' | 'right';
    width?: string;
  }[];
  filters: any;
  sortConfig: { key: string; direction: 'asc' | 'desc' };
  isDefault: boolean;
}

const CustomViewSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'View name is required'],
    trim: true
  },
  columns: [{
    key: {
      type: String,
      required: true
    },
    order: {
      type: Number,
      required: true
    },
    alignment: {
      type: String,
      enum: ['left', 'center', 'right'],
      default: 'left'
    },
    width: {
      type: String
    }
  }],
  filters: {
    type: Schema.Types.Mixed
  },
  sortConfig: {
    key: {
      type: String
    },
    direction: {
      type: String,
      enum: ['asc', 'desc'],
      default: 'asc'
    }
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Ensure only one default view exists
CustomViewSchema.pre('save', async function(next) {
  const customView = this as ICustomView;
  
  if (customView.isDefault) {
    await mongoose.model('CustomView').updateMany(
      { _id: { $ne: customView._id } },
      { $set: { isDefault: false } }
    );
  }
  
  next();
});

export default mongoose.models.CustomView || mongoose.model<ICustomView>('CustomView', CustomViewSchema); 
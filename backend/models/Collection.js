import mongoose from 'mongoose';

const collectionSchema = new mongoose.Schema(
  {
    customId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Collection name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    baseUrl: {
      type: String,
      default: 'https://api.apiforge.dev/v1',
      trim: true,
    },
    category: {
      type: String,
      default: 'Core Services',
      trim: true,
    },
    version: {
      type: String,
      default: 'v1.0.0',
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'beta', 'deprecated', 'draft'],
      default: 'active',
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    endpointsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret.customId || ret._id.toString();
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret.customId || ret._id.toString();
        return ret;
      },
    },
  }
);

export const Collection = mongoose.model('Collection', collectionSchema);
export default Collection;

import mongoose from 'mongoose';

const versionChangeSchema = new mongoose.Schema(
  {
    id: String,
    type: {
      type: String,
      enum: ['breaking', 'added', 'deprecated', 'security', 'fixed'],
      default: 'added',
    },
    title: String,
    description: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
    author: {
      type: String,
      default: 'Alex Rivera',
    },
  },
  { _id: false }
);

const versionEndpointSchema = new mongoose.Schema(
  {
    endpoint: String,
    method: {
      type: String,
      enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
    },
    description: String,
    supportedIn: [String],
  },
  { _id: false }
);

const apiVersionSchema = new mongoose.Schema(
  {
    customId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    versionNumber: {
      type: String,
      required: [true, 'Version number is required (e.g. v1, v2)'],
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['Draft', 'Active', 'Deprecated', 'Archived'],
      default: 'Draft',
    },
    description: {
      type: String,
      default: '',
    },
    releaseNotes: {
      type: String,
      default: '',
    },
    changes: [versionChangeSchema],
    endpoints: [versionEndpointSchema],
    author: {
      type: String,
      default: 'Alex Rivera',
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

export const ApiVersion = mongoose.model('ApiVersion', apiVersionSchema);
export default ApiVersion;

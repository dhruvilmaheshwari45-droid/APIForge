import mongoose from 'mongoose';

const mockServerSchema = new mongoose.Schema(
  {
    customId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Mock Server name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    baseUrl: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'draft', 'running', 'stopped'],
      default: 'active',
    },
    environment: {
      type: String,
      default: 'Development',
    },
    port: {
      type: Number,
      default: 8080,
    },
    defaultLatencyMs: {
      type: Number,
      default: 100,
    },
    isSimulated: {
      type: Boolean,
      default: true,
    },
    endpointsCount: {
      type: Number,
      default: 0,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: false,
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

export const MockServer = mongoose.model('MockServer', mockServerSchema);
export default MockServer;

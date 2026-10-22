import mongoose from 'mongoose';

const variableSchema = new mongoose.Schema(
  {
    id: String,
    key: {
      type: String,
      required: true,
      trim: true,
    },
    value: {
      type: String,
      default: '',
    },
    isSecret: {
      type: Boolean,
      default: false,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const environmentSchema = new mongoose.Schema(
  {
    customId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Environment name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    baseUrl: {
      type: String,
      default: 'https://api.apiforge.dev/v1',
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    color: {
      type: String,
      default: 'emerald',
    },
    variables: [variableSchema],
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

export const Environment = mongoose.model('Environment', environmentSchema);
export default Environment;

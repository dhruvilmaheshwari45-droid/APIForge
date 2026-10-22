import mongoose from 'mongoose';

const conditionSchema = new mongoose.Schema(
  {
    id: String,
    type: {
      type: String,
      enum: ['method', 'path', 'param', 'header', 'auth', 'body'],
      default: 'path',
    },
    operator: {
      type: String,
      enum: ['equals', 'not_equals', 'contains', 'exists', 'not_exists'],
      default: 'equals',
    },
    field: {
      type: String,
      default: '',
    },
    value: {
      type: String,
      default: '',
    },
    enabled: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const responseHeaderSchema = new mongoose.Schema(
  {
    id: String,
    key: String,
    value: String,
    enabled: { type: Boolean, default: true },
  },
  { _id: false }
);

const mockRuleSchema = new mongoose.Schema(
  {
    customId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    serverId: {
      type: String,
      required: [true, 'Server ID is required'],
      index: true,
    },
    endpointId: {
      type: String,
      required: false,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Rule name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    priority: {
      type: Number,
      default: 1,
    },
    conditions: [conditionSchema],
    response: {
      statusCode: { type: Number, default: 200 },
      bodyType: { type: String, enum: ['json', 'text'], default: 'json' },
      body: { type: String, default: '{}' },
      headers: [responseHeaderSchema],
      delayMs: { type: Number, default: 0 },
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

export const MockRule = mongoose.model('MockRule', mockRuleSchema);
export default MockRule;

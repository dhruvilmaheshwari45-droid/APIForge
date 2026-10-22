import mongoose from 'mongoose';

const assertionSchema = new mongoose.Schema(
  {
    id: String,
    type: {
      type: String,
      enum: [
        'status_code_equals',
        'response_contains_text',
        'json_field_equals',
        'json_field_exists',
        'response_time_below',
        'response_header_exists',
      ],
      required: true,
    },
    target: { type: String, default: '' },
    value: { type: String, default: '' },
    description: { type: String, default: '' },
    enabled: { type: Boolean, default: true },
  },
  { _id: false }
);

const testCaseSchema = new mongoose.Schema(
  {
    customId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    suiteId: {
      type: String,
      required: [true, 'Suite ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Test case name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    method: {
      type: String,
      enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
      default: 'GET',
    },
    url: {
      type: String,
      required: [true, 'Request URL is required'],
      trim: true,
    },
    headers: [
      {
        id: String,
        key: String,
        value: String,
        enabled: { type: Boolean, default: true },
      },
    ],
    params: [
      {
        id: String,
        key: String,
        value: String,
        enabled: { type: Boolean, default: true },
      },
    ],
    auth: {
      type: { type: String, default: 'noauth' },
      token: String,
      username: String,
      password: String,
      apiKeyName: String,
      apiKeyValue: String,
      apiKeyLocation: String,
    },
    bodyType: {
      type: String,
      enum: ['none', 'json', 'raw'],
      default: 'none',
    },
    jsonBody: {
      type: String,
      default: '',
    },
    assertions: [assertionSchema],
    order: {
      type: Number,
      default: 0,
    },
    enabled: {
      type: Boolean,
      default: true,
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

export const TestCase = mongoose.model('TestCase', testCaseSchema);
export default TestCase;

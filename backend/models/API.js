import mongoose from 'mongoose';

const headerParamSchema = new mongoose.Schema(
  {
    id: String,
    key: { type: String, default: '' },
    value: { type: String, default: '' },
    enabled: { type: Boolean, default: true },
    description: { type: String, default: '' },
  },
  { _id: false }
);

const apiSchema = new mongoose.Schema(
  {
    customId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    collectionId: {
      type: String,
      required: [true, 'Collection ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'API / Endpoint name is required'],
      trim: true,
    },
    method: {
      type: String,
      required: true,
      enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
      default: 'GET',
    },
    path: {
      type: String,
      required: [true, 'API path is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    headers: [headerParamSchema],
    queryParams: [headerParamSchema],
    auth: {
      type: {
        type: String,
        default: 'noauth',
      },
      token: String,
      username: String,
      password: String,
      apiKeyName: String,
      apiKeyValue: String,
      apiKeyLocation: String,
    },
    requestBody: {
      type: String,
      default: '',
    },
    bodyType: {
      type: String,
      default: 'json',
    },
    responseExample: {
      status: { type: Number, default: 200 },
      body: mongoose.Schema.Types.Mixed,
      headers: mongoose.Schema.Types.Mixed,
    },
    status: {
      type: String,
      enum: ['active', 'deprecated', 'draft'],
      default: 'active',
    },
    order: {
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

export const API = mongoose.model('API', apiSchema);
export default API;

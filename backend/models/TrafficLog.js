import mongoose from 'mongoose';

const trafficLogSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      required: true,
      index: true,
      unique: true,
    },
    method: {
      type: String,
      required: true,
      enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
      index: true,
    },
    url: {
      type: String,
      required: true,
    },
    endpoint: {
      type: String,
      default: '',
      index: true,
    },
    statusCode: {
      type: Number,
      required: true,
      index: true,
    },
    statusText: {
      type: String,
      default: 'OK',
    },
    durationMs: {
      type: Number,
      required: true,
      index: true,
    },
    responseSize: {
      type: Number,
      default: 0,
    },
    requestHeaders: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    responseHeaders: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    requestBody: {
      type: String,
      default: '',
    },
    responseBody: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    environment: {
      type: String,
      default: 'Development',
      index: true,
    },
    error: {
      type: String,
      default: null,
    },
    ip: {
      type: String,
      default: '127.0.0.1',
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret.requestId || ret._id.toString();
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret.requestId || ret._id.toString();
        return ret;
      },
    },
  }
);

export const TrafficLog = mongoose.model('TrafficLog', trafficLogSchema);
export default TrafficLog;

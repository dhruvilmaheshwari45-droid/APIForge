import mongoose from 'mongoose';

const testSuiteSchema = new mongoose.Schema(
  {
    customId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Test suite name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    environmentId: {
      type: String,
      default: 'env-dev',
    },
    schedule: {
      type: String,
      default: 'Manual',
    },
    lastRunAt: {
      type: Date,
      default: null,
    },
    lastStatus: {
      type: String,
      enum: ['passed', 'failed', 'partial', 'untested'],
      default: 'untested',
    },
    passRate: {
      type: Number,
      default: null,
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

export const TestSuite = mongoose.model('TestSuite', testSuiteSchema);
export default TestSuite;

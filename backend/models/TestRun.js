import mongoose from 'mongoose';

const assertionResultSchema = new mongoose.Schema(
  {
    id: String,
    type: String,
    target: String,
    expected: mongoose.Schema.Types.Mixed,
    actual: mongoose.Schema.Types.Mixed,
    passed: Boolean,
    message: String,
    description: String,
  },
  { _id: false }
);

const testRunDetailSchema = new mongoose.Schema(
  {
    testCaseId: String,
    name: String,
    method: String,
    url: String,
    status: {
      type: String,
      enum: ['passed', 'failed', 'skipped', 'error'],
      default: 'passed',
    },
    responseStatus: Number,
    durationMs: Number,
    assertionsCount: Number,
    passedAssertions: Number,
    failedAssertions: Number,
    assertionResults: [assertionResultSchema],
    error: String,
  },
  { _id: false }
);

const testRunSchema = new mongoose.Schema(
  {
    customId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    suiteId: {
      type: String,
      required: true,
      index: true,
    },
    suiteName: {
      type: String,
      required: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    durationMs: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['passed', 'failed', 'partial', 'running'],
      default: 'passed',
    },
    totalCount: {
      type: Number,
      default: 0,
    },
    passedCount: {
      type: Number,
      default: 0,
    },
    failedCount: {
      type: Number,
      default: 0,
    },
    skippedCount: {
      type: Number,
      default: 0,
    },
    successRate: {
      type: Number,
      default: 100,
    },
    environmentName: {
      type: String,
      default: 'Development',
    },
    trigger: {
      type: String,
      default: 'Manual Run',
    },
    details: [testRunDetailSchema],
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

export const TestRun = mongoose.model('TestRun', testRunSchema);
export default TestRun;

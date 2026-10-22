import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    members: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: { type: String, enum: ['owner', 'admin', 'editor', 'viewer'], default: 'editor' },
      },
    ],
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

export const Project = mongoose.model('Project', projectSchema);
export default Project;

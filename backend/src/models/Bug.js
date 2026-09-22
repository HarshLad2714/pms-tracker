const mongoose = require('mongoose');

const SEVERITIES = ['low', 'medium', 'high', 'critical'];
const STATUSES = ['open', 'in_progress', 'fixed', 'reopened', 'closed'];

const screenshotSchema = new mongoose.Schema(
  {
    filename: String,
    originalName: String,
    url: String,
    mimeType: String,
    size: Number,
  },
  { _id: false }
);

const bugSchema = new mongoose.Schema(
  {
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    severity: { type: String, enum: SEVERITIES, default: 'medium' },
    stepsToReproduce: { type: String, default: '' },
    screenshots: [screenshotSchema],
    status: { type: String, enum: STATUSES, default: 'open' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

bugSchema.index({ task: 1, status: 1 });
bugSchema.index({ assignedTo: 1 });
bugSchema.index({ severity: 1 });

module.exports = mongoose.model('Bug', bugSchema);
module.exports.SEVERITIES = SEVERITIES;
module.exports.STATUSES = STATUSES;

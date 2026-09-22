const mongoose = require('mongoose');

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const STATUSES = ['todo', 'in_progress', 'in_review', 'qa', 'done'];

const attachmentSchema = new mongoose.Schema(
  {
    filename: String,
    originalName: String,
    url: String,
    mimeType: String,
    size: Number,
  },
  { _id: false }
);

const taskSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    priority: { type: String, enum: PRIORITIES, default: 'medium' },
    status: { type: String, enum: STATUSES, default: 'todo' },
    startDate: { type: Date },
    dueDate: { type: Date },
    tags: [{ type: String, trim: true }],
    attachments: [attachmentSchema],
    estimatedMinutes: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    position: { type: Number, default: 0 },
  },
  { timestamps: true }
);

taskSchema.index({ project: 1, status: 1, position: 1 });
taskSchema.index({ assignees: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ tags: 1 });

module.exports = mongoose.model('Task', taskSchema);
module.exports.PRIORITIES = PRIORITIES;
module.exports.STATUSES = STATUSES;

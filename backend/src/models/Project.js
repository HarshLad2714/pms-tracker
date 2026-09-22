const mongoose = require('mongoose');

const STATUSES = ['active', 'on_hold', 'completed', 'archived'];

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    startDate: { type: Date },
    deadline: { type: Date },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    status: { type: String, enum: STATUSES, default: 'active' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    archivedAt: { type: Date },
  },
  { timestamps: true }
);

projectSchema.index({ status: 1, deadline: 1 });
projectSchema.index({ members: 1 });

module.exports = mongoose.model('Project', projectSchema);
module.exports.STATUSES = STATUSES;

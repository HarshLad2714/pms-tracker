const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    entityType: { type: String, enum: ['task', 'bug', 'project'], required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    message: { type: String, required: true },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

activitySchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);

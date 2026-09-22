const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    entityType: { type: String, enum: ['task', 'bug'], required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

commentSchema.index({ entityType: 1, entityId: 1, createdAt: 1 });

module.exports = mongoose.model('Comment', commentSchema);

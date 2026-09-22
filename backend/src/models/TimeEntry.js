const mongoose = require('mongoose');

const timeEntrySchema = new mongoose.Schema(
  {
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    durationMinutes: { type: Number, default: 0 },
    source: { type: String, enum: ['timer', 'manual'], default: 'timer' },
    note: { type: String, default: '' },
    isRunning: { type: Boolean, default: false },
  },
  { timestamps: true }
);

timeEntrySchema.index({ task: 1, user: 1, startTime: -1 });
timeEntrySchema.index({ user: 1, isRunning: 1 });
timeEntrySchema.index({ startTime: 1 });

module.exports = mongoose.model('TimeEntry', timeEntrySchema);

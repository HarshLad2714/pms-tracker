const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true },
    clockIn: { type: Date, required: true },
    clockOut: { type: Date },
    totalMinutes: { type: Number, default: 0 },
    isLate: { type: Boolean, default: false },
    isEarlyOut: { type: Boolean, default: false },
  },
  { timestamps: true }
);

attendanceSchema.index({ user: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);

const Attendance = require('../models/Attendance');
const { asyncHandler } = require('../utils/asyncHandler');
const { ApiError } = require('../utils/ApiError');
const { todayKey, minutesBetween } = require('../utils/dates');
const { workStartHour, workEndHour } = require('../config/env');

exports.clockIn = asyncHandler(async (req, res) => {
  const date = todayKey();
  const existing = await Attendance.findOne({ user: req.user._id, date });
  if (existing) throw new ApiError(400, 'Already clocked in today');

  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setHours(workStartHour, 0, 0, 0);
  const record = await Attendance.create({
    user: req.user._id,
    date,
    clockIn: now,
    isLate: now > cutoff,
  });
  res.status(201).json({ attendance: record });
});

exports.clockOut = asyncHandler(async (req, res) => {
  const date = todayKey();
  const record = await Attendance.findOne({ user: req.user._id, date });
  if (!record) throw new ApiError(400, 'Clock in first');
  if (record.clockOut) throw new ApiError(400, 'Already clocked out');

  const now = new Date();
  const end = new Date(now);
  end.setHours(workEndHour, 0, 0, 0);
  record.clockOut = now;
  record.totalMinutes = minutesBetween(record.clockIn, now);
  record.isEarlyOut = now < end;
  await record.save();
  res.json({ attendance: record });
});

exports.today = asyncHandler(async (req, res) => {
  const record = await Attendance.findOne({ user: req.user._id, date: todayKey() });
  res.json({ attendance: record });
});

exports.mine = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const filter = { user: req.user._id };
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = from;
    if (to) filter.date.$lte = to;
  }
  const records = await Attendance.find(filter).sort({ date: -1 });
  res.json({ records });
});

exports.list = asyncHandler(async (req, res) => {
  const { user, from, to } = req.query;
  const filter = {};
  if (user) filter.user = user;
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = from;
    if (to) filter.date.$lte = to;
  }
  const records = await Attendance.find(filter)
    .populate('user', 'name email avatar department designation')
    .sort({ date: -1, clockIn: -1 });
  res.json({ records });
});

exports.summary = asyncHandler(async (req, res) => {
  const { from, to, user } = req.query;
  const match = {};
  if (user) match.user = require('mongoose').Types.ObjectId.createFromHexString(user);
  if (from || to) {
    match.date = {};
    if (from) match.date.$gte = from;
    if (to) match.date.$lte = to;
  }
  const rows = await Attendance.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$user',
        days: { $sum: 1 },
        minutes: { $sum: '$totalMinutes' },
        late: { $sum: { $cond: ['$isLate', 1, 0] } },
        earlyOut: { $sum: { $cond: ['$isEarlyOut', 1, 0] } },
      },
    },
  ]);
  res.json({ summary: rows });
});

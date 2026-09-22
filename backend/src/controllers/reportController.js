const Attendance = require('../models/Attendance');
const TimeEntry = require('../models/TimeEntry');
const Task = require('../models/Task');
const { asyncHandler } = require('../utils/asyncHandler');
const { rangeFromPreset } = require('../utils/dates');

function csv(rows, headers) {
  const head = headers.join(',');
  const body = rows
    .map((row) => headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  return `${head}\n${body}`;
}

exports.attendance = asyncHandler(async (req, res) => {
  const { from, to } = rangeFromPreset(req.query.range, req.query.from, req.query.to);
  const fromKey = from.toISOString().slice(0, 10);
  const toKey = to.toISOString().slice(0, 10);
  const filter = { date: { $gte: fromKey, $lte: toKey } };
  if (req.query.user) filter.user = req.query.user;
  if (req.user.role === 'employee') filter.user = req.user._id;
  const records = await Attendance.find(filter).populate('user', 'name email department designation').sort({ date: -1 });
  res.json({ records, from: fromKey, to: toKey });
});

exports.time = asyncHandler(async (req, res) => {
  const { from, to } = rangeFromPreset(req.query.range, req.query.from, req.query.to);
  const match = { isRunning: false, startTime: { $gte: from, $lte: to } };
  if (req.query.user) match.user = require('mongoose').Types.ObjectId.createFromHexString(req.query.user);
  if (req.query.task) match.task = require('mongoose').Types.ObjectId.createFromHexString(req.query.task);
  if (req.user.role === 'employee') match.user = req.user._id;

  const groupField = req.query.group === 'project' ? '$task.project' : req.query.group === 'task' ? '$task._id' : '$user';

  const rows = await TimeEntry.aggregate([
    { $match: match },
    { $lookup: { from: 'tasks', localField: 'task', foreignField: '_id', as: 'task' } },
    { $unwind: '$task' },
    ...(req.query.project
      ? [{ $match: { 'task.project': require('mongoose').Types.ObjectId.createFromHexString(req.query.project) } }]
      : []),
    { $group: { _id: groupField, minutes: { $sum: '$durationMinutes' }, sessions: { $sum: 1 } } },
    { $sort: { minutes: -1 } },
  ]);

  res.json({ rows, from, to });
});

exports.tasks = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.project) filter.project = req.query.project;
  if (req.query.status) filter.status = req.query.status;
  const tasks = await Task.find(filter).populate('project', 'name').populate('assignees', 'name email').sort({ updatedAt: -1 });
  res.json({ tasks });
});

exports.exportCsv = asyncHandler(async (req, res) => {
  const type = req.query.type || 'attendance';
  if (type === 'attendance') {
    const { from, to } = rangeFromPreset(req.query.range, req.query.from, req.query.to);
    const fromKey = from.toISOString().slice(0, 10);
    const toKey = to.toISOString().slice(0, 10);
    const filter = { date: { $gte: fromKey, $lte: toKey } };
    if (req.user.role === 'employee') filter.user = req.user._id;
    const records = await Attendance.find(filter).populate('user', 'name email department');
    const rows = records.map((r) => ({
      date: r.date,
      name: r.user?.name,
      email: r.user?.email,
      clockIn: r.clockIn ? new Date(r.clockIn).toISOString() : '',
      clockOut: r.clockOut ? new Date(r.clockOut).toISOString() : '',
      hours: (r.totalMinutes / 60).toFixed(2),
      late: r.isLate ? 'yes' : 'no',
      earlyOut: r.isEarlyOut ? 'yes' : 'no',
    }));
    const text = csv(rows, ['date', 'name', 'email', 'clockIn', 'clockOut', 'hours', 'late', 'earlyOut']);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=attendance.csv');
    return res.send(text);
  }

  if (type === 'time') {
    const { from, to } = rangeFromPreset(req.query.range, req.query.from, req.query.to);
    const filter = { isRunning: false, startTime: { $gte: from, $lte: to } };
    if (req.user.role === 'employee') filter.user = req.user._id;
    const entries = await TimeEntry.find(filter).populate('user', 'name email').populate('task', 'title');
    const rows = entries.map((e) => ({
      user: e.user?.name,
      task: e.task?.title,
      start: e.startTime ? new Date(e.startTime).toISOString() : '',
      end: e.endTime ? new Date(e.endTime).toISOString() : '',
      minutes: e.durationMinutes,
      source: e.source,
    }));
    const text = csv(rows, ['user', 'task', 'start', 'end', 'minutes', 'source']);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=time.csv');
    return res.send(text);
  }

  const tasks = await Task.find({}).populate('project', 'name').populate('assignees', 'name');
  const rows = tasks.map((t) => ({
    title: t.title,
    project: t.project?.name,
    status: t.status,
    priority: t.priority,
    assignees: (t.assignees || []).map((a) => a.name).join('; '),
    dueDate: t.dueDate ? new Date(t.dueDate).toISOString().slice(0, 10) : '',
  }));
  const text = csv(rows, ['title', 'project', 'status', 'priority', 'assignees', 'dueDate']);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=tasks.csv');
  res.send(text);
});

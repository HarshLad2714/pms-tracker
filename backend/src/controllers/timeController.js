const TimeEntry = require('../models/TimeEntry');
const Task = require('../models/Task');
const { asyncHandler } = require('../utils/asyncHandler');
const { ApiError } = require('../utils/ApiError');
const { minutesBetween } = require('../utils/dates');

exports.running = asyncHandler(async (req, res) => {
  const entry = await TimeEntry.findOne({ user: req.user._id, isRunning: true }).populate('task', 'title project');
  res.json({ entry });
});

exports.start = asyncHandler(async (req, res) => {
  const { taskId } = req.body;
  const task = await Task.findById(taskId);
  if (!task) throw new ApiError(404, 'Task not found');
  const assigned = task.assignees.some((id) => String(id) === String(req.user._id));
  if (req.user.role === 'employee' && !assigned) {
    throw new ApiError(403, 'Timer is only available on tasks assigned to you');
  }
  const existing = await TimeEntry.findOne({ user: req.user._id, isRunning: true });
  if (existing) throw new ApiError(400, 'Stop the running timer first');

  const entry = await TimeEntry.create({
    task: task._id,
    user: req.user._id,
    startTime: new Date(),
    isRunning: true,
    source: 'timer',
  });
  res.status(201).json({ entry });
});

exports.stop = asyncHandler(async (req, res) => {
  const entry = await TimeEntry.findOne({ user: req.user._id, isRunning: true });
  if (!entry) throw new ApiError(400, 'No running timer');
  entry.endTime = new Date();
  entry.durationMinutes = minutesBetween(entry.startTime, entry.endTime);
  entry.isRunning = false;
  await entry.save();
  res.json({ entry });
});

exports.manual = asyncHandler(async (req, res) => {
  const { taskId, startTime, endTime, durationMinutes, note } = req.body;
  const task = await Task.findById(taskId);
  if (!task) throw new ApiError(404, 'Task not found');

  let minutes = durationMinutes;
  if (!minutes && startTime && endTime) minutes = minutesBetween(startTime, endTime);
  if (!minutes || minutes <= 0) throw new ApiError(400, 'Provide a valid duration');

  const entry = await TimeEntry.create({
    task: task._id,
    user: req.user._id,
    startTime: startTime || new Date(),
    endTime: endTime || new Date(),
    durationMinutes: minutes,
    source: 'manual',
    note: note || '',
    isRunning: false,
  });
  res.status(201).json({ entry });
});

exports.list = asyncHandler(async (req, res) => {
  const { task, user, from, to } = req.query;
  const filter = {};
  if (task) filter.task = task;
  if (user) filter.user = user;
  if (req.user.role === 'employee') filter.user = req.user._id;
  if (from || to) {
    filter.startTime = {};
    if (from) filter.startTime.$gte = new Date(from);
    if (to) filter.startTime.$lte = new Date(to);
  }
  const entries = await TimeEntry.find(filter)
    .populate('task', 'title project')
    .populate('user', 'name email avatar')
    .sort({ startTime: -1 });
  res.json({ entries });
});

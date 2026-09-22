const Task = require('../models/Task');
const Bug = require('../models/Bug');
const Attendance = require('../models/Attendance');
const TimeEntry = require('../models/TimeEntry');
const Project = require('../models/Project');
const { asyncHandler } = require('../utils/asyncHandler');
const { todayKey, rangeFromPreset } = require('../utils/dates');

exports.get = asyncHandler(async (req, res) => {
  const { from, to } = rangeFromPreset(req.query.range || 'weekly', req.query.from, req.query.to);
  const isLead = req.user.role === 'admin' || req.user.role === 'manager';

  const myTasks = await Task.find({ assignees: req.user._id, status: { $ne: 'done' } })
    .populate('project', 'name')
    .sort({ dueDate: 1 })
    .limit(8);

  const todayAttendance = await Attendance.findOne({ user: req.user._id, date: todayKey() });
  const running = await TimeEntry.findOne({ user: req.user._id, isRunning: true }).populate('task', 'title');

  const myBugs = await Bug.find({
    assignedTo: req.user._id,
    status: { $in: ['open', 'in_progress', 'reopened'] },
  })
    .populate('task', 'title')
    .limit(8);

  const todayHours = todayAttendance?.totalMinutes
    ? todayAttendance.totalMinutes
    : todayAttendance
      ? Math.round((Date.now() - new Date(todayAttendance.clockIn)) / 60000)
      : 0;

  const payload = {
    me: {
      tasks: myTasks,
      attendance: todayAttendance,
      todayMinutes: todayHours,
      running,
      bugs: myBugs,
    },
  };

  if (isLead) {
    const [statusAgg, bugsBySeverity, attendanceToday, topTime, projects] = await Promise.all([
      Task.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Bug.aggregate([{ $group: { _id: '$severity', count: { $sum: 1 } } }]),
      Attendance.find({ date: todayKey() }).populate('user', 'name avatar department'),
      TimeEntry.aggregate([
        { $match: { isRunning: false, startTime: { $gte: from, $lte: to } } },
        { $group: { _id: '$task', minutes: { $sum: '$durationMinutes' } } },
        { $sort: { minutes: -1 } },
        { $limit: 6 },
      ]),
      Project.find({ status: { $ne: 'archived' } }).select('name status deadline members').limit(8),
    ]);

    const taskIds = topTime.map((t) => t._id);
    const taskDocs = await Task.find({ _id: { $in: taskIds } }).populate('project', 'name');
    const taskMap = Object.fromEntries(taskDocs.map((t) => [String(t._id), t]));

    payload.lead = {
      tasksByStatus: statusAgg,
      bugsBySeverity,
      attendanceToday,
      topTasks: topTime.map((t) => ({
        minutes: t.minutes,
        task: taskMap[String(t._id)] || null,
      })),
      projects,
      clockedIn: attendanceToday.filter((a) => a.clockIn && !a.clockOut).length,
      totalToday: attendanceToday.length,
    };
  }

  res.json(payload);
});

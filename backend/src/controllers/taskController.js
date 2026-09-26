const Task = require('../models/Task');
const Bug = require('../models/Bug');
const Comment = require('../models/Comment');
const Activity = require('../models/Activity');
const TimeEntry = require('../models/TimeEntry');
const Counter = require('../models/Counter');
const { asyncHandler } = require('../utils/asyncHandler');
const { ApiError } = require('../utils/ApiError');
const { logActivity } = require('../utils/activity');
const { notify } = require('../utils/notify');

const POPULATE = [
  { path: 'assignees', select: 'name email avatar role designation' },
  { path: 'watchers', select: 'name email avatar' },
  { path: 'createdBy', select: 'name email avatar' },
  { path: 'project', select: 'name status members' },
  { path: 'parent', select: 'title key type' },
];

async function nextKey() {
  const seq = await Counter.next('task');
  return `FRG-${seq}`;
}

function canSeeAll(user) {
  return user.role === 'admin' || user.role === 'manager';
}

exports.list = asyncHandler(async (req, res) => {
  const { project, assignee, status, priority, tag, q, mine, type, parent, calendar } = req.query;
  const filter = {};
  if (project) filter.project = project;
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (tag) filter.tags = tag;
  if (type) filter.type = type;
  if (parent) filter.parent = parent;
  if (q) filter.$or = [{ title: new RegExp(q, 'i') }, { key: new RegExp(q, 'i') }];
  if (calendar === 'true') filter.dueDate = { $exists: true, $ne: null };

  if (mine === 'true' || (!canSeeAll(req.user) && !assignee)) {
    filter.assignees = req.user._id;
  } else if (assignee) {
    filter.assignees = assignee;
  }

  const tasks = await Task.find(filter).populate(POPULATE).sort({ position: 1, createdAt: -1 });
  const ids = tasks.map((t) => t._id);
  const [bugAgg, timeAgg] = await Promise.all([
    Bug.aggregate([
      { $match: { task: { $in: ids } } },
      { $group: { _id: '$task', count: { $sum: 1 }, open: { $sum: { $cond: [{ $in: ['$status', ['open', 'in_progress', 'reopened']] }, 1, 0] } } } },
    ]),
    TimeEntry.aggregate([
      { $match: { task: { $in: ids }, isRunning: false } },
      { $group: { _id: '$task', minutes: { $sum: '$durationMinutes' } } },
    ]),
  ]);
  const bugMap = Object.fromEntries(bugAgg.map((b) => [String(b._id), b]));
  const timeMap = Object.fromEntries(timeAgg.map((t) => [String(t._id), t.minutes]));

  res.json({
    tasks: tasks.map((t) => ({
      ...t.toObject(),
      bugCount: bugMap[String(t._id)]?.count || 0,
      openBugCount: bugMap[String(t._id)]?.open || 0,
      loggedMinutes: timeMap[String(t._id)] || 0,
    })),
  });
});

exports.create = asyncHandler(async (req, res) => {
  const { project, title, description, assignees, priority, status, startDate, dueDate, tags, estimatedMinutes, attachments, type, parent, watchers } = req.body;
  if (!project || !title) throw new ApiError(400, 'Project and title are required');

  const last = await Task.findOne({ project, status: status || 'todo' }).sort({ position: -1 });
  const task = await Task.create({
    key: await nextKey(),
    type: type || 'task',
    parent: parent || undefined,
    project,
    title,
    description,
    assignees: assignees || [],
    watchers: watchers || [req.user._id],
    priority: priority || 'medium',
    status: status || 'todo',
    startDate,
    dueDate,
    tags: tags || [],
    estimatedMinutes: estimatedMinutes || 0,
    attachments: attachments || [],
    createdBy: req.user._id,
    position: last ? last.position + 1 : 0,
  });

  await logActivity({
    entityType: 'task',
    entityId: task._id,
    user: req.user._id,
    action: 'created',
    message: `Created task ${title}`,
  });
  await notify((assignees || []).filter((id) => String(id) !== String(req.user._id)), {
    type: 'task_assigned',
    title: 'New task assigned',
    body: title,
    link: `/tasks/${task._id}`,
    meta: { taskId: task._id },
  });

  const populated = await Task.findById(task._id).populate(POPULATE);
  res.status(201).json({ task: populated });
});

exports.getOne = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const task = /^FRG-/i.test(id)
    ? await Task.findOne({ key: id.toUpperCase() }).populate(POPULATE)
    : await Task.findById(id).populate(POPULATE);
  if (!task) throw new ApiError(404, 'Task not found');

  const [bugs, comments, activities, timeEntries] = await Promise.all([
    Bug.find({ task: task._id }).populate('assignedTo', 'name email avatar').populate('createdBy', 'name email avatar').sort({ createdAt: -1 }),
    Comment.find({ entityType: 'task', entityId: task._id }).populate('user', 'name email avatar').sort({ createdAt: 1 }),
    Activity.find({ entityType: 'task', entityId: task._id }).populate('user', 'name email avatar').sort({ createdAt: -1 }).limit(40),
    TimeEntry.find({ task: task._id }).populate('user', 'name email avatar').sort({ startTime: -1 }),
  ]);
  const loggedMinutes = timeEntries.filter((e) => !e.isRunning).reduce((s, e) => s + e.durationMinutes, 0);
  const subtasks = await Task.find({ parent: task._id }).populate('assignees', 'name email avatar').sort({ position: 1 });

  res.json({ task, bugs, comments, activities, timeEntries, loggedMinutes, subtasks });
});

function assertAssignee(user, task) {
  if (user.role === 'employee' && !task.assignees.some((id) => String(id) === String(user._id))) {
    throw new ApiError(403, 'You can only change tasks assigned to you');
  }
}

exports.update = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw new ApiError(404, 'Task not found');
  assertAssignee(req.user, task);

  const prevAssignees = task.assignees.map(String);
  const fields = ['title', 'description', 'assignees', 'watchers', 'priority', 'status', 'startDate', 'dueDate', 'tags', 'estimatedMinutes', 'attachments', 'position', 'type', 'parent'];
  const changes = [];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) {
      if (String(task[f]) !== String(req.body[f])) changes.push(f);
      task[f] = req.body[f];
    }
  });
  await task.save();

  if (changes.length) {
    await logActivity({
      entityType: 'task',
      entityId: task._id,
      user: req.user._id,
      action: 'updated',
      message: `Updated ${changes.join(', ')}`,
      meta: { changes },
    });
  }

  const nextAssignees = (task.assignees || []).map(String);
  const added = nextAssignees.filter((id) => !prevAssignees.includes(id) && id !== String(req.user._id));
  if (added.length) {
    await notify(added, {
      type: 'task_assigned',
      title: 'Task assigned to you',
      body: task.title,
      link: `/tasks/${task._id}`,
    });
  }

  const populated = await Task.findById(task._id).populate(POPULATE);
  res.json({ task: populated });
});

exports.move = asyncHandler(async (req, res) => {
  const { status, position } = req.body;
  const task = await Task.findById(req.params.id);
  if (!task) throw new ApiError(404, 'Task not found');

  if (req.user.role === 'employee' && !task.assignees.some((id) => String(id) === String(req.user._id))) {
    throw new ApiError(403, 'You can only move tasks assigned to you');
  }

  const prev = task.status;
  if (status) task.status = status;
  if (position !== undefined) task.position = position;
  await task.save();

  if (status && status !== prev) {
    await logActivity({
      entityType: 'task',
      entityId: task._id,
      user: req.user._id,
      action: 'status_changed',
      message: `Moved from ${prev} to ${status}`,
      meta: { from: prev, to: status },
    });
    await notify(task.assignees.filter((id) => String(id) !== String(req.user._id)), {
      type: 'task_status',
      title: 'Task status changed',
      body: `${task.title} is now ${status.replace('_', ' ')}`,
      link: `/tasks/${task._id}`,
    });
  }

  const populated = await Task.findById(task._id).populate(POPULATE);
  res.json({ task: populated });
});

exports.remove = asyncHandler(async (req, res) => {
  const task = await Task.findByIdAndDelete(req.params.id);
  if (!task) throw new ApiError(404, 'Task not found');
  await Promise.all([
    Bug.deleteMany({ task: task._id }),
    Comment.deleteMany({ entityType: 'task', entityId: task._id }),
    TimeEntry.deleteMany({ task: task._id }),
  ]);
  res.json({ message: 'Task deleted' });
});

exports.addComment = asyncHandler(async (req, res) => {
  if (!req.body.body) throw new ApiError(400, 'Comment cannot be empty');
  const task = await Task.findById(req.params.id);
  if (!task) throw new ApiError(404, 'Task not found');
  const comment = await Comment.create({
    entityType: 'task',
    entityId: task._id,
    user: req.user._id,
    body: req.body.body,
  });
  await logActivity({
    entityType: 'task',
    entityId: task._id,
    user: req.user._id,
    action: 'commented',
    message: 'Added a comment',
  });
  const populated = await Comment.findById(comment._id).populate('user', 'name email avatar');
  res.status(201).json({ comment: populated });
});

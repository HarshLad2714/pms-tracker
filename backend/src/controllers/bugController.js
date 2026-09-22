const Bug = require('../models/Bug');
const Task = require('../models/Task');
const Comment = require('../models/Comment');
const Activity = require('../models/Activity');
const { asyncHandler } = require('../utils/asyncHandler');
const { ApiError } = require('../utils/ApiError');
const { logActivity } = require('../utils/activity');
const { notify } = require('../utils/notify');

const POPULATE = [
  { path: 'assignedTo', select: 'name email avatar' },
  { path: 'createdBy', select: 'name email avatar' },
  { path: 'task', select: 'title project assignees' },
];

exports.listForTask = asyncHandler(async (req, res) => {
  const bugs = await Bug.find({ task: req.params.taskId }).populate(POPULATE).sort({ createdAt: -1 });
  res.json({ bugs });
});

exports.list = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.severity) filter.severity = req.query.severity;
  if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;
  if (req.query.mine === 'true') filter.assignedTo = req.user._id;
  const bugs = await Bug.find(filter).populate(POPULATE).sort({ createdAt: -1 });
  res.json({ bugs });
});

exports.create = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.taskId);
  if (!task) throw new ApiError(404, 'Task not found');
  if (
    req.user.role === 'employee' &&
    !task.assignees.some((id) => String(id) === String(req.user._id))
  ) {
    throw new ApiError(403, 'You can only log bugs on assigned tasks');
  }
  const { title, description, severity, stepsToReproduce, screenshots, assignedTo, status } = req.body;
  if (!title) throw new ApiError(400, 'Bug title is required');

  const bug = await Bug.create({
    task: task._id,
    title,
    description,
    severity: severity || 'medium',
    stepsToReproduce,
    screenshots: screenshots || [],
    assignedTo: assignedTo || undefined,
    status: status || 'open',
    createdBy: req.user._id,
  });

  await logActivity({
    entityType: 'bug',
    entityId: bug._id,
    user: req.user._id,
    action: 'created',
    message: `Logged bug ${title}`,
  });
  await logActivity({
    entityType: 'task',
    entityId: task._id,
    user: req.user._id,
    action: 'bug_added',
    message: `Added bug: ${title}`,
  });

  const notifyIds = [...task.assignees, assignedTo].filter((id) => id && String(id) !== String(req.user._id));
  await notify(notifyIds, {
    type: 'bug_added',
    title: 'New bug logged',
    body: title,
    link: `/tasks/${task._id}`,
  });

  const populated = await Bug.findById(bug._id).populate(POPULATE);
  res.status(201).json({ bug: populated });
});

exports.update = asyncHandler(async (req, res) => {
  const bug = await Bug.findById(req.params.id);
  if (!bug) throw new ApiError(404, 'Bug not found');
  const fields = ['title', 'description', 'severity', 'stepsToReproduce', 'screenshots', 'status', 'assignedTo'];
  const prevStatus = bug.status;
  fields.forEach((f) => {
    if (req.body[f] !== undefined) bug[f] = req.body[f];
  });
  await bug.save();

  if (req.body.status && req.body.status !== prevStatus) {
    await logActivity({
      entityType: 'bug',
      entityId: bug._id,
      user: req.user._id,
      action: 'status_changed',
      message: `Bug moved from ${prevStatus} to ${bug.status}`,
    });
  }

  const populated = await Bug.findById(bug._id).populate(POPULATE);
  res.json({ bug: populated });
});

exports.getOne = asyncHandler(async (req, res) => {
  const bug = await Bug.findById(req.params.id).populate(POPULATE);
  if (!bug) throw new ApiError(404, 'Bug not found');
  const [comments, activities] = await Promise.all([
    Comment.find({ entityType: 'bug', entityId: bug._id }).populate('user', 'name email avatar').sort({ createdAt: 1 }),
    Activity.find({ entityType: 'bug', entityId: bug._id }).populate('user', 'name email avatar').sort({ createdAt: -1 }),
  ]);
  res.json({ bug, comments, activities });
});

exports.addComment = asyncHandler(async (req, res) => {
  if (!req.body.body) throw new ApiError(400, 'Comment cannot be empty');
  const bug = await Bug.findById(req.params.id);
  if (!bug) throw new ApiError(404, 'Bug not found');
  const comment = await Comment.create({
    entityType: 'bug',
    entityId: bug._id,
    user: req.user._id,
    body: req.body.body,
  });
  const populated = await Comment.findById(comment._id).populate('user', 'name email avatar');
  res.status(201).json({ comment: populated });
});

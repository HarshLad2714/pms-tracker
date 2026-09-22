const Project = require('../models/Project');
const Task = require('../models/Task');
const { asyncHandler } = require('../utils/asyncHandler');
const { ApiError } = require('../utils/ApiError');
const { logActivity } = require('../utils/activity');
const { notify } = require('../utils/notify');

function scopedFilter(user) {
  if (user.role === 'admin') return {};
  return { members: user._id, status: { $ne: 'archived' } };
}

exports.list = asyncHandler(async (req, res) => {
  const filter = { ...scopedFilter(req.user) };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.q) filter.name = new RegExp(req.query.q, 'i');
  const projects = await Project.find(filter)
    .populate('members', 'name email avatar role designation')
    .populate('createdBy', 'name email')
    .sort({ updatedAt: -1 });
  res.json({ projects });
});

exports.create = asyncHandler(async (req, res) => {
  const { name, description, startDate, deadline, members, status } = req.body;
  if (!name) throw new ApiError(400, 'Project name is required');
  const memberIds = [...new Set([String(req.user._id), ...(members || []).map(String)])];
  const project = await Project.create({
    name,
    description,
    startDate,
    deadline,
    members: memberIds,
    status: status || 'active',
    createdBy: req.user._id,
  });
  await logActivity({
    entityType: 'project',
    entityId: project._id,
    user: req.user._id,
    action: 'created',
    message: `Created project ${name}`,
  });
  await notify(memberIds.filter((id) => id !== String(req.user._id)), {
    type: 'project_assigned',
    title: 'Added to a project',
    body: `You were added to ${name}`,
    link: `/projects/${project._id}`,
  });
  const populated = await Project.findById(project._id)
    .populate('members', 'name email avatar role designation')
    .populate('createdBy', 'name email');
  res.status(201).json({ project: populated });
});

exports.getOne = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate('members', 'name email avatar role designation department')
    .populate('createdBy', 'name email');
  if (!project) throw new ApiError(404, 'Project not found');
  const taskCount = await Task.countDocuments({ project: project._id });
  res.json({ project, taskCount });
});

exports.update = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new ApiError(404, 'Project not found');
  const fields = ['name', 'description', 'startDate', 'deadline', 'members', 'status'];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) project[f] = req.body[f];
  });
  if (project.status === 'archived') project.archivedAt = new Date();
  await project.save();
  await logActivity({
    entityType: 'project',
    entityId: project._id,
    user: req.user._id,
    action: 'updated',
    message: `Updated project ${project.name}`,
  });
  const populated = await Project.findById(project._id)
    .populate('members', 'name email avatar role designation')
    .populate('createdBy', 'name email');
  res.json({ project: populated });
});

exports.archive = asyncHandler(async (req, res) => {
  const project = await Project.findByIdAndUpdate(
    req.params.id,
    { status: 'archived', archivedAt: new Date() },
    { new: true }
  );
  if (!project) throw new ApiError(404, 'Project not found');
  res.json({ project });
});

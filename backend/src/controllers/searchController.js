const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const { asyncHandler } = require('../utils/asyncHandler');

exports.search = asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.json({ tasks: [], projects: [], users: [] });
  const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const [tasks, projects, users] = await Promise.all([
    Task.find({ $or: [{ title: rx }, { key: rx }, { tags: rx }] })
      .populate('project', 'name')
      .populate('assignees', 'name avatar')
      .limit(8),
    Project.find({ name: rx }).limit(6),
    User.find({ $or: [{ name: rx }, { email: rx }] }).limit(6),
  ]);
  res.json({ tasks, projects, users });
});

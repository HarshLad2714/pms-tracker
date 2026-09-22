const User = require('../models/User');
const { asyncHandler } = require('../utils/asyncHandler');
const { ApiError } = require('../utils/ApiError');

exports.list = asyncHandler(async (req, res) => {
  const { q, role, active } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (active === 'true') filter.isActive = true;
  if (active === 'false') filter.isActive = false;
  if (q) filter.$or = [{ name: new RegExp(q, 'i') }, { email: new RegExp(q, 'i') }];
  const users = await User.find(filter).sort({ name: 1 });
  res.json({ users });
});

exports.create = asyncHandler(async (req, res) => {
  const { name, email, password, role, department, designation, joiningDate, avatar } = req.body;
  if (!name || !email || !password) throw new ApiError(400, 'Name, email and password are required');
  const user = await User.create({
    name,
    email,
    password,
    role: role || 'employee',
    department,
    designation,
    joiningDate,
    avatar,
  });
  res.status(201).json({ user: user.toSafeJSON() });
});

exports.getOne = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ user });
});

exports.update = asyncHandler(async (req, res) => {
  const { name, email, role, department, designation, joiningDate, avatar, isActive, password } = req.body;
  const user = await User.findById(req.params.id).select('+password');
  if (!user) throw new ApiError(404, 'User not found');

  if (name !== undefined) user.name = name;
  if (email !== undefined) user.email = email;
  if (role !== undefined) user.role = role;
  if (department !== undefined) user.department = department;
  if (designation !== undefined) user.designation = designation;
  if (joiningDate !== undefined) user.joiningDate = joiningDate;
  if (avatar !== undefined) user.avatar = avatar;
  if (isActive !== undefined) user.isActive = isActive;
  if (password) user.password = password;
  await user.save();
  res.json({ user: user.toSafeJSON() });
});

exports.deactivate = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ user });
});

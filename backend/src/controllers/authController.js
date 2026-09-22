const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { jwtSecret, jwtExpiresIn } = require('../config/env');
const { asyncHandler } = require('../utils/asyncHandler');
const { ApiError } = require('../utils/ApiError');

function sign(user) {
  return jwt.sign({ id: user._id, role: user.role }, jwtSecret, { expiresIn: jwtExpiresIn });
}

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, 'Email and password are required');

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !user.isActive) throw new ApiError(401, 'Invalid credentials');
  const ok = await user.comparePassword(password);
  if (!ok) throw new ApiError(401, 'Invalid credentials');

  const token = sign(user);
  res.json({ token, user: user.toSafeJSON() });
});

exports.me = asyncHandler(async (req, res) => {
  res.json({ user: req.user.toSafeJSON() });
});

exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) throw new ApiError(400, 'Both passwords are required');
  if (newPassword.length < 6) throw new ApiError(400, 'New password must be at least 6 characters');

  const user = await User.findById(req.user._id).select('+password');
  const ok = await user.comparePassword(currentPassword);
  if (!ok) throw new ApiError(400, 'Current password is incorrect');
  user.password = newPassword;
  await user.save();
  res.json({ message: 'Password updated' });
});

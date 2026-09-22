const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { jwtSecret } = require('../config/env');
const { ApiError } = require('../utils/ApiError');
const { asyncHandler } = require('../utils/asyncHandler');

const auth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : req.cookies?.token;
  if (!token) throw new ApiError(401, 'Authentication required');

  const payload = jwt.verify(token, jwtSecret);
  const user = await User.findById(payload.id);
  if (!user || !user.isActive) throw new ApiError(401, 'Account is inactive or missing');

  req.user = user;
  next();
});

module.exports = { auth };

const { ApiError } = require('../utils/ApiError');

function roles(...allowed) {
  return (req, res, next) => {
    if (!req.user || !allowed.includes(req.user.role)) {
      throw new ApiError(403, 'You do not have permission for this action');
    }
    next();
  };
}

module.exports = { roles };

const Activity = require('../models/Activity');

async function logActivity({ entityType, entityId, user, action, message, meta }) {
  await Activity.create({ entityType, entityId, user, action, message, meta });
}

module.exports = { logActivity };

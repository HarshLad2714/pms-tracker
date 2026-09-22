const Notification = require('../models/Notification');

async function notify(userIds, payload) {
  const ids = [...new Set((userIds || []).filter(Boolean).map((id) => String(id)))];
  if (!ids.length) return;
  await Notification.insertMany(
    ids.map((user) => ({
      user,
      type: payload.type,
      title: payload.title,
      body: payload.body || '',
      link: payload.link || '',
      meta: payload.meta || {},
    }))
  );
}

module.exports = { notify };

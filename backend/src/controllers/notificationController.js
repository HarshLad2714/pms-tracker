const Notification = require('../models/Notification');
const { asyncHandler } = require('../utils/asyncHandler');

exports.list = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
  const unread = await Notification.countDocuments({ user: req.user._id, read: false });
  res.json({ notifications, unread });
});

exports.readOne = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { read: true },
    { new: true }
  );
  res.json({ notification });
});

exports.readAll = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  res.json({ message: 'All notifications marked as read' });
});

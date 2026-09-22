const router = require('express').Router();
const { auth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.post('/', auth, upload.array('files', 6), (req, res) => {
  const files = (req.files || []).map((file) => ({
    filename: file.filename,
    originalName: file.originalname,
    url: `/uploads/${file.filename}`,
    mimeType: file.mimetype,
    size: file.size,
  }));
  res.status(201).json({ files });
});

module.exports = router;

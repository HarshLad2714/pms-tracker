const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { uploadDir } = require('../config/env');

const dest = path.resolve(process.cwd(), uploadDir);
if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, dest),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^\w.\-]+/g, '_');
    cb(null, `${Date.now()}-${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
});

module.exports = { upload, dest };

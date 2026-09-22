const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

module.exports = {
  port: process.env.PORT || 5060,
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/forge_pms',
  jwtSecret: process.env.JWT_SECRET || 'forge-dev-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5180',
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  workStartHour: Number(process.env.WORK_START_HOUR || 10),
  workEndHour: Number(process.env.WORK_END_HOUR || 19),
};

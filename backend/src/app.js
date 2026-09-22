const path = require('path');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const { clientOrigin, uploadDir } = require('./config/env');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors({ origin: clientOrigin, credentials: true }));
app.use(express.json({ limit: '8mb' }));
app.use(cookieParser());
app.use(morgan('dev'));
app.use('/uploads', express.static(path.resolve(process.cwd(), uploadDir)));

app.get('/api/health', (_req, res) => res.json({ ok: true, name: 'FORGE' }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/bugs', require('./routes/bugs'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/time', require('./routes/time'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/uploads', require('./routes/uploads'));

app.use(errorHandler);

module.exports = { app };

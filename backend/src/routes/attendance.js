const router = require('express').Router();
const { auth } = require('../middleware/auth');
const { roles } = require('../middleware/roles');
const ctrl = require('../controllers/attendanceController');

router.use(auth);
router.post('/clock-in', ctrl.clockIn);
router.post('/clock-out', ctrl.clockOut);
router.get('/today', ctrl.today);
router.get('/me', ctrl.mine);
router.get('/', roles('admin', 'manager'), ctrl.list);
router.get('/summary', roles('admin', 'manager'), ctrl.summary);

module.exports = router;

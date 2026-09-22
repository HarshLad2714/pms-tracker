const router = require('express').Router();
const { auth } = require('../middleware/auth');
const ctrl = require('../controllers/reportController');

router.use(auth);
router.get('/attendance', ctrl.attendance);
router.get('/time', ctrl.time);
router.get('/tasks', ctrl.tasks);
router.get('/export', ctrl.exportCsv);

module.exports = router;

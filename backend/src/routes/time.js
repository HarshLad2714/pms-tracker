const router = require('express').Router();
const { auth } = require('../middleware/auth');
const ctrl = require('../controllers/timeController');

router.use(auth);
router.get('/', ctrl.list);
router.get('/running', ctrl.running);
router.post('/start', ctrl.start);
router.post('/stop', ctrl.stop);
router.post('/manual', ctrl.manual);

module.exports = router;

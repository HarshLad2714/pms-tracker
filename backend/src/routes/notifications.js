const router = require('express').Router();
const { auth } = require('../middleware/auth');
const ctrl = require('../controllers/notificationController');

router.use(auth);
router.get('/', ctrl.list);
router.patch('/read-all', ctrl.readAll);
router.patch('/:id/read', ctrl.readOne);

module.exports = router;

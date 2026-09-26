const router = require('express').Router();
const { auth } = require('../middleware/auth');
const { roles } = require('../middleware/roles');
const ctrl = require('../controllers/userController');

router.use(auth);
router.get('/', ctrl.list);
router.patch('/me', ctrl.updateMe);
router.post('/', roles('admin'), ctrl.create);
router.get('/:id', ctrl.getOne);
router.patch('/:id', roles('admin'), ctrl.update);
router.patch('/:id/deactivate', roles('admin'), ctrl.deactivate);

module.exports = router;

const router = require('express').Router();
const { auth } = require('../middleware/auth');
const { roles } = require('../middleware/roles');
const ctrl = require('../controllers/projectController');

router.use(auth);
router.get('/', ctrl.list);
router.post('/', roles('admin', 'manager'), ctrl.create);
router.get('/:id', ctrl.getOne);
router.patch('/:id', roles('admin', 'manager'), ctrl.update);
router.patch('/:id/archive', roles('admin', 'manager'), ctrl.archive);

module.exports = router;

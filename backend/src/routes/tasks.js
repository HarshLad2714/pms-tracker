const router = require('express').Router();
const { auth } = require('../middleware/auth');
const { roles } = require('../middleware/roles');
const taskCtrl = require('../controllers/taskController');
const bugCtrl = require('../controllers/bugController');

router.use(auth);
router.get('/', taskCtrl.list);
router.post('/', taskCtrl.create);
router.get('/:id', taskCtrl.getOne);
router.patch('/:id', taskCtrl.update);
router.patch('/:id/move', taskCtrl.move);
router.delete('/:id', roles('admin', 'manager'), taskCtrl.remove);
router.post('/:id/comments', taskCtrl.addComment);
router.get('/:taskId/bugs', bugCtrl.listForTask);
router.post('/:taskId/bugs', bugCtrl.create);

module.exports = router;

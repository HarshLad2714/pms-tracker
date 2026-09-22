const router = require('express').Router();
const { auth } = require('../middleware/auth');
const ctrl = require('../controllers/bugController');

router.use(auth);
router.get('/', ctrl.list);
router.get('/:id', ctrl.getOne);
router.patch('/:id', ctrl.update);
router.post('/:id/comments', ctrl.addComment);

module.exports = router;

const express = require('express');
const auth = require('../middleware/auth');
const { createList, updateList, deleteList, reorderLists } = require('../controllers/listController');

const router = express.Router();

router.use(auth);

router.post('/boards/:boardId/lists', createList);
router.put('/lists/:id', updateList);
router.delete('/lists/:id', deleteList);
router.put('/lists/reorder', reorderLists);

module.exports = router;

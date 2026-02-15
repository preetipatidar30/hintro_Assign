const express = require('express');
const auth = require('../middleware/auth');
const {
    createTask, updateTask, deleteTask,
    reorderTasks, assignTask, searchTasks
} = require('../controllers/taskController');

const router = express.Router();

router.use(auth);

router.post('/lists/:listId/tasks', createTask);
router.put('/tasks/reorder', reorderTasks);
router.put('/tasks/:id', updateTask);
router.delete('/tasks/:id', deleteTask);
router.put('/tasks/:id/assign', assignTask);
router.get('/boards/:boardId/tasks/search', searchTasks);

module.exports = router;

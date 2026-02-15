const express = require('express');
const auth = require('../middleware/auth');
const {
    getBoards, createBoard, getBoard, updateBoard, deleteBoard,
    addMember, removeMember
} = require('../controllers/boardController');

const router = express.Router();

router.use(auth);

router.get('/', getBoards);
router.post('/', createBoard);
router.get('/:id', getBoard);
router.put('/:id', updateBoard);
router.delete('/:id', deleteBoard);
router.post('/:id/members', addMember);
router.delete('/:id/members/:userId', removeMember);

module.exports = router;

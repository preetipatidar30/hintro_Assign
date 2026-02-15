const express = require('express');
const { body } = require('express-validator');
const { signup, login, getMe, searchUsers } = require('../controllers/authController');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/signup', [
    body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], signup);

router.post('/login', [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').exists().withMessage('Password is required')
], login);

router.get('/me', auth, getMe);
router.get('/users/search', auth, searchUsers);

module.exports = router;

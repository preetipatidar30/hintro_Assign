const express = require('express');
const auth = require('../middleware/auth');
const { getActivity } = require('../controllers/activityController');

const router = express.Router();

router.use(auth);

router.get('/boards/:boardId/activity', getActivity);

module.exports = router;

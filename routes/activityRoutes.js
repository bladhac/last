const express = require('express');
const router = express.Router();
const { getActivities } = require('../controllers/activityController');
const { auth, checkRole } = require('../middleware/auth');

// مسارات الأنشطة (مع المصادقة)
router.get('/', auth, getActivities);

module.exports = router; 
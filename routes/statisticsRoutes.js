const express = require('express');
const router = express.Router();
const { getStatistics } = require('../controllers/statisticsController');
const { auth, checkRole } = require('../middleware/auth');

// مسارات الإحصائيات (مع المصادقة)
router.get('/', auth, getStatistics);

module.exports = router; 
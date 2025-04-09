const express = require('express');
const router = express.Router();
const {
  createLicense,
  getLicenses,
  getLicense,
  updateLicense,
  revokeLicense,
  deactivateDevice,
  verifyLicense,
  verifyOfflineLicense,
  getLicenseStats
} = require('../controllers/licenseController');
const { auth, checkRole, apiKeyAuth } = require('../middleware/auth');

// مسارات التراخيص مع المصادقة (لوحة التحكم)
router.post('/', auth, checkRole(['admin', 'manager']), createLicense);
router.get('/stats', auth, getLicenseStats);
router.get('/', auth, getLicenses);
router.get('/:id', auth, getLicense);
router.put('/:id', auth, checkRole(['admin', 'manager']), updateLicense);
router.put('/:id/revoke', auth, checkRole(['admin']), revokeLicense);
router.put('/:id/deactivate-device', auth, checkRole(['admin', 'manager']), deactivateDevice);

// مسارات التحقق من الترخيص (API العام)
router.post('/verify', apiKeyAuth, verifyLicense);
router.post('/verify-offline', apiKeyAuth, verifyOfflineLicense);

module.exports = router; 
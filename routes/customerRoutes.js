const express = require('express');
const router = express.Router();
const {
  createCustomer,
  getCustomers,
  getCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerLicenses
} = require('../controllers/customerController');
const { auth, checkRole } = require('../middleware/auth');

// مسارات العملاء مع المصادقة
router.post('/', auth, createCustomer);
router.get('/', auth, getCustomers);
router.get('/:id', auth, getCustomer);
router.put('/:id', auth, updateCustomer);
router.delete('/:id', auth, checkRole(['admin']), deleteCustomer);
router.get('/:id/licenses', auth, getCustomerLicenses);

module.exports = router; 
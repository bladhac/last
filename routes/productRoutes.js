const express = require('express');
const router = express.Router();
const {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  getProductStats
} = require('../controllers/productController');
const { auth, checkRole } = require('../middleware/auth');

// مسارات المنتجات مع المصادقة
router.post('/', auth, checkRole(['admin']), createProduct);
router.get('/', auth, getProducts);
router.get('/:id', auth, getProduct);
router.put('/:id', auth, checkRole(['admin']), updateProduct);
router.delete('/:id', auth, checkRole(['admin']), deleteProduct);
router.get('/:id/stats', auth, checkRole(['admin', 'manager']), getProductStats);

module.exports = router; 
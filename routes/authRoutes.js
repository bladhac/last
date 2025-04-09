const express = require('express');
const router = express.Router();
const { login, register, getMe, changePassword } = require('../controllers/authController');
const { auth } = require('../middleware/auth');

// عرض تفاصيل الطلب عند تسجيل الدخول (للتشخيص)
router.post('/login', (req, res, next) => {
  console.log('طلب تسجيل الدخول:');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  
  // التحقق من وجود بيانات تسجيل الدخول
  if (!req.body || !req.body.username || !req.body.password) {
    return res.status(400).json({ 
      message: 'بيانات تسجيل الدخول غير مكتملة. الرجاء تقديم اسم المستخدم وكلمة المرور.',
      received: {
        username: req.body ? (req.body.username ? 'موجود' : 'مفقود') : 'مفقود',
        password: req.body ? (req.body.password ? 'موجود' : 'مفقود') : 'مفقود'
      }
    });
  }
  
  // استمرار إلى وظيفة تسجيل الدخول الفعلية
  next();
}, login);

// إنشاء مستخدم جديد - للمسؤول فقط
router.post('/register', register);

// الحصول على بيانات المستخدم الحالي - للمستخدمين المسجلين
router.get('/me', auth, getMe);

// تغيير كلمة المرور - للمستخدمين المسجلين
router.put('/change-password', auth, changePassword);

module.exports = router; 
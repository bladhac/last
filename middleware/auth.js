const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

/**
 * التحقق من مصادقة المستخدم عبر JWT
 */
const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'غير مصرح لك بالوصول - رمز الوصول مفقود' });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // فك تشفير الرمز
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // التعامل مع حالة وضع التطوير الخاصة
    if (decoded.id === 'admin-dev') {
      console.log('تم التعرف على مستخدم وضع التطوير admin-dev');
      
      // إنشاء كائن مستخدم افتراضي لوضع التطوير
      req.user = {
        _id: 'admin-dev',
        username: 'admin',
        name: 'مدير النظام',
        role: 'admin',
        active: true
      };
      
      return next();
    }
    
    // البحث عن المستخدم
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: 'غير مصرح لك بالوصول - المستخدم غير موجود' });
    }
    
    if (!user.active) {
      return res.status(401).json({ message: 'حسابك غير نشط - يرجى الاتصال بالمسؤول' });
    }
    
    // إضافة المستخدم إلى الطلب
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'رمز الوصول غير صالح' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'انتهت صلاحية رمز الوصول' });
    }
    console.error('خطأ في المصادقة:', error);
    res.status(500).json({ message: 'خطأ في المصادقة' });
  }
};

/**
 * التحقق من دور المستخدم
 * @param {Array} roles - الأدوار المسموح لها بالوصول
 */
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'غير مصرح لك بالوصول - الرجاء تسجيل الدخول أولاً' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'غير مصرح لك بالوصول - لا تملك صلاحيات كافية' 
      });
    }
    
    next();
  };
};

/**
 * التحقق من صحة مفتاح API للعملاء
 */
const apiKeyAuth = (req, res, next) => {
  try {
    const apiKey = req.header('X-API-KEY');
    
    if (!apiKey) {
      return res.status(401).json({ message: 'غير مصرح لك بالوصول - مفتاح API مفقود' });
    }
    
    // مقارنة مفتاح API مع القيمة المخزنة
    const validApiKey = process.env.API_SECRET_KEY;
    
    if (!validApiKey) {
      console.error('خطأ: مفتاح API غير معرّف في متغيرات البيئة (API_SECRET_KEY)');
      return res.status(500).json({ message: 'خطأ في تكوين الخادم: مفتاح API غير معرّف' });
    }
    
    if (apiKey !== validApiKey) {
      console.warn(`محاولة دخول غير مصرح بها باستخدام مفتاح API غير صالح: ${apiKey.substring(0, 10)}...`);
      return res.status(401).json({ message: 'مفتاح API غير صالح' });
    }
    
    // اجتاز التحقق
    console.log('تم التحقق من مفتاح API بنجاح');
    next();
  } catch (error) {
    console.error('خطأ في التحقق من مفتاح API:', error);
    res.status(500).json({ message: 'خطأ في التحقق من مفتاح API' });
  }
};

module.exports = {
  auth,
  checkRole,
  apiKeyAuth
}; 
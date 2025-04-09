const express = require('express');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
require('dotenv').config();

// استيراد مسارات API
const authRoutes = require('./routes/authRoutes');
const licenseRoutes = require('./routes/licenseRoutes');
const productRoutes = require('./routes/productRoutes');
const customerRoutes = require('./routes/customerRoutes');
const activityRoutes = require('./routes/activityRoutes');
const statisticsRoutes = require('./routes/statisticsRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

// إنشاء التطبيق
const app = express();

// وسطاء
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// وسيط لفحص بيانات JSON
app.use((req, res, next) => {
  if (req.method === 'POST' && req.headers['content-type'] === 'application/json') {
    console.log('تم استلام طلب POST مع بيانات JSON:');
    console.log('الرابط:', req.url);
    console.log('البيانات:', req.body);
  }
  next();
});

// المجلدات الثابتة
app.use(express.static(path.join(__dirname, 'public')));

// مسارات API
app.use('/api/auth', authRoutes);
app.use('/api/licenses', licenseRoutes);
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/settings', settingsRoutes);

// مسار جذر API يعرض معلومات وتوثيق
app.get('/api', (req, res) => {
  const apiVersion = '1.0.0';
  const serverName = process.env.SERVER_NAME || 'نظام إدارة التراخيص';
  
  // جلب مفتاح API من المتغيرات البيئية (إظهار جزء منه فقط للأمان)
  const apiKey = process.env.API_SECRET_KEY;
  const maskedApiKey = apiKey ? 
    `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : 
    'غير معرّف';
  
  // إنشاء قائمة بالمسارات المتاحة
  const availableEndpoints = [
    { path: '/api/auth/login', method: 'POST', description: 'تسجيل الدخول والحصول على رمز JWT' },
    { path: '/api/auth/me', method: 'GET', description: 'الحصول على بيانات المستخدم الحالي' },
    { path: '/api/licenses', method: 'GET', description: 'الحصول على قائمة التراخيص' },
    { path: '/api/licenses', method: 'POST', description: 'إنشاء ترخيص جديد' },
    { path: '/api/licenses/verify', method: 'POST', description: 'التحقق من صلاحية ترخيص', needsApiKey: true },
    { path: '/api/products', method: 'GET', description: 'الحصول على قائمة المنتجات' },
    { path: '/api/customers', method: 'GET', description: 'الحصول على قائمة العملاء' },
    { path: '/api/activities', method: 'GET', description: 'الحصول على سجل الأنشطة' },
    { path: '/api/statistics', method: 'GET', description: 'الحصول على الإحصائيات' },
    { path: '/api/settings/server', method: 'GET', description: 'الحصول على إعدادات الخادم' },
    { path: '/api/ping', method: 'GET', description: 'فحص حالة الخادم', needsApiKey: true }
  ];
  
  res.json({
    name: serverName,
    version: apiVersion,
    description: 'واجهة برمجة التطبيقات لنظام إدارة التراخيص',
    currentTime: new Date().toISOString(),
    status: 'متصل',
    apiKey: maskedApiKey,
    endpoints: availableEndpoints,
    documentation: {
      authentication: 'يتطلب استخدام معظم المسارات توفير رمز JWT في رأس الطلب: Authorization: Bearer {token}',
      apiKey: 'تتطلب بعض المسارات توفير مفتاح API في رأس الطلب: X-API-KEY: {apiKey}',
      note: 'يمكنك الحصول على مفتاح API وإدارته من صفحة الإعدادات في لوحة التحكم'
    }
  });
});

// مسار اختبار
app.get('/api/test', (req, res) => {
  console.log('تم استلام طلب اختبار');
  return res.json({ 
    message: 'الخادم يعمل بشكل طبيعي',
    timestamp: new Date().toISOString()
  });
});

// مسار ping للتحقق من حالة الخادم ومفتاح API
app.get('/api/ping', (req, res) => {
  const apiKey = req.header('X-API-KEY');
  const validApiKey = process.env.API_SECRET_KEY;
  
  const result = {
    status: 'online',
    timestamp: new Date().toISOString(),
    serverTime: new Date().toLocaleString('ar-SA'),
    message: 'الخادم يعمل بشكل طبيعي'
  };
  
  // إذا تم تقديم مفتاح API، تحقق من صحته
  if (apiKey) {
    result.apiKeyProvided = true;
    
    if (!validApiKey) {
      result.apiKeyStatus = 'not_configured';
      result.message = 'مفتاح API غير معرّف في إعدادات الخادم';
    } else if (apiKey === validApiKey) {
      result.apiKeyStatus = 'valid';
      result.message = 'مفتاح API صالح';
    } else {
      result.apiKeyStatus = 'invalid';
      result.message = 'مفتاح API غير صالح';
    }
  } else {
    result.apiKeyProvided = false;
  }
  
  res.json(result);
});

// الصفحة الرئيسية
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// معالجة المسارات غير الموجودة
app.use((req, res) => {
  res.status(404).json({ message: 'المسار غير موجود' });
});

// معالجة الأخطاء
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'حدث خطأ في الخادم', error: err.message });
});

module.exports = app; 
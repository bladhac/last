const app = require('./app');
const connectDB = require('./config/db');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// تحديد المنفذ
const PORT = process.env.PORT || 5001;

// بدء الخادم
const startServer = async () => {
  try {
    // الاتصال بقاعدة البيانات
    await connectDB();
    
    // التحقق من وجود المستخدم المسؤول الافتراضي وإنشاؤه إذا لم يكن موجودًا
    await setupAdminUser();
    
    // بدء الاستماع للطلبات
    app.listen(PORT, () => {
      console.log(`تم بدء تشغيل الخادم على المنفذ ${PORT}`);
    });
  } catch (error) {
    console.error('فشل في بدء تشغيل الخادم:', error);
    process.exit(1);
  }
};

// إنشاء مستخدم مسؤول افتراضي إذا لم يكن موجودًا
const setupAdminUser = async () => {
  try {
    // التحقق من وجود مستخدم مسؤول
    const adminCount = await User.countDocuments({ role: 'admin' });
    
    if (adminCount === 0) {
      console.log('لا يوجد مستخدم مسؤول، جاري إنشاء مستخدم مسؤول افتراضي...');
      
      // إنشاء مستخدم مسؤول افتراضي
      const adminUser = new User({
        name: 'مدير النظام',
        username: 'admin',
        password: process.env.ADMIN_PASSWORD || 'adminPassword123',
        role: 'admin'
      });
      
      await adminUser.save();
      console.log('تم إنشاء مستخدم مسؤول افتراضي بنجاح');
    }
  } catch (error) {
    console.error('خطأ في إعداد المستخدم المسؤول:', error);
    throw error;
  }
};

// بدء تشغيل الخادم
startServer(); 
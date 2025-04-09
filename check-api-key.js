const mongoose = require('mongoose');
require('dotenv').config();

const Settings = require('./models/settings');

// الاتصال بقاعدة البيانات
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('تم الاتصال بقاعدة البيانات بنجاح');
    
    // البحث عن إعدادات السيرفر
    Settings.findOne({ type: 'server' })
      .then(settings => {
        if (!settings) {
          console.log('لم يتم العثور على إعدادات للسيرفر في قاعدة البيانات');
          console.log('المفتاح الافتراضي من ملف .env هو:', process.env.API_SECRET_KEY);
        } else {
          console.log('إعدادات السيرفر المخزنة في قاعدة البيانات:');
          console.log('بيانات السيرفر:', JSON.stringify(settings.data, null, 2));
          
          // الوصول إلى مفتاح API إذا كان موجودًا
          const apiKey = settings.data.api && settings.data.api.key;
          console.log('مفتاح API المخزن:', apiKey || 'غير محدد');
          console.log('مفتاح API من ملف .env:', process.env.API_SECRET_KEY);
        }
        
        // إغلاق الاتصال بقاعدة البيانات
        mongoose.connection.close();
      })
      .catch(err => {
        console.error('خطأ في البحث عن الإعدادات:', err);
        mongoose.connection.close();
      });
  })
  .catch(err => {
    console.error('خطأ في الاتصال بقاعدة البيانات:', err);
  }); 
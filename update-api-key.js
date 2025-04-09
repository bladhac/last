const mongoose = require('mongoose');
require('dotenv').config();

const Settings = require('./models/settings');

// المفتاح الجديد
const NEW_API_KEY = 'apL8K2JqPwT7rLnQ9YsVxXc4E5H6M3A';

// الاتصال بقاعدة البيانات
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('تم الاتصال بقاعدة البيانات بنجاح');
    
    // البحث عن إعدادات السيرفر وتحديثها
    Settings.findOne({ type: 'server' })
      .then(settings => {
        console.log('تم العثور على إعدادات السيرفر:', settings ? 'نعم' : 'لا');
        
        if (!settings) {
          // إنشاء إعدادات جديدة إذا لم تكن موجودة
          console.log('إنشاء إعدادات سيرفر جديدة مع مفتاح API');
          
          const newSettings = new Settings({
            type: 'server',
            data: {
              name: 'خادم الترخيص',
              url: 'http://localhost:3000',
              smtp: {
                host: '',
                port: '587',
                user: '',
                from: 'licenses@example.com'
              },
              license: {
                format: 'XXXX-XXXX-XXXX-XXXX',
                maxActivationsDefault: 1,
                trialDaysDefault: 30
              },
              api: {
                key: NEW_API_KEY,
                requestLimit: 1000
              }
            }
          });
          
          newSettings.save()
            .then(() => {
              console.log('تم إنشاء إعدادات جديدة بنجاح مع مفتاح API:', NEW_API_KEY);
              mongoose.connection.close();
            })
            .catch(err => {
              console.error('خطأ في حفظ الإعدادات الجديدة:', err);
              mongoose.connection.close();
            });
        } else {
          // تحديث الإعدادات الموجودة
          console.log('تحديث مفتاح API في إعدادات السيرفر الموجودة');
          console.log('البيانات الحالية:', JSON.stringify(settings.data, null, 2));
          
          // إنشاء نسخة من البيانات الحالية
          const updatedData = { ...settings.data };
          
          // تأكد من وجود كائن api
          if (!updatedData.api) {
            updatedData.api = {};
          }
          
          // تعيين مفتاح API الجديد
          updatedData.api.key = NEW_API_KEY;
          
          // تحديث بيانات الإعدادات
          Settings.updateOne(
            { type: 'server' },
            { $set: { data: updatedData } }
          )
            .then(result => {
              console.log('تم تحديث الإعدادات بنجاح:', result);
              console.log('مفتاح API الجديد:', NEW_API_KEY);
              mongoose.connection.close();
            })
            .catch(err => {
              console.error('خطأ في تحديث الإعدادات:', err);
              mongoose.connection.close();
            });
        }
      })
      .catch(err => {
        console.error('خطأ في البحث عن الإعدادات:', err);
        mongoose.connection.close();
      });
  })
  .catch(err => {
    console.error('خطأ في الاتصال بقاعدة البيانات:', err);
  }); 
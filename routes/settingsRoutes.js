const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/auth');
const Settings = require('../models/settings');

/**
 * مسار للحصول على إعدادات النظام
 * GET /api/settings
 */
router.get('/', auth, (req, res) => {
  try {
    // نعيد إعدادات النظام
    res.status(200).json({
      admin: {
        name: 'مدير النظام',
        username: 'admin',
        email: 'admin@example.com'
      },
      server: {
        name: 'نظام إدارة التراخيص',
        url: 'http://localhost:3000',
        smtp: {
          host: 'smtp.example.com',
          port: '587',
          user: 'user@example.com',
          from: 'support@example.com'
        },
        license: {
          format: 'XXXXX-XXXXX-XXXXX-XXXXX-XXXXX',
          maxActivationsDefault: 3,
          trialDaysDefault: 14
        }
      }
    });
  } catch (error) {
    console.error('خطأ في جلب الإعدادات:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء جلب الإعدادات' });
  }
});

/**
 * مسار لتحديث إعدادات المسؤول
 * PUT /api/settings/admin
 */
router.put('/admin', auth, checkRole('admin'), async (req, res) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;
    
    // تنفيذ تحديث الإعدادات
    // استخدام نموذج Settings للتخزين في قاعدة البيانات
    let adminSettings = await Settings.findOne({ type: 'admin' });
    
    if (!adminSettings) {
      // إنشاء إعدادات جديدة إذا لم تكن موجودة
      adminSettings = new Settings({
        type: 'admin',
        data: {
          name,
          email,
          username: req.user.username // استخدام اسم المستخدم الحالي
        }
      });
      await adminSettings.save();
    } else {
      // تحديث الإعدادات الموجودة
      adminSettings.data = {
        ...adminSettings.data,
        name,
        email
      };
      await adminSettings.save();
    }
    
    // معالجة تغيير كلمة المرور إذا تم توفيرها
    if (currentPassword && newPassword) {
      // هنا يمكن إضافة منطق تغيير كلمة المرور للمستخدم
      console.log('يجب تنفيذ تغيير كلمة المرور للمستخدم:', req.user.username);
    }
    
    // تسجيل عملية تحديث الإعدادات
    console.log(`تم تحديث إعدادات المسؤول بواسطة المستخدم: ${req.user.username}`);
    
    res.status(200).json({ 
      message: 'تم تحديث إعدادات المسؤول بنجاح',
      admin: adminSettings.data
    });
  } catch (error) {
    console.error('خطأ في تحديث إعدادات المسؤول:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء تحديث إعدادات المسؤول: ' + error.message });
  }
});

/**
 * مسار لتحديث إعدادات الخادم
 * PUT /api/settings/server
 */
router.put('/server', auth, checkRole('admin'), async (req, res) => {
  try {
    const { name, url, smtp, license, api } = req.body;
    
    // تنفيذ تحديث إعدادات الخادم
    // استخدام نموذج Settings للتخزين في قاعدة البيانات
    let serverSettings = await Settings.findOne({ type: 'server' });
    
    if (!serverSettings) {
      // إنشاء إعدادات جديدة إذا لم تكن موجودة
      serverSettings = new Settings({
        type: 'server',
        data: {
          name,
          url,
          smtp,
          license,
          api
        }
      });
      await serverSettings.save();
    } else {
      // تحديث الإعدادات الموجودة
      serverSettings.data = {
        name,
        url,
        smtp,
        license,
        api
      };
      await serverSettings.save();
    }
    
    // إذا تم تغيير مفتاح API، تحديث المتغير البيئي
    if (api && api.key) {
      process.env.API_SECRET_KEY = api.key;
      console.log('تم تحديث مفتاح API في المتغيرات البيئية');
    }
    
    // تسجيل عملية تحديث الإعدادات
    console.log(`تم تحديث إعدادات الخادم بواسطة المستخدم: ${req.user.username}`);
    
    res.status(200).json({ 
      message: 'تم تحديث إعدادات الخادم بنجاح',
      server: {
        name,
        url,
        smtp,
        license,
        api: {
          key: api?.key ? '******' : null, // عدم إرجاع المفتاح الكامل في الاستجابة
          requestLimit: api?.requestLimit
        }
      }
    });
  } catch (error) {
    console.error('خطأ في تحديث إعدادات الخادم:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء تحديث إعدادات الخادم: ' + error.message });
  }
});

/**
 * مسار للحصول على إعدادات الخادم
 * GET /api/settings/server
 */
router.get('/server', auth, (req, res) => {
  try {
    // استخدام نموذج Settings للحصول على إعدادات الخادم
    Settings.findOne({ type: 'server' })
      .then(serverSettings => {
        if (!serverSettings) {
          // إرجاع إعدادات افتراضية إذا لم يتم العثور على إعدادات مخزنة
          return res.status(200).json({
            server: {
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
                key: process.env.API_SECRET_KEY || '',
                requestLimit: 1000
              }
            }
          });
        }
        
        // إعداد بيانات API لإرجاعها
        let apiData = serverSettings.data.api || {};
        
        // إضافة مفتاح API من المتغيرات البيئية إذا لم يكن موجودًا في البيانات المخزنة
        if (!apiData.key && process.env.API_SECRET_KEY) {
          apiData.key = process.env.API_SECRET_KEY;
        }
        
        // إضافة بيانات API قبل إرجاع الإعدادات
        const serverData = {
          ...serverSettings.data,
          api: apiData
        };
        
        // إرجاع الإعدادات المخزنة
        res.status(200).json({
          server: serverData
        });
      })
      .catch(error => {
        console.error('خطأ في الحصول على إعدادات الخادم:', error);
        res.status(500).json({ message: 'حدث خطأ أثناء الحصول على إعدادات الخادم' });
      });
  } catch (error) {
    console.error('خطأ في الحصول على إعدادات الخادم:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء الحصول على إعدادات الخادم' });
  }
});

/**
 * مسار للحصول على إعدادات المسؤول
 * GET /api/settings/admin
 */
router.get('/admin', auth, (req, res) => {
  try {
    // استخدام نموذج Settings للحصول على إعدادات المسؤول
    Settings.findOne({ type: 'admin' })
      .then(adminSettings => {
        if (!adminSettings) {
          // إرجاع إعدادات افتراضية إذا لم يتم العثور على إعدادات مخزنة
          return res.status(200).json({
            admin: {
              name: 'مدير النظام',
              username: 'admin',
              email: 'admin@example.com'
            }
          });
        }
        
        // إرجاع الإعدادات المخزنة
        res.status(200).json({
          admin: adminSettings.data
        });
      })
      .catch(error => {
        console.error('خطأ في الحصول على إعدادات المسؤول:', error);
        res.status(500).json({ message: 'حدث خطأ أثناء الحصول على إعدادات المسؤول' });
      });
  } catch (error) {
    console.error('خطأ في الحصول على إعدادات المسؤول:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء الحصول على إعدادات المسؤول' });
  }
});

module.exports = router; 
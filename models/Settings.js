const mongoose = require('mongoose');

/**
 * نموذج إعدادات النظام
 * يخزن الإعدادات المختلفة للنظام مثل إعدادات الخادم، إعدادات البريد الإلكتروني، إلخ
 */
const SettingsSchema = new mongoose.Schema({
  // نوع الإعدادات (server, admin, email, etc.)
  type: {
    type: String,
    required: true,
    unique: true,
    enum: ['server', 'admin', 'email', 'general', 'license'],
    index: true
  },
  // البيانات المخزنة (تخزن كمستند JSON)
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    default: {}
  },
  // معلومات الإنشاء والتحديث
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// تحديث التاريخ قبل الحفظ
SettingsSchema.pre('save', function(next) {
  // تحديث تاريخ التحديث فقط عند التغيير
  if (this.isModified()) {
    this.updatedAt = Date.now();
  }
  next();
});

// طريقة للحصول على إعدادات معينة
SettingsSchema.statics.getSetting = async function(type) {
  const setting = await this.findOne({ type });
  return setting ? setting.data : null;
};

// طريقة لتحديث إعدادات معينة
SettingsSchema.statics.updateSetting = async function(type, data) {
  let setting = await this.findOne({ type });
  
  if (!setting) {
    setting = new this({ type, data });
  } else {
    setting.data = { ...setting.data, ...data };
  }
  
  await setting.save();
  return setting.data;
};

module.exports = mongoose.model('Settings', SettingsSchema); 
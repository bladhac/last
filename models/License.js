const mongoose = require('mongoose');

const activationSchema = new mongoose.Schema({
  deviceFingerprint: {
    type: String,
    required: true
  },
  activationDate: {
    type: Date,
    default: Date.now
  },
  lastCheckDate: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  deviceInfo: {
    type: Object,
    default: {}
  }
});

const licenseSchema = new mongoose.Schema({
  licenseKey: {
    type: String,
    required: true,
    unique: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  customerName: {
    type: String,
    required: true
  },
  customerEmail: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['perpetual', 'subscription', 'trial'],
    default: 'perpetual'
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'revoked', 'pending'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date
  },
  maxDevices: {
    type: Number,
    default: 1
  },
  activations: [activationSchema],
  isRevoked: {
    type: Boolean,
    default: false
  },
  revokedReason: {
    type: String
  },
  revokedAt: {
    type: Date
  },
  notes: {
    type: String
  },
  metadata: {
    type: Object,
    default: {}
  },
  offlineData: {
    type: String // بيانات مشفرة للتحقق دون اتصال
  }
});

// التحقق من صلاحية الترخيص
licenseSchema.methods.isValid = function() {
  if (this.isRevoked) return false;
  
  if (this.status !== 'active') return false;
  
  if (this.expiryDate && new Date() > this.expiryDate) {
    this.status = 'expired';
    return false;
  }
  
  return true;
};

// التحقق من تجاوز عدد الأجهزة
licenseSchema.methods.hasReachedDeviceLimit = function() {
  const activeActivations = this.activations.filter(a => a.isActive).length;
  return activeActivations >= this.maxDevices;
};

// إضافة تفعيل جديد
licenseSchema.methods.addActivation = function(deviceFingerprint, deviceInfo = {}) {
  // التحقق من وجود التفعيل مسبقًا
  const existingActivation = this.activations.find(
    a => a.deviceFingerprint === deviceFingerprint
  );
  
  if (existingActivation) {
    existingActivation.lastCheckDate = new Date();
    existingActivation.isActive = true;
    if (deviceInfo) existingActivation.deviceInfo = deviceInfo;
    return existingActivation;
  }
  
  // إنشاء تفعيل جديد
  const newActivation = {
    deviceFingerprint,
    activationDate: new Date(),
    lastCheckDate: new Date(),
    isActive: true,
    deviceInfo
  };
  
  this.activations.push(newActivation);
  return newActivation;
};

// إلغاء تنشيط جهاز
licenseSchema.methods.deactivateDevice = function(deviceFingerprint) {
  const activation = this.activations.find(
    a => a.deviceFingerprint === deviceFingerprint
  );
  
  if (activation) {
    activation.isActive = false;
    return true;
  }
  
  return false;
};

const License = mongoose.model('License', licenseSchema);

module.exports = License; 
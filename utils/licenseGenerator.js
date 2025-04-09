const crypto = require('crypto-js');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

/**
 * توليد مفتاح ترخيص بناءً على بيانات محددة
 * @param {Object} licenseData - بيانات الترخيص
 * @returns {String} - مفتاح الترخيص المولد
 */
function generateLicenseKey(licenseData) {
  try {
    // إضافة معرف فريد للترخيص
    const licenseId = uuidv4().replace(/-/g, '').substring(0, 8);
    
    // إنشاء بيانات الترخيص الأساسية
    const baseData = {
      p: licenseData.productId.toString(), // معرف المنتج
      c: licenseData.customerId ? licenseData.customerId.toString() : null, // معرف العميل
      t: licenseData.type, // نوع الترخيص
      e: licenseData.expiryDate ? licenseData.expiryDate.getTime() : null, // تاريخ انتهاء الصلاحية
      d: licenseData.maxDevices || 1, // عدد الأجهزة المسموح بها
      i: licenseId, // معرف الترخيص
      cr: Date.now() // تاريخ الإنشاء
    };
    
    // تحويل البيانات إلى نص JSON
    const dataString = JSON.stringify(baseData);
    
    // الحصول على المفتاح السري
    const secretKey = process.env.LICENSE_SECRET_KEY;
    
    // تشفير البيانات باستخدام AES
    const encrypted = crypto.AES.encrypt(dataString, secretKey).toString();
    
    // إنشاء توقيع باستخدام HMAC-SHA256
    const signature = crypto.HmacSHA256(encrypted, secretKey).toString();
    
    // دمج التشفير والتوقيع (8 حروف من التوقيع فقط)
    const combined = `${encrypted}:${signature.substring(0, 8)}`;
    
    // تحويل النص المشفر إلى Base64 وتنظيفه
    const base64Key = Buffer.from(combined).toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    // تنسيق المفتاح بالشكل XXXXX-XXXXX-XXXXX-XXXXX-XXXXX
    const formattedKey = base64Key.match(/.{1,5}/g).join('-');
    
    // التأكد من أن المفتاح لا يتجاوز 29 حرفًا (5 مجموعات من 5 أحرف + 4 شرطات)
    return formattedKey.substring(0, 29);
  } catch (error) {
    console.error('خطأ في توليد مفتاح الترخيص:', error);
    throw new Error('فشل في إنشاء مفتاح الترخيص');
  }
}

/**
 * التحقق من صحة مفتاح الترخيص وفك تشفيره
 * @param {String} licenseKey - مفتاح الترخيص للتحقق منه
 * @returns {Object} - بيانات الترخيص المستخرجة
 */
function verifyLicenseKey(licenseKey) {
  try {
    // تنظيف المفتاح
    const cleanKey = licenseKey.replace(/-/g, '')
      .replace(/_/g, '/')
      .replace(/-/g, '+');
    
    // فك تشفير Base64
    const decoded = Buffer.from(cleanKey, 'base64').toString();
    
    // فصل التشفير والتوقيع
    const [encrypted, signature] = decoded.split(':');
    
    // الحصول على المفتاح السري
    const secretKey = process.env.LICENSE_SECRET_KEY;
    
    // التحقق من التوقيع
    const calculatedSignature = crypto.HmacSHA256(encrypted, secretKey).toString();
    
    if (calculatedSignature.substring(0, 8) !== signature) {
      throw new Error('توقيع الترخيص غير صالح');
    }
    
    // فك تشفير AES
    const decrypted = crypto.AES.decrypt(encrypted, secretKey).toString(crypto.enc.Utf8);
    
    // تحليل البيانات
    const licenseData = JSON.parse(decrypted);
    
    // إضافة حقول مفيدة
    if (licenseData.e) {
      licenseData.expiryDate = new Date(licenseData.e);
      licenseData.isExpired = new Date() > licenseData.expiryDate;
    } else {
      licenseData.isExpired = false;
    }
    
    licenseData.createdAt = new Date(licenseData.cr);
    
    return {
      success: true,
      data: licenseData
    };
  } catch (error) {
    console.error('خطأ في التحقق من مفتاح الترخيص:', error);
    return {
      success: false,
      message: 'مفتاح الترخيص غير صالح',
      error: error.message
    };
  }
}

/**
 * إنشاء بيانات للتحقق من الترخيص دون اتصال بالإنترنت
 * @param {Object} license - بيانات الترخيص
 * @param {String} deviceFingerprint - بصمة الجهاز
 * @returns {String} - البيانات المشفرة للتحقق دون اتصال
 */
function generateOfflineData(license, deviceFingerprint) {
  try {
    const offlineData = {
      licenseKey: license.licenseKey,
      deviceFingerprint: deviceFingerprint,
      expiryDate: license.expiryDate,
      type: license.type,
      productId: license.productId.toString(),
      timestamp: Date.now(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // صالح لمدة 30 يومًا
    };
    
    // تشفير البيانات
    const dataString = JSON.stringify(offlineData);
    const secretKey = process.env.LICENSE_SECRET_KEY;
    const encrypted = crypto.AES.encrypt(dataString, secretKey).toString();
    
    return encrypted;
  } catch (error) {
    console.error('خطأ في إنشاء بيانات التحقق دون اتصال:', error);
    return null;
  }
}

/**
 * التحقق من بيانات الترخيص دون اتصال
 * @param {String} offlineData - البيانات المشفرة
 * @param {String} deviceFingerprint - بصمة الجهاز
 * @returns {Object} - نتيجة التحقق
 */
function verifyOfflineData(offlineData, deviceFingerprint) {
  try {
    // فك تشفير البيانات
    const secretKey = process.env.LICENSE_SECRET_KEY;
    const decrypted = crypto.AES.decrypt(offlineData, secretKey).toString(crypto.enc.Utf8);
    const data = JSON.parse(decrypted);
    
    // التحقق من بصمة الجهاز
    if (data.deviceFingerprint !== deviceFingerprint) {
      return {
        success: false,
        message: 'بصمة الجهاز غير متطابقة'
      };
    }
    
    // التحقق من صلاحية البيانات
    const now = new Date();
    const validUntil = new Date(data.validUntil);
    
    if (now > validUntil) {
      return {
        success: false,
        message: 'انتهت صلاحية بيانات التحقق دون اتصال'
      };
    }
    
    // التحقق من انتهاء صلاحية الترخيص
    if (data.expiryDate) {
      const expiryDate = new Date(data.expiryDate);
      if (now > expiryDate) {
        return {
          success: false,
          message: 'انتهت صلاحية الترخيص'
        };
      }
    }
    
    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error('خطأ في التحقق من بيانات الترخيص دون اتصال:', error);
    return {
      success: false,
      message: 'بيانات التحقق دون اتصال غير صالحة',
      error: error.message
    };
  }
}

module.exports = {
  generateLicenseKey,
  verifyLicenseKey,
  generateOfflineData,
  verifyOfflineData
}; 
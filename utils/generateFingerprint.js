const crypto = require('crypto-js');

/**
 * توليد بصمة للجهاز بناءً على معلوماته
 * @param {Object} deviceInfo - معلومات الجهاز
 * @returns {String} - بصمة الجهاز
 */
function generateDeviceFingerprint(deviceInfo) {
  try {
    // التأكد من وجود المعلومات الضرورية
    if (!deviceInfo || Object.keys(deviceInfo).length === 0) {
      throw new Error('معلومات الجهاز غير كافية');
    }
    
    // استخراج البيانات الأساسية
    const {
      hostname,
      username,
      platform,
      cpuModel,
      memorySize,
      diskSize,
      macAddress,
      uuid
    } = deviceInfo;
    
    // إنشاء سلسلة مركبة من البيانات
    const fingerprintData = [
      uuid || '',
      hostname || '',
      username || '',
      platform || '',
      cpuModel || '',
      memorySize ? memorySize.toString() : '',
      diskSize ? diskSize.toString() : '',
      macAddress || ''
    ].join('|');
    
    // إنشاء هاش SHA-256 للسلسلة
    const fingerprint = crypto.SHA256(fingerprintData).toString();
    
    return fingerprint;
  } catch (error) {
    console.error('خطأ في توليد بصمة الجهاز:', error);
    // توليد بصمة عشوائية في حالة الخطأ (غير مستحسن في الإنتاج)
    return crypto.SHA256(Date.now().toString() + Math.random().toString()).toString();
  }
}

/**
 * مقارنة بصمة الجهاز مع بصمة مخزنة
 * @param {String} storedFingerprint - البصمة المخزنة
 * @param {String} currentFingerprint - البصمة الحالية
 * @returns {Boolean} - هل البصمتان متطابقتان
 */
function compareFingerprints(storedFingerprint, currentFingerprint) {
  return storedFingerprint === currentFingerprint;
}

module.exports = {
  generateDeviceFingerprint,
  compareFingerprints
}; 
const License = require('../models/License');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const licenseGenerator = require('../utils/licenseGenerator');
const { generateDeviceFingerprint } = require('../utils/generateFingerprint');
require('dotenv').config();

/**
 * إنشاء ترخيص جديد
 * @route POST /api/licenses
 * @access Private (Admin/Manager)
 */
const createLicense = async (req, res) => {
  try {
    const {
      productId,
      customerId,
      customerName,
      customerEmail,
      type,
      expiryDate,
      maxDevices,
      notes
    } = req.body;
    
    // التحقق من وجود المنتج
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'المنتج غير موجود' });
    }
    
    // التحقق من وجود العميل إذا تم تحديده
    if (customerId) {
      const customer = await Customer.findById(customerId);
      if (!customer) {
        return res.status(404).json({ message: 'العميل غير موجود' });
      }
    }
    
    // التحقق من البيانات الإلزامية
    if (!customerName || !customerEmail) {
      return res.status(400).json({ message: 'يرجى توفير اسم العميل والبريد الإلكتروني' });
    }
    
    // إعداد بيانات الترخيص
    const licenseData = {
      productId,
      customerId,
      customerName,
      customerEmail,
      type: type || 'perpetual',
      maxDevices: maxDevices || 1,
      notes
    };
    
    // إضافة تاريخ انتهاء الصلاحية إذا كان مطلوبًا
    if (expiryDate) {
      licenseData.expiryDate = new Date(expiryDate);
    } else if (type === 'subscription') {
      // إذا كان الترخيص بالاشتراك ولم يتم تحديد تاريخ، نضع تاريخ افتراضي لسنة من الآن
      const defaultExpiryDate = new Date();
      defaultExpiryDate.setFullYear(defaultExpiryDate.getFullYear() + 1);
      licenseData.expiryDate = defaultExpiryDate;
    } else if (type === 'trial') {
      // إذا كان ترخيصًا تجريبيًا، نحدد المدة حسب المنتج أو القيمة الافتراضية
      const trialDays = product.trialDays || parseInt(process.env.TRIAL_PERIOD_DAYS, 10) || 14;
      const trialExpiryDate = new Date();
      trialExpiryDate.setDate(trialExpiryDate.getDate() + trialDays);
      licenseData.expiryDate = trialExpiryDate;
    }
    
    // توليد مفتاح الترخيص
    const licenseKey = licenseGenerator.generateLicenseKey(licenseData);
    
    // إنشاء الترخيص في قاعدة البيانات
    const license = new License({
      ...licenseData,
      licenseKey
    });
    
    await license.save();
    
    res.status(201).json({
      message: 'تم إنشاء الترخيص بنجاح',
      license: {
        id: license._id,
        licenseKey: license.licenseKey,
        customerName: license.customerName,
        type: license.type,
        expiryDate: license.expiryDate,
        createdAt: license.createdAt
      }
    });
  } catch (error) {
    console.error('خطأ في إنشاء الترخيص:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء إنشاء الترخيص' });
  }
};

/**
 * الحصول على جميع التراخيص
 * @route GET /api/licenses
 * @access Private (Admin/Manager)
 */
const getLicenses = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type, productId, customerId, search } = req.query;
    
    // إنشاء شروط البحث
    const query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (type) {
      query.type = type;
    }
    
    if (productId) {
      query.productId = productId;
    }
    
    if (customerId) {
      query.customerId = customerId;
    }
    
    if (search) {
      query.$or = [
        { licenseKey: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } }
      ];
    }
    
    // تنفيذ الاستعلام مع التقسيم إلى صفحات
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { createdAt: -1 },
      populate: 'productId'
    };
    
    const licenses = await License.find(query)
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .sort(options.sort)
      .populate(options.populate);
    
    // الحصول على إجمالي عدد التراخيص
    const total = await License.countDocuments(query);
    
    res.status(200).json({
      licenses: licenses.map(license => ({
        id: license._id,
        licenseKey: license.licenseKey,
        customerName: license.customerName,
        customerEmail: license.customerEmail,
        productName: license.productId ? license.productId.name : null,
        type: license.type,
        status: license.status,
        expiryDate: license.expiryDate,
        createdAt: license.createdAt,
        activations: license.activations.length,
        maxDevices: license.maxDevices
      })),
      totalPages: Math.ceil(total / options.limit),
      currentPage: options.page,
      total
    });
  } catch (error) {
    console.error('خطأ في الحصول على التراخيص:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء استرجاع التراخيص' });
  }
};

/**
 * الحصول على ترخيص محدد
 * @route GET /api/licenses/:id
 * @access Private (Admin/Manager)
 */
const getLicense = async (req, res) => {
  try {
    const license = await License.findById(req.params.id)
      .populate('productId', 'name version productCode')
      .populate('customerId', 'name email company');
    
    if (!license) {
      return res.status(404).json({ message: 'الترخيص غير موجود' });
    }
    
    res.status(200).json({ license });
  } catch (error) {
    console.error('خطأ في الحصول على الترخيص:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء استرجاع الترخيص' });
  }
};

/**
 * تحديث ترخيص
 * @route PUT /api/licenses/:id
 * @access Private (Admin/Manager)
 */
const updateLicense = async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      type,
      status,
      expiryDate,
      maxDevices,
      notes
    } = req.body;
    
    // البحث عن الترخيص
    const license = await License.findById(req.params.id);
    
    if (!license) {
      return res.status(404).json({ message: 'الترخيص غير موجود' });
    }
    
    // تحديث البيانات
    if (customerName) license.customerName = customerName;
    if (customerEmail) license.customerEmail = customerEmail;
    if (type) license.type = type;
    if (status) license.status = status;
    if (expiryDate) license.expiryDate = new Date(expiryDate);
    if (maxDevices) license.maxDevices = maxDevices;
    if (notes !== undefined) license.notes = notes;
    
    await license.save();
    
    res.status(200).json({
      message: 'تم تحديث الترخيص بنجاح',
      license: {
        id: license._id,
        licenseKey: license.licenseKey,
        customerName: license.customerName,
        type: license.type,
        status: license.status,
        expiryDate: license.expiryDate
      }
    });
  } catch (error) {
    console.error('خطأ في تحديث الترخيص:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء تحديث الترخيص' });
  }
};

/**
 * إلغاء ترخيص
 * @route PUT /api/licenses/:id/revoke
 * @access Private (Admin)
 */
const revokeLicense = async (req, res) => {
  try {
    const { reason } = req.body;
    
    // البحث عن الترخيص
    const license = await License.findById(req.params.id);
    
    if (!license) {
      return res.status(404).json({ message: 'الترخيص غير موجود' });
    }
    
    // تحديث حالة الترخيص
    license.isRevoked = true;
    license.revokedReason = reason || 'إلغاء بواسطة المسؤول';
    license.revokedAt = new Date();
    license.status = 'revoked';
    
    await license.save();
    
    res.status(200).json({
      message: 'تم إلغاء الترخيص بنجاح'
    });
  } catch (error) {
    console.error('خطأ في إلغاء الترخيص:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء إلغاء الترخيص' });
  }
};

/**
 * إلغاء تنشيط جهاز
 * @route PUT /api/licenses/:id/deactivate-device
 * @access Private (Admin/Manager)
 */
const deactivateDevice = async (req, res) => {
  try {
    const { deviceFingerprint } = req.body;
    
    if (!deviceFingerprint) {
      return res.status(400).json({ message: 'بصمة الجهاز مطلوبة' });
    }
    
    // البحث عن الترخيص
    const license = await License.findById(req.params.id);
    
    if (!license) {
      return res.status(404).json({ message: 'الترخيص غير موجود' });
    }
    
    // إلغاء تنشيط الجهاز
    const result = license.deactivateDevice(deviceFingerprint);
    
    if (!result) {
      return res.status(404).json({ message: 'الجهاز غير موجود في قائمة الأجهزة المنشطة' });
    }
    
    await license.save();
    
    res.status(200).json({
      message: 'تم إلغاء تنشيط الجهاز بنجاح'
    });
  } catch (error) {
    console.error('خطأ في إلغاء تنشيط الجهاز:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء إلغاء تنشيط الجهاز' });
  }
};

/**
 * التحقق من ترخيص (للعملاء)
 * @route POST /api/licenses/verify
 * @access Public (با مفتاح API)
 */
const verifyLicense = async (req, res) => {
  try {
    const { licenseKey, deviceFingerprint, deviceInfo } = req.body;
    
    if (!licenseKey || !deviceFingerprint) {
      return res.status(400).json({
        success: false,
        message: 'مفتاح الترخيص وبصمة الجهاز مطلوبان'
      });
    }
    
    // البحث عن الترخيص في قاعدة البيانات
    const license = await License.findOne({ licenseKey }).populate('productId', 'name version');
    
    if (!license) {
      return res.status(404).json({
        success: false,
        message: 'مفتاح الترخيص غير صالح'
      });
    }
    
    // التحقق من صلاحية الترخيص
    if (!license.isValid()) {
      return res.status(400).json({
        success: false,
        message: license.status === 'expired' ? 'الترخيص منتهي الصلاحية' : 'الترخيص غير صالح',
        status: license.status
      });
    }
    
    // التحقق من بصمة الجهاز وإضافة التفعيل إذا لم يكن موجودًا
    const existingActivation = license.activations.find(
      a => a.deviceFingerprint === deviceFingerprint && a.isActive
    );
    
    if (!existingActivation) {
      // التحقق من عدد الأجهزة
      if (license.hasReachedDeviceLimit()) {
        return res.status(400).json({
          success: false,
          message: 'تم الوصول إلى الحد الأقصى لعدد الأجهزة المسموح بها',
          maxDevices: license.maxDevices,
          activeDevices: license.activations.filter(a => a.isActive).length
        });
      }
      
      // إضافة الجهاز الجديد
      license.addActivation(deviceFingerprint, deviceInfo);
    } else {
      // تحديث آخر تحقق للجهاز الحالي
      existingActivation.lastCheckDate = new Date();
      if (deviceInfo) existingActivation.deviceInfo = deviceInfo;
    }
    
    await license.save();
    
    // إنشاء بيانات للتحقق دون اتصال
    const offlineData = licenseGenerator.generateOfflineData(license, deviceFingerprint);
    
    res.status(200).json({
      success: true,
      message: 'الترخيص صالح',
      licenseInfo: {
        licenseKey: license.licenseKey,
        customerName: license.customerName,
        productName: license.productId ? license.productId.name : null,
        productVersion: license.productId ? license.productId.version : null,
        type: license.type,
        expiryDate: license.expiryDate,
        maxDevices: license.maxDevices,
        activeDevices: license.activations.filter(a => a.isActive).length
      },
      offlineData
    });
  } catch (error) {
    console.error('خطأ في التحقق من الترخيص:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء التحقق من الترخيص'
    });
  }
};

/**
 * التحقق من الترخيص دون اتصال (للعملاء)
 * @route POST /api/licenses/verify-offline
 * @access Public (مع مفتاح API)
 */
const verifyOfflineLicense = async (req, res) => {
  try {
    const { offlineData, deviceFingerprint } = req.body;
    
    if (!offlineData || !deviceFingerprint) {
      return res.status(400).json({
        success: false,
        message: 'البيانات المطلوبة غير مكتملة'
      });
    }
    
    // التحقق من البيانات المشفرة
    const verificationResult = licenseGenerator.verifyOfflineData(offlineData, deviceFingerprint);
    
    if (!verificationResult.success) {
      return res.status(400).json({
        success: false,
        message: verificationResult.message
      });
    }
    
    // البيانات صالحة
    res.status(200).json({
      success: true,
      message: 'الترخيص صالح (وضع عدم الاتصال)',
      licenseInfo: {
        licenseKey: verificationResult.data.licenseKey,
        type: verificationResult.data.type,
        expiryDate: verificationResult.data.expiryDate,
        validUntil: verificationResult.data.validUntil
      }
    });
  } catch (error) {
    console.error('خطأ في التحقق من الترخيص دون اتصال:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء التحقق من الترخيص دون اتصال'
    });
  }
};

/**
 * الحصول على إحصائيات التراخيص العامة
 * @route GET /api/licenses/stats
 * @access Private (Admin/Manager)
 */
const getLicenseStats = async (req, res) => {
  try {
    // الحصول على إحصائيات التراخيص
    const total = await License.countDocuments();
    const active = await License.countDocuments({ 
      status: 'active',
      isRevoked: false
    });
    const expired = await License.countDocuments({ 
      status: 'expired'
    });
    const revoked = await License.countDocuments({ 
      isRevoked: true
    });
    
    // الحصول على إحصائيات حسب نوع الترخيص
    const perpetual = await License.countDocuments({ 
      type: 'perpetual'
    });
    const subscription = await License.countDocuments({ 
      type: 'subscription'
    });
    const trial = await License.countDocuments({ 
      type: 'trial'
    });
    
    // الحصول على عدد التنشيطات النشطة
    const licenses = await License.find({ 
      status: 'active',
      isRevoked: false
    });
    
    let totalActivations = 0;
    licenses.forEach(license => {
      totalActivations += license.activations.filter(a => a.isActive).length;
    });
    
    res.status(200).json({
      total,
      active,
      expired,
      revoked,
      licenseTypes: {
        perpetual,
        subscription,
        trial
      },
      totalActivations
    });
  } catch (error) {
    console.error('خطأ في الحصول على إحصائيات التراخيص:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء استرجاع إحصائيات التراخيص' });
  }
};

module.exports = {
  createLicense,
  getLicenses,
  getLicense,
  updateLicense,
  revokeLicense,
  deactivateDevice,
  verifyLicense,
  verifyOfflineLicense,
  getLicenseStats
}; 
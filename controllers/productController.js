const Product = require('../models/Product');
const License = require('../models/License');

/**
 * إنشاء منتج جديد
 * @route POST /api/products
 * @access Private (Admin)
 */
const createProduct = async (req, res) => {
  try {
    const { name, description, version, productCode, allowTrial, trialDays } = req.body;
    
    // التحقق من البيانات المطلوبة
    if (!name || !description || !productCode) {
      return res.status(400).json({ message: 'الرجاء إدخال جميع البيانات المطلوبة' });
    }
    
    // التحقق من عدم وجود منتج بنفس الرمز
    const existingProduct = await Product.findOne({ productCode });
    
    if (existingProduct) {
      return res.status(400).json({ message: 'رمز المنتج مستخدم بالفعل' });
    }
    
    // إنشاء المنتج
    const product = new Product({
      name,
      description,
      version: version || '1.0.0',
      productCode,
      allowTrial: allowTrial !== undefined ? allowTrial : true,
      trialDays: trialDays || 14
    });
    
    await product.save();
    
    res.status(201).json({
      message: 'تم إنشاء المنتج بنجاح',
      product: {
        id: product._id,
        name: product.name,
        version: product.version,
        productCode: product.productCode
      }
    });
  } catch (error) {
    console.error('خطأ في إنشاء المنتج:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء إنشاء المنتج' });
  }
};

/**
 * الحصول على جميع المنتجات
 * @route GET /api/products
 * @access Private
 */
const getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ name: 1 });
    
    res.status(200).json({ products });
  } catch (error) {
    console.error('خطأ في الحصول على المنتجات:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء استرجاع المنتجات' });
  }
};

/**
 * الحصول على منتج محدد
 * @route GET /api/products/:id
 * @access Private
 */
const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'المنتج غير موجود' });
    }
    
    res.status(200).json({ product });
  } catch (error) {
    console.error('خطأ في الحصول على المنتج:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء استرجاع المنتج' });
  }
};

/**
 * تحديث منتج
 * @route PUT /api/products/:id
 * @access Private (Admin)
 */
const updateProduct = async (req, res) => {
  try {
    const { name, description, version, allowTrial, trialDays, isActive } = req.body;
    
    // البحث عن المنتج
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'المنتج غير موجود' });
    }
    
    // تحديث البيانات
    if (name) product.name = name;
    if (description) product.description = description;
    if (version) product.version = version;
    if (allowTrial !== undefined) product.allowTrial = allowTrial;
    if (trialDays) product.trialDays = trialDays;
    if (isActive !== undefined) product.isActive = isActive;
    
    product.updatedAt = Date.now();
    
    await product.save();
    
    res.status(200).json({
      message: 'تم تحديث المنتج بنجاح',
      product: {
        id: product._id,
        name: product.name,
        version: product.version
      }
    });
  } catch (error) {
    console.error('خطأ في تحديث المنتج:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء تحديث المنتج' });
  }
};

/**
 * حذف منتج
 * @route DELETE /api/products/:id
 * @access Private (Admin)
 */
const deleteProduct = async (req, res) => {
  try {
    // التحقق من وجود تراخيص مرتبطة بالمنتج
    const licensesCount = await License.countDocuments({ productId: req.params.id });
    
    if (licensesCount > 0) {
      return res.status(400).json({ 
        message: 'لا يمكن حذف المنتج لأنه مرتبط بتراخيص',
        licensesCount
      });
    }
    
    // حذف المنتج
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'المنتج غير موجود' });
    }
    
    res.status(200).json({
      message: 'تم حذف المنتج بنجاح'
    });
  } catch (error) {
    console.error('خطأ في حذف المنتج:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء حذف المنتج' });
  }
};

/**
 * الحصول على إحصائيات المنتج
 * @route GET /api/products/:id/stats
 * @access Private (Admin/Manager)
 */
const getProductStats = async (req, res) => {
  try {
    const productId = req.params.id;
    
    // التحقق من وجود المنتج
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({ message: 'المنتج غير موجود' });
    }
    
    // الحصول على إحصائيات التراخيص
    const totalLicenses = await License.countDocuments({ productId });
    const activeLicenses = await License.countDocuments({ 
      productId, 
      status: 'active',
      isRevoked: false
    });
    const expiredLicenses = await License.countDocuments({ 
      productId, 
      status: 'expired'
    });
    const revokedLicenses = await License.countDocuments({ 
      productId, 
      isRevoked: true
    });
    
    // الحصول على إحصائيات حسب نوع الترخيص
    const perpetualLicenses = await License.countDocuments({ 
      productId, 
      type: 'perpetual'
    });
    const subscriptionLicenses = await License.countDocuments({ 
      productId, 
      type: 'subscription'
    });
    const trialLicenses = await License.countDocuments({ 
      productId, 
      type: 'trial'
    });
    
    // الحصول على عدد التنشيطات النشطة
    const licenses = await License.find({ 
      productId, 
      status: 'active',
      isRevoked: false
    });
    
    let totalActivations = 0;
    licenses.forEach(license => {
      totalActivations += license.activations.filter(a => a.isActive).length;
    });
    
    res.status(200).json({
      productName: product.name,
      productCode: product.productCode,
      version: product.version,
      totalLicenses,
      licenseStatus: {
        active: activeLicenses,
        expired: expiredLicenses,
        revoked: revokedLicenses
      },
      licenseTypes: {
        perpetual: perpetualLicenses,
        subscription: subscriptionLicenses,
        trial: trialLicenses
      },
      totalActivations
    });
  } catch (error) {
    console.error('خطأ في الحصول على إحصائيات المنتج:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء استرجاع إحصائيات المنتج' });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  getProductStats
}; 
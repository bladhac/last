const License = require('../models/License');
const Product = require('../models/Product');
const Customer = require('../models/Customer');

/**
 * الحصول على الإحصائيات العامة
 * @route GET /api/statistics
 * @access Private (Admin/Manager)
 */
const getStatistics = async (req, res) => {
  try {
    const { productId } = req.query;
    const query = {};
    
    if (productId) {
      query.productId = productId;
    }
    
    // إحصائيات التراخيص
    const totalLicenses = await License.countDocuments(query);
    const activeLicenses = await License.countDocuments({ 
      ...query,
      status: 'active',
      isRevoked: false
    });
    const expiredLicenses = await License.countDocuments({ 
      ...query,
      status: 'expired'
    });
    const trialLicenses = await License.countDocuments({ 
      ...query,
      type: 'trial'
    });
    
    // إحصائيات العملاء
    const customersCount = await Customer.countDocuments();
    
    // حساب إجمالي المبيعات (من أسعار المنتجات)
    let totalSales = 0;
    const licenses = await License.find(query).populate('productId');
    licenses.forEach(license => {
      if (license.productId && license.productId.price) {
        totalSales += license.productId.price;
      }
    });
    
    // معدل التجديد - نسبة التراخيص التي تم تجديدها
    const renewedLicenses = await License.countDocuments({
      ...query,
      isRenewal: true
    });
    const renewalRate = totalLicenses > 0 ? Math.round((renewedLicenses / totalLicenses) * 100) : 0;
    
    // معدل تفعيل الإصدارات التجريبية - نسبة الإصدارات التجريبية التي تحولت إلى مدفوعة
    const convertedTrials = await License.countDocuments({
      ...query,
      convertedFromTrial: true
    });
    const trialActivationRate = trialLicenses > 0 ? Math.round((convertedTrials / trialLicenses) * 100) : 0;
    
    // متوسط مدة الترخيص بالشهور
    let totalMonths = 0;
    let licenseCount = 0;
    
    licenses.forEach(license => {
      if (license.createdAt && license.expiryDate) {
        const start = new Date(license.createdAt);
        const end = new Date(license.expiryDate);
        const diffTime = Math.abs(end - start);
        const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
        totalMonths += diffMonths;
        licenseCount++;
      }
    });
    
    const avgLicenseDuration = licenseCount > 0 ? Math.round(totalMonths / licenseCount) : 0;
    
    // معدل نمو العملاء - نسبة الزيادة في عدد العملاء خلال الشهر الأخير
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const newCustomers = await Customer.countDocuments({
      createdAt: { $gte: oneMonthAgo }
    });
    
    const customerGrowthRate = customersCount > 0 ? Math.round((newCustomers / customersCount) * 100) : 0;
    
    // قيمة العميل طول العمر - متوسط المبلغ الذي ينفقه العميل
    const customerLifetimeValue = customersCount > 0 ? Math.round(totalSales / customersCount) : 0;
    
    // أفضل 5 منتجات
    const topProducts = await License.aggregate([
      { $match: query },
      { $group: {
        _id: '$productId',
        count: { $sum: 1 }
      }},
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    // تحميل بيانات المنتجات
    const topProductsData = [];
    for (const item of topProducts) {
      if (item._id) {
        const product = await Product.findById(item._id);
        if (product) {
          topProductsData.push({
            id: product._id,
            name: product.name,
            licensesCount: item.count,
            totalSales: product.price * item.count,
            lastActivity: product.updatedAt
          });
        }
      }
    }
    
    // أفضل 5 عملاء
    const topCustomers = await License.aggregate([
      { $match: query },
      { $group: {
        _id: '$customerId',
        count: { $sum: 1 }
      }},
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    // تحميل بيانات العملاء
    const topCustomersData = [];
    for (const item of topCustomers) {
      if (item._id) {
        const customer = await Customer.findById(item._id);
        if (customer) {
          const customerLicenses = await License.find({ customerId: item._id }).populate('productId');
          let customerSales = 0;
          customerLicenses.forEach(license => {
            if (license.productId && license.productId.price) {
              customerSales += license.productId.price;
            }
          });
          
          topCustomersData.push({
            id: customer._id,
            name: customer.name,
            licensesCount: item.count,
            totalSales: customerSales,
            lastActivity: customer.updatedAt
          });
        }
      }
    }
    
    // إرجاع البيانات
    res.status(200).json({
      totalLicenses,
      activeLicenses,
      expiredLicenses,
      trialLicenses,
      customersCount,
      totalSales,
      renewalRate,
      trialActivationRate,
      avgLicenseDuration,
      customerGrowthRate,
      customerLifetimeValue,
      topProducts: topProductsData,
      topCustomers: topCustomersData
    });
  } catch (error) {
    console.error('خطأ في الحصول على الإحصائيات:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء استرجاع الإحصائيات' });
  }
};

module.exports = {
  getStatistics
}; 
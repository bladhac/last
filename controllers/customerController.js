const Customer = require('../models/Customer');
const License = require('../models/License');

/**
 * إنشاء عميل جديد
 * @route POST /api/customers
 * @access Private
 */
const createCustomer = async (req, res) => {
  try {
    const { name, company, email, phone, address, notes } = req.body;
    
    // التحقق من البيانات المطلوبة
    if (!name || !email) {
      return res.status(400).json({ message: 'الاسم والبريد الإلكتروني مطلوبان' });
    }
    
    // التحقق من عدم وجود عميل بنفس البريد الإلكتروني
    const existingCustomer = await Customer.findOne({ email });
    
    if (existingCustomer) {
      return res.status(400).json({ message: 'البريد الإلكتروني مستخدم بالفعل' });
    }
    
    // إنشاء العميل
    const customer = new Customer({
      name,
      company,
      email,
      phone,
      address,
      notes
    });
    
    await customer.save();
    
    res.status(201).json({
      message: 'تم إنشاء العميل بنجاح',
      customer: {
        id: customer._id,
        name: customer.name,
        email: customer.email
      }
    });
  } catch (error) {
    console.error('خطأ في إنشاء العميل:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء إنشاء العميل' });
  }
};

/**
 * الحصول على جميع العملاء
 * @route GET /api/customers
 * @access Private
 */
const getCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    
    // إنشاء شروط البحث
    const query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }
    
    // تنفيذ الاستعلام مع التقسيم إلى صفحات
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { name: 1 }
    };
    
    const customers = await Customer.find(query)
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .sort(options.sort);
    
    // الحصول على إجمالي عدد العملاء
    const total = await Customer.countDocuments(query);
    
    res.status(200).json({
      customers,
      totalPages: Math.ceil(total / options.limit),
      currentPage: options.page,
      total
    });
  } catch (error) {
    console.error('خطأ في الحصول على العملاء:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء استرجاع العملاء' });
  }
};

/**
 * الحصول على عميل محدد
 * @route GET /api/customers/:id
 * @access Private
 */
const getCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ message: 'العميل غير موجود' });
    }
    
    res.status(200).json({ customer });
  } catch (error) {
    console.error('خطأ في الحصول على العميل:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء استرجاع العميل' });
  }
};

/**
 * تحديث عميل
 * @route PUT /api/customers/:id
 * @access Private
 */
const updateCustomer = async (req, res) => {
  try {
    const { name, company, phone, address, status, notes } = req.body;
    
    // البحث عن العميل
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ message: 'العميل غير موجود' });
    }
    
    // تحديث البيانات
    if (name) customer.name = name;
    if (company !== undefined) customer.company = company;
    if (phone !== undefined) customer.phone = phone;
    if (address) customer.address = address;
    if (status) customer.status = status;
    if (notes !== undefined) customer.notes = notes;
    
    await customer.save();
    
    res.status(200).json({
      message: 'تم تحديث بيانات العميل بنجاح',
      customer: {
        id: customer._id,
        name: customer.name,
        email: customer.email
      }
    });
  } catch (error) {
    console.error('خطأ في تحديث العميل:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء تحديث بيانات العميل' });
  }
};

/**
 * حذف عميل
 * @route DELETE /api/customers/:id
 * @access Private (Admin)
 */
const deleteCustomer = async (req, res) => {
  try {
    // التحقق من وجود تراخيص مرتبطة بالعميل
    const licensesCount = await License.countDocuments({ customerId: req.params.id });
    
    if (licensesCount > 0) {
      return res.status(400).json({ 
        message: 'لا يمكن حذف العميل لأنه مرتبط بتراخيص',
        licensesCount
      });
    }
    
    // حذف العميل
    const customer = await Customer.findByIdAndDelete(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ message: 'العميل غير موجود' });
    }
    
    res.status(200).json({
      message: 'تم حذف العميل بنجاح'
    });
  } catch (error) {
    console.error('خطأ في حذف العميل:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء حذف العميل' });
  }
};

/**
 * الحصول على تراخيص العميل
 * @route GET /api/customers/:id/licenses
 * @access Private
 */
const getCustomerLicenses = async (req, res) => {
  try {
    const customerId = req.params.id;
    
    // التحقق من وجود العميل
    const customer = await Customer.findById(customerId);
    
    if (!customer) {
      return res.status(404).json({ message: 'العميل غير موجود' });
    }
    
    // الحصول على التراخيص
    const licenses = await License.find({ customerId })
      .populate('productId', 'name version productCode')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      customer: {
        id: customer._id,
        name: customer.name,
        email: customer.email
      },
      licenses: licenses.map(license => ({
        id: license._id,
        licenseKey: license.licenseKey,
        productName: license.productId ? license.productId.name : null,
        productVersion: license.productId ? license.productId.version : null,
        type: license.type,
        status: license.status,
        expiryDate: license.expiryDate,
        createdAt: license.createdAt,
        activations: license.activations.length,
        maxDevices: license.maxDevices
      }))
    });
  } catch (error) {
    console.error('خطأ في الحصول على تراخيص العميل:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء استرجاع تراخيص العميل' });
  }
};

module.exports = {
  createCustomer,
  getCustomers,
  getCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerLicenses
}; 
// المتغيرات العامة
let authToken = localStorage.getItem('authToken');
let currentUser = null;
let products = [];
let licenses = [];
let currentPage = 1;
let totalPages = 1;
let itemsPerPage = 10;
let customersPage = 1;
let customersTotalPages = 1;
let productsPage = 1;
let productsTotalPages = 1;
let statisticsCharts = {};
let currentSection = 'dashboard-section';

// كلمة مرور الوصول إلى النظام
const ACCESS_PASSWORD = "Mo0598138822++";
let accessGranted = localStorage.getItem('accessGranted') === 'true';

// متغيرات صفحة العملاء
let customersLimit = 10;
let customers = [];
let customersTotalCount = 0;
let customerSearchQuery = '';

// عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function () {
  console.log('تم تحميل الصفحة');
  
  // إخفاء القائمة الجانبية في البداية
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) {
    sidebar.classList.add('d-none');
  }
  
  // التحقق من حالة الوصول أولاً
  checkAccessStatus();
});

// التحقق من حالة الوصول
function checkAccessStatus() {
  console.log('التحقق من حالة الوصول');
  
  if (accessGranted) {
    // إذا تم منح الوصول، انتقل إلى شاشة تسجيل الدخول
    document.getElementById('pre-auth-section').classList.add('d-none');
  checkAuthStatus();
  } else {
    // إذا لم يتم منح الوصول، عرض شاشة التحقق من الوصول
    document.getElementById('pre-auth-section').classList.remove('d-none');
    document.getElementById('login-section').classList.add('d-none');
    document.querySelectorAll('.content-section').forEach(section => {
      section.classList.add('d-none');
    });
    
    // إضافة حدث التحقق من كلمة المرور
    document.getElementById('pre-auth-form').addEventListener('submit', function(e) {
      e.preventDefault();
      const accessPassword = document.getElementById('access-password').value;
      
      if (accessPassword === ACCESS_PASSWORD) {
        // كلمة المرور صحيحة
        accessGranted = true;
        localStorage.setItem('accessGranted', 'true');
        
        // إخفاء شاشة التحقق وعرض شاشة تسجيل الدخول
        document.getElementById('pre-auth-section').classList.add('d-none');
        checkAuthStatus();
      } else {
        // كلمة المرور خاطئة
        showAlert('كلمة المرور غير صحيحة', 'danger');
      }
    });
  }
}

// التحقق من حالة تسجيل الدخول
function checkAuthStatus() {
  console.log('التحقق من حالة تسجيل الدخول');
  if (authToken) {
    // جلب بيانات المستخدم
    fetchUserProfile()
      .then(() => {
        // إخفاء نموذج تسجيل الدخول وإظهار المحتوى
        document.getElementById('login-section').classList.add('d-none');
        document.querySelectorAll('.content-section').forEach(section => {
          if (section.id === 'dashboard-section') {
            section.classList.remove('d-none');
          } else {
            section.classList.add('d-none');
          }
        });
        
        // إظهار القائمة الجانبية
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
          sidebar.classList.remove('d-none');
        }

        // إعداد أحداث القائمة
        setupNavigationEvents();
        // إعداد أحداث النماذج
        setupFormEvents();
        // إعداد أزرار التراخيص
        setupLicenseButtons();
        
        // تحميل بيانات لوحة التحكم
        loadDashboardData();
      })
      .catch(() => {
        // في حالة فشل التحقق، عرض نموذج تسجيل الدخول
        showLoginForm();
      });
  } else {
    // عرض نموذج تسجيل الدخول
    showLoginForm();
  }
}

// عرض نموذج تسجيل الدخول
function showLoginForm() {
  // حذف التوكن من التخزين المحلي
  localStorage.removeItem('authToken');
  authToken = null;
  currentUser = null;

  document.getElementById('login-section').classList.remove('d-none');
  document.querySelectorAll('.content-section').forEach(section => {
    section.classList.add('d-none');
  });
  
  // إخفاء القائمة الجانبية
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) {
    sidebar.classList.add('d-none');
  }

  // إضافة حدث تسجيل الدخول
  document.getElementById('login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    login(username, password);
  });
}

// تسجيل الدخول
function login(username, password) {
  console.log('محاولة تسجيل الدخول للمستخدم:', username);
  
  // التحقق من وجود قيم في حقل المستخدم وكلمة المرور
  if (!username || !username.trim()) {
    alert('الرجاء إدخال اسم المستخدم');
    return;
  }
  
  if (!password || !password.trim()) {
    alert('الرجاء إدخال كلمة المرور');
    return;
  }
  
  // إظهار مؤشر التحميل في زر تسجيل الدخول
  const loginButton = document.querySelector('#login-form button[type="submit"]');
  const originalButtonText = loginButton.innerHTML;
  loginButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> جاري تسجيل الدخول...';
  loginButton.disabled = true;
  
  // بيانات تسجيل الدخول
  const loginData = {
    username: username.trim(),
    password: password.trim()
  };
  
  console.log('بيانات تسجيل الدخول المرسلة:', { username: loginData.username, passwordLength: loginData.password.length });
  
  // إرسال طلب تسجيل الدخول إلى API الفعلي
  fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(loginData)
  })
  .then(response => {
    console.log('استجابة السيرفر:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });
    
    if (!response.ok) {
      return response.json().then(errorData => {
        console.error('تفاصيل الخطأ من السيرفر:', errorData);
        throw new Error(`فشل تسجيل الدخول: ${response.statusText} - ${errorData.message || 'خطأ غير معروف'}`);
      }).catch(jsonError => {
        // في حالة عدم القدرة على قراءة رد خطأ JSON
        console.error('تعذر قراءة تفاصيل الخطأ:', jsonError);
        throw new Error(`فشل تسجيل الدخول: ${response.statusText}`);
      });
    }
    return response.json();
  })
  .then(data => {
    // نجاح تسجيل الدخول - تخزين الرمز في التخزين المحلي
    console.log('تم تسجيل الدخول بنجاح، البيانات المستلمة:', data);
    
    // تأكد من أن البيانات تحتوي على رمز التوثيق
    if (!data.token) {
      throw new Error('لم يتم إرجاع رمز التوثيق من الخادم');
    }
    
    localStorage.setItem('authToken', data.token);
    authToken = data.token;
    
    // تعيين بيانات المستخدم
    currentUser = data.user || {
      id: 1,
      username: username,
      role: 'admin',
      name: 'مدير النظام'
    };
    
    // إخفاء نموذج تسجيل الدخول وإظهار لوحة التحكم
    document.getElementById('login-section').classList.add('d-none');
    document.getElementById('dashboard-section').classList.remove('d-none');
    
    // إظهار القائمة الجانبية
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.classList.remove('d-none');
    }
    
    // إعداد الأحداث بعد تسجيل الدخول
    setupNavigationEvents();
    setupFormEvents();
    setupLicenseButtons();
    
    // تحميل بيانات لوحة التحكم
    loadDashboardData();
  })
  .catch(error => {
    console.error('خطأ في تسجيل الدخول:', error);
    
    // عرض رسالة خطأ للمستخدم
    alert(error.message || 'فشل تسجيل الدخول: اسم المستخدم أو كلمة المرور غير صحيحة');
  })
  .finally(() => {
    // إعادة زر تسجيل الدخول إلى حالته الأصلية
    loginButton.innerHTML = originalButtonText;
    loginButton.disabled = false;
  });
}

// جلب ملف تعريف المستخدم
function fetchUserProfile() {
  return new Promise((resolve, reject) => {
    // محاكاة طلب جلب بيانات المستخدم - قم بتغييره لاستخدام API الفعلي
    if (authToken) {
      currentUser = {
        id: 1,
        username: 'admin',
        role: 'admin',
        name: 'مدير النظام'
      };
      resolve(currentUser);
    } else {
      reject(new Error('غير مصرح'));
    }
  });
}

// تسجيل الخروج
function logout() {
  localStorage.removeItem('authToken');
  authToken = null;
  
  // إعادة ضبط حالة الوصول عند تسجيل الخروج الكامل
  if (confirm('هل تريد أيضًا إعادة ضبط كلمة مرور الوصول؟')) {
    localStorage.removeItem('accessGranted');
    accessGranted = false;
    checkAccessStatus();
  } else {
  showLoginForm();
  }
}

// إعداد أحداث التنقل
function setupNavigationEvents() {
  // أحداث القائمة الجانبية
  document.getElementById('dashboard-link').addEventListener('click', function (e) {
    e.preventDefault();
    showSection('dashboard-section');
    setActiveLink(this);
    loadDashboardData();
  });

  document.getElementById('licenses-link').addEventListener('click', function (e) {
    e.preventDefault();
    showSection('licenses-section');
    setActiveLink(this);
    loadLicensesData();
  });

  document.getElementById('customers-link').addEventListener('click', function (e) {
    e.preventDefault();
    showSection('customers-section');
    setActiveLink(this);
    loadCustomersData();
  });

  document.getElementById('products-link').addEventListener('click', function (e) {
    e.preventDefault();
    showSection('products-section');
    setActiveLink(this);
    loadProductsData();
  });

  document.getElementById('statistics-link').addEventListener('click', function (e) {
    e.preventDefault();
    showSection('statistics-section');
    setActiveLink(this);
    loadStatisticsData();
  });

  document.getElementById('settings-link').addEventListener('click', function (e) {
    e.preventDefault();
    showSection('settings-section');
    setActiveLink(this);
    loadSettingsData();
  });

  // زر تسجيل الخروج
  document.getElementById('logout-btn').addEventListener('click', function () {
    logout();
  });
}

// إعداد أحداث النماذج
function setupFormEvents() {
  // ربط أحداث الروابط الرئيسية
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function() {
      const targetId = this.getAttribute('id');
      
      if (targetId === 'dashboard-link') {
        showSection('dashboard-section');
        loadDashboardData();
      } else if (targetId === 'licenses-link') {
        showSection('licenses-section');
        loadLicensesData();
      } else if (targetId === 'customers-link') {
        showSection('customers-section');
        loadCustomersData();
      } else if (targetId === 'products-link') {
        showSection('products-section');
        loadProductsData();
      } else if (targetId === 'statistics-link') {
        showSection('statistics-section');
        loadStatisticsData();
      } else if (targetId === 'settings-link') {
        showSection('settings-section');
        loadSettingsData();
      }
      
      setActiveLink(this);
    });
  });
  
  // إضافة استماع لزر حفظ إعدادات المسؤول
  const saveAdminSettingsBtn = document.getElementById('save-admin-settings');
  if (saveAdminSettingsBtn) {
    saveAdminSettingsBtn.addEventListener('click', function() {
      console.log('تم النقر على زر حفظ إعدادات المسؤول');
      saveAdminSettings();
    });
  }
  
  // إضافة استماع لزر حفظ إعدادات الخادم
  const saveServerSettingsBtn = document.getElementById('save-server-settings');
  if (saveServerSettingsBtn) {
    saveServerSettingsBtn.addEventListener('click', function() {
      console.log('تم النقر على زر حفظ إعدادات الخادم');
      saveServerSettings();
    });
  }
}

// عرض قسم محدد
function showSection(sectionId) {
  document.querySelectorAll('.content-section').forEach(section => {
    if (section.id === sectionId) {
      section.classList.remove('d-none');
    } else {
      section.classList.add('d-none');
    }
  });
}

// تحديد الرابط النشط
function setActiveLink(link) {
  document.querySelectorAll('.nav-link').forEach(navLink => {
    navLink.classList.remove('active');
  });
  link.classList.add('active');
}

// تحميل بيانات لوحة التحكم
function loadDashboardData() {
  console.log('تحميل بيانات لوحة التحكم...');
  
  // عرض مؤشرات التحميل في الإحصائيات
  document.getElementById('total-licenses').innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
  document.getElementById('active-licenses').innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
  document.getElementById('expired-licenses').innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
  document.getElementById('revoked-licenses').innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
  
  // عرض مؤشر التحميل في التراخيص الحديثة
  document.getElementById('recent-licenses').innerHTML = '<tr><td colspan="6" class="text-center">جاري تحميل البيانات...</td></tr>';
  
  // عرض مؤشر التحميل في الأنشطة الحديثة
  document.getElementById('recent-activities').innerHTML = '<li class="list-group-item text-center">جاري تحميل البيانات...</li>';
  
  // جلب الإحصائيات العامة
  fetch('/api/licenses/stats', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    }
  })
  .then(response => {
    if (!response.ok) {
      if (response.status === 401) {
        document.getElementById('dashboard-section').classList.add('d-none');
        document.getElementById('login-section').classList.remove('d-none');
        localStorage.removeItem('authToken');
        authToken = null;
        throw new Error('غير مصرح: الرجاء إعادة تسجيل الدخول');
      }
      throw new Error('فشل جلب الإحصائيات: ' + response.statusText);
    }
    return response.json();
  })
  .then(stats => {
    // تحديث بطاقات الإحصائيات
    document.getElementById('total-licenses').textContent = stats.total || 0;
    document.getElementById('active-licenses').textContent = stats.active || 0;
    document.getElementById('expired-licenses').textContent = stats.expired || 0;
    document.getElementById('revoked-licenses').textContent = stats.revoked || 0;
  })
  .catch(error => {
    console.error('خطأ في جلب إحصائيات التراخيص:', error);
    document.getElementById('total-licenses').textContent = '-';
    document.getElementById('active-licenses').textContent = '-';
    document.getElementById('expired-licenses').textContent = '-';
    document.getElementById('revoked-licenses').textContent = '-';
  });
  
  // جلب التراخيص الحديثة
  fetch('/api/licenses?limit=5&sortBy=createdAt&sortOrder=desc', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    }
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('فشل جلب التراخيص الحديثة: ' + response.statusText);
    }
    return response.json();
  })
  .then(data => {
    // عرض التراخيص الحديثة
    renderRecentLicenses(data.licenses || []);
  })
  .catch(error => {
    console.error('خطأ في جلب التراخيص الحديثة:', error);
    document.getElementById('recent-licenses').innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-danger">
          <i class="bi bi-exclamation-triangle me-2"></i>
          حدث خطأ أثناء تحميل البيانات: ${error.message}
        </td>
      </tr>
    `;
  });
  
  // جلب الأنشطة الحديثة
  fetch('/api/activities?limit=10', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    }
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('فشل جلب الأنشطة الحديثة: ' + response.statusText);
    }
    return response.json();
  })
  .then(data => {
    // عرض الأنشطة الحديثة
    renderRecentActivities(data.activities || []);
  })
  .catch(error => {
    console.error('خطأ في جلب الأنشطة الحديثة:', error);
    document.getElementById('recent-activities').innerHTML = `
      <li class="list-group-item text-center text-danger">
        <i class="bi bi-exclamation-triangle me-2"></i>
        حدث خطأ أثناء تحميل البيانات: ${error.message}
      </li>
    `;
  });
}

// تحميل بيانات التراخيص
function loadLicensesData() {
  // عرض رسالة تحميل البيانات
  const licensesTable = document.getElementById('licenses-table');
  if (!licensesTable) {
    console.error('لم يتم العثور على جدول التراخيص');
    return;
  }
  
  licensesTable.innerHTML = '<tr><td colspan="7" class="text-center">جاري تحميل البيانات...</td></tr>';
  
  // الحصول على معايير البحث والتصفية
  const searchQuery = document.getElementById('license-search') ? document.getElementById('license-search').value : '';
  const statusFilter = document.getElementById('license-status-filter') ? document.getElementById('license-status-filter').value : '';
  const productFilter = document.getElementById('license-product-filter') ? document.getElementById('license-product-filter').value : '';
  
  // بناء معايير البحث
  let queryParams = new URLSearchParams();
  if (searchQuery) queryParams.append('search', searchQuery);
  if (statusFilter) queryParams.append('status', statusFilter);
  if (productFilter) queryParams.append('product', productFilter);
  queryParams.append('page', currentPage);
  queryParams.append('limit', itemsPerPage);
  
  // إضافة مؤشر التحميل
  const tableContainer = document.querySelector('#licenses-table-container');
  if (tableContainer) {
    tableContainer.classList.add('loading-state');
  } else {
    console.warn('لم يتم العثور على حاوية جدول التراخيص');
  }
  
  console.log('جلب بيانات التراخيص، المعلمات:', queryParams.toString());
  
  // استخدام API لجلب البيانات الفعلية
  fetch(`/api/licenses?${queryParams.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    }
  })
  .then(response => {
    if (!response.ok) {
      // التحقق من نوع الخطأ
      if (response.status === 401) {
        // إعادة التوجيه إلى صفحة تسجيل الدخول
        const licensesSection = document.getElementById('licenses-section');
        const loginSection = document.getElementById('login-section');
        
        if (licensesSection) {
          licensesSection.classList.add('d-none');
        }
        
        if (loginSection) {
          loginSection.classList.remove('d-none');
        }
        
        localStorage.removeItem('authToken');
        authToken = null;
        throw new Error('غير مصرح: الرجاء إعادة تسجيل الدخول');
      }
      throw new Error('فشل جلب بيانات التراخيص: ' + response.statusText);
    }
    return response.json();
  })
  .then(data => {
    console.log('تم استلام بيانات التراخيص:', data);
    
    // تحديث معلومات الترقيم
    const total = data.total || data.count || (data.licenses ? data.licenses.length : 0);
    totalPages = Math.ceil(total / itemsPerPage);
    
    // تحديث عداد الصفحات والأزرار
    const licensesCount = document.getElementById('licenses-count');
    const licensesPage = document.getElementById('licenses-page');
    const prevLicensesPage = document.getElementById('prev-licenses-page');
    const nextLicensesPage = document.getElementById('next-licenses-page');
    
    if (licensesCount) licensesCount.textContent = total;
    if (licensesPage) licensesPage.textContent = currentPage;
    if (prevLicensesPage) prevLicensesPage.disabled = currentPage <= 1;
    if (nextLicensesPage) nextLicensesPage.disabled = currentPage >= totalPages;
    
    // تحديد مصفوفة التراخيص من البيانات المستلمة
    let licenses = [];
    
    if (Array.isArray(data)) {
      // إذا كانت البيانات المستلمة هي مصفوفة مباشرة
      licenses = data;
    } else if (data.licenses && Array.isArray(data.licenses)) {
      // إذا كانت البيانات في حقل "licenses"
      licenses = data.licenses;
    } else if (data.data && Array.isArray(data.data)) {
      // إذا كانت البيانات في حقل "data"
      licenses = data.data;
    } else if (data.results && Array.isArray(data.results)) {
      // إذا كانت البيانات في حقل "results"
      licenses = data.results;
    } else {
      console.warn('تنسيق بيانات API غير متوقع:', data);
      licenses = []; // مصفوفة فارغة في حالة عدم القدرة على تحديد البيانات
    }
    
    console.log(`تم استخراج ${licenses.length} ترخيص من استجابة API`);
    
    // عرض التراخيص في الجدول
    renderLicensesTable(licenses);
    
    // إزالة مؤشر التحميل
    if (tableContainer) {
      tableContainer.classList.remove('loading-state');
    }
  })
  .catch(error => {
    console.error('خطأ في تحميل بيانات التراخيص:', error);
    
    // عرض رسالة الخطأ في الجدول
    if (licensesTable) {
      licensesTable.innerHTML = `
        <tr>
          <td colspan="7" class="text-center text-danger">
            <i class="bi bi-exclamation-triangle me-2"></i>
            حدث خطأ أثناء تحميل البيانات: ${error.message}
          </td>
        </tr>
      `;
    }
    
    // إزالة مؤشر التحميل
    if (tableContainer) {
      tableContainer.classList.remove('loading-state');
    }
  });
}

// عرض أحدث التراخيص
function renderRecentLicenses(licenses) {
  const tbody = document.getElementById('recent-licenses');
  if (!tbody) {
    console.error('لم يتم العثور على جدول أحدث التراخيص');
    return;
  }
  
  tbody.innerHTML = '';
  
  if (!licenses || licenses.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td colspan="6" class="text-center">لا توجد تراخيص</td>';
    tbody.appendChild(tr);
    return;
  }
  
  console.log('عرض أحدث التراخيص:', licenses);
  
  licenses.forEach(license => {
    // التعامل مع القيم المحتملة undefined
    const licenseKey = license.key || 'غير معروف';
    const productName = license.product || license.productName || 'غير معروف';
    const customerName = license.customer || license.customerName || 'غير معروف';
    const expiryDate = license.expiryDate ? new Date(license.expiryDate).toLocaleDateString('ar-AE') : 'غير محدد';
    const status = license.status || 'unknown';
    const licenseId = license.id || license._id || ''; // التعامل مع الاختلافات المحتملة في اسم معرف الترخيص
    
    const tr = document.createElement('tr');
    
    tr.innerHTML = `
      <td>${licenseKey}</td>
      <td>${productName}</td>
      <td>${customerName}</td>
      <td>${expiryDate}</td>
      <td>
        <span class="license-status license-status-${status}">
          ${getLicenseStatusText(status)}
        </span>
      </td>
      <td>
        <button class="btn btn-sm btn-outline-primary action-btn" onclick="viewLicense('${licenseId}')">
          <i class="bi bi-eye"></i>
        </button>
        <button class="btn btn-sm btn-outline-secondary action-btn" onclick="showLicenseModal('${licenseId}')">
          <i class="bi bi-pencil"></i>
        </button>
      </td>
    `;
    
    tbody.appendChild(tr);
  });
}

// عرض جدول التراخيص
function renderLicensesTable(licenses) {
  const tbody = document.getElementById('licenses-table');
  if (!tbody) {
    console.error('لم يتم العثور على جدول التراخيص');
    return;
  }
  
  tbody.innerHTML = '';
  
  if (!licenses || licenses.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td colspan="8" class="text-center">لا توجد تراخيص</td>';
    tbody.appendChild(tr);
    return;
  }
  
  licenses.forEach(license => {
    console.log('بيانات الترخيص للعرض:', license); // سجّل البيانات للتشخيص
    
    // التعامل مع القيم المحتملة undefined
    const licenseKey = license.key || 'غير معروف';
    const productName = license.product || license.productName || 'غير معروف';
    const customerName = license.customer || license.customerName || 'غير معروف';
    const issueDate = license.issueDate ? new Date(license.issueDate).toLocaleDateString('ar-AE') : 'غير محدد';
    const expiryDate = license.expiryDate ? new Date(license.expiryDate).toLocaleDateString('ar-AE') : 'غير محدد';
    const activations = typeof license.activations === 'number' ? license.activations : 0;
    const maxActivations = typeof license.maxActivations === 'number' ? license.maxActivations : 'غير محدد';
    const status = license.status || 'unknown';
    const licenseId = license.id || license._id || ''; // التعامل مع الاختلافات المحتملة في اسم معرف الترخيص
    
    const tr = document.createElement('tr');
    
    tr.innerHTML = `
      <td>${licenseKey}</td>
      <td>${productName}</td>
      <td>${customerName}</td>
      <td>${issueDate}</td>
      <td>${expiryDate}</td>
      <td>${activations} / ${maxActivations}</td>
      <td>
        <span class="license-status license-status-${status}">
          ${getLicenseStatusText(status)}
        </span>
      </td>
      <td>
        <button class="btn btn-sm btn-outline-primary action-btn" onclick="viewLicense('${licenseId}')">
          <i class="bi bi-eye"></i>
        </button>
        <button class="btn btn-sm btn-outline-secondary action-btn" onclick="showLicenseModal('${licenseId}')">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger action-btn" onclick="revokeLicense('${licenseId}')">
          <i class="bi bi-x-circle"></i>
        </button>
      </td>
    `;
    
    tbody.appendChild(tr);
  });
}

// عرض آخر الأنشطة
function renderRecentActivities(activities) {
  const ul = document.getElementById('recent-activities');
  ul.innerHTML = '';
  
  if (activities.length === 0) {
    const li = document.createElement('li');
    li.className = 'list-group-item text-center';
    li.textContent = 'لا توجد أنشطة';
    ul.appendChild(li);
    return;
  }
  
  activities.forEach(activity => {
    const li = document.createElement('li');
    li.className = 'list-group-item activity-item';
    
    li.innerHTML = `
      <div class="d-flex justify-content-between align-items-center">
        <p class="activity-content">${activity.message}</p>
        <span class="activity-time">${activity.time}</span>
      </div>
    `;
    
    ul.appendChild(li);
  });
}

// تعبئة فلتر المنتجات
function populateProductFilter(products) {
  const select = document.getElementById('license-product-filter');
  
  // الخيار الافتراضي
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'كل المنتجات';
  select.appendChild(defaultOption);
  
  // إضافة المنتجات
  products.forEach(product => {
    const option = document.createElement('option');
    option.value = product;
    option.textContent = product;
    select.appendChild(option);
  });
}

// الحصول على نص حالة الترخيص
function getLicenseStatusText(status) {
  switch (status) {
    case 'active':
      return 'نشط';
    case 'expired':
      return 'منتهي';
    case 'revoked':
      return 'ملغي';
    default:
      return status;
  }
}

// عرض معلومات الترخيص
function viewLicense(licenseId) {
  try {
    if (!licenseId) {
      console.error('معرف الترخيص غير صالح');
      showAlert('خطأ: معرف الترخيص غير صالح', 'danger');
      return;
    }
    
    // التحقق من وجود رمز توثيق
    if (!authToken) {
      console.error('لم يتم تسجيل الدخول');
      showAlert('يجب تسجيل الدخول أولاً لعرض تفاصيل الترخيص', 'danger');
      return;
    }
    
    console.log('عرض تفاصيل الترخيص:', licenseId);
    
    // إنشاء عنصر النافذة المنبثقة إذا لم يكن موجودًا
    let viewModal = document.getElementById('license-details-modal');
    
    if (!viewModal) {
      console.log('إنشاء عنصر النافذة المنبثقة لعرض تفاصيل الترخيص');
      
      // إنشاء العنصر
      const modalHTML = `
        <div class="modal fade" id="license-details-modal" tabindex="-1" aria-labelledby="licenseDetailsModalLabel" aria-hidden="true">
          <div class="modal-dialog modal-lg">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title" id="licenseDetailsModalLabel">تفاصيل الترخيص</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="إغلاق"></button>
              </div>
              <div class="modal-body">
                <!-- هنا سيتم عرض بيانات الترخيص -->
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إغلاق</button>
                <button type="button" class="btn btn-primary" onclick="showLicenseModal('${licenseId}')">تعديل</button>
                <button type="button" class="btn btn-danger" onclick="revokeLicense('${licenseId}')">إلغاء الترخيص</button>
              </div>
            </div>
          </div>
        </div>
      `;
      
      // إضافة النافذة المنبثقة إلى نهاية body
      document.body.insertAdjacentHTML('beforeend', modalHTML);
      
      // الحصول على المرجع بعد الإنشاء
      viewModal = document.getElementById('license-details-modal');
    } else {
      // تحديث أزرار التعديل والإلغاء بمعرف الترخيص الحالي
      const editButton = viewModal.querySelector('.modal-footer .btn-primary');
      const revokeButton = viewModal.querySelector('.modal-footer .btn-danger');
      
      if (editButton) editButton.setAttribute('onclick', `showLicenseModal('${licenseId}')`);
      if (revokeButton) revokeButton.setAttribute('onclick', `revokeLicense('${licenseId}')`);
    }
    
    const viewModalBody = viewModal.querySelector('.modal-body');
    const viewModalTitle = viewModal.querySelector('.modal-title');
    
    if (!viewModalBody || !viewModalTitle) {
      console.error('عناصر النافذة غير مكتملة');
      showAlert('تعذر عرض التفاصيل: واجهة العرض غير مكتملة', 'danger');
      return;
    }
    
    // عرض مؤشر التحميل
    viewModalTitle.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> جاري تحميل التفاصيل...';
    viewModalBody.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"></div><p class="mt-2">جاري تحميل بيانات الترخيص...</p></div>';
    
    // عرض النافذة
    const modal = new bootstrap.Modal(viewModal);
    modal.show();
    
    // جلب تفاصيل الترخيص
    fetch(`/api/licenses/${licenseId}?details=true`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('فشل جلب تفاصيل الترخيص: ' + response.statusText);
      }
      return response.json();
    })
    .then(data => {
      console.log('تم جلب تفاصيل الترخيص:', data);
      
      // استخراج بيانات الترخيص
      const license = data.license || data;
      
      // تسجيل محتويات الترخيص للتصحيح
      console.log('محتويات الترخيص:', JSON.stringify(license, null, 2));
      
      // تحديث عنوان النافذة - استخدام licenseKey بدلاً من key
      viewModalTitle.textContent = `تفاصيل الترخيص: ${license.licenseKey || 'غير معروف'}`;
      
      // تحديث محتوى الجسم
      viewModalBody.innerHTML = `
        <div class="license-details-container">
          <div class="mb-4">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <h6 class="mb-0">حالة الترخيص:</h6>
              <span class="badge bg-${license.status === 'active' ? 'success' : license.status === 'revoked' ? 'danger' : 'warning'}">
                ${getLicenseStatusText(license.status) || 'غير معروف'}
              </span>
            </div>
          </div>
          
          <div class="row mb-4">
            <div class="col-md-6">
              <h6>معلومات الترخيص</h6>
              <table class="table table-sm">
                <tr>
                  <td><strong>مفتاح الترخيص:</strong></td>
                  <td><code>${license.licenseKey || 'غير متوفر'}</code></td>
                </tr>
                <tr>
                  <td><strong>نوع الترخيص:</strong></td>
                  <td>${getLicenseTypeText(license.type) || 'غير معروف'}</td>
                </tr>
                <tr>
                  <td><strong>تاريخ الإصدار:</strong></td>
                  <td>${license.createdAt ? new Date(license.createdAt).toLocaleDateString('ar-AE') : 'غير متوفر'}</td>
                </tr>
                <tr>
                  <td><strong>تاريخ الانتهاء:</strong></td>
                  <td>${license.type === 'perpetual' ? 'غير محدد (دائم)' : (license.expiryDate ? new Date(license.expiryDate).toLocaleDateString('ar-AE') : 'غير متوفر')}</td>
                </tr>
                <tr>
                  <td><strong>التفعيلات:</strong></td>
                  <td>${license.activations ? license.activations.length : 0} / ${license.maxDevices || 'غير محدد'}</td>
                </tr>
              </table>
            </div>
            
            <div class="col-md-6">
              <h6>معلومات العميل والمنتج</h6>
              <table class="table table-sm">
                <tr>
                  <td><strong>اسم العميل:</strong></td>
                  <td>${license.customerName || (license.customerId && license.customerId.name) || 'غير متوفر'}</td>
                </tr>
                <tr>
                  <td><strong>البريد الإلكتروني:</strong></td>
                  <td>${license.customerEmail || (license.customerId && license.customerId.email) || 'غير متوفر'}</td>
                </tr>
                <tr>
                  <td><strong>المنتج:</strong></td>
                  <td>${(license.productId && license.productId.name) || 'غير متوفر'}</td>
                </tr>
                <tr>
                  <td><strong>ملاحظات:</strong></td>
                  <td>${license.notes || 'لا توجد ملاحظات'}</td>
                </tr>
              </table>
            </div>
          </div>
            </div>
          `;
    })
    .catch(error => {
      console.error('خطأ في جلب تفاصيل الترخيص:', error);
      viewModalBody.innerHTML = `
        <div class="alert alert-danger">
          <i class="bi bi-exclamation-triangle-fill me-2"></i>
          حدث خطأ أثناء جلب تفاصيل الترخيص: ${error.message}
        </div>
      `;
      viewModalTitle.textContent = 'خطأ في عرض الترخيص';
    });
  } catch (error) {
    console.error('خطأ غير متوقع في viewLicense:', error);
    showAlert('حدث خطأ غير متوقع: ' + error.message, 'danger');
  }
}

// إلغاء الترخيص
function revokeLicense(licenseId) {
  try {
    if (!licenseId) {
      showAlert('معرف الترخيص غير صالح', 'danger');
      return;
    }
    
    // التأكد من وجود رمز التوثيق
    if (!authToken) {
      showAlert('يجب تسجيل الدخول أولاً', 'danger');
      return;
    }
    
    // إظهار تأكيد قبل الإلغاء
    if (!confirm('هل أنت متأكد من رغبتك في إلغاء هذا الترخيص؟ لا يمكن التراجع عن هذه العملية.')) {
      return;
    }
    
    // عرض مؤشر التحميل
    showLoading('جاري إلغاء الترخيص...');
    
    // إرسال طلب إلغاء الترخيص
    fetch(`/api/licenses/${licenseId}/revoke`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(data => {
          throw new Error(data.message || `فشل في إلغاء الترخيص: ${response.statusText}`);
        });
      }
      return response.json();
    })
    .then(data => {
      hideLoading();
      showAlert('تم إلغاء الترخيص بنجاح', 'success');
      
      // إغلاق النافذة المنبثقة للتفاصيل إذا كانت مفتوحة
      const detailsModal = bootstrap.Modal.getInstance(document.getElementById('license-details-modal'));
      if (detailsModal) {
        detailsModal.hide();
      }
      
      // تحديث قائمة التراخيص والإحصائيات
      if (typeof loadLicensesData === 'function') {
        loadLicensesData();
      }
      
      if (typeof loadDashboardData === 'function') {
        loadDashboardData();
      }
    })
    .catch(error => {
      hideLoading();
      console.error('خطأ في إلغاء الترخيص:', error);
      showAlert('حدث خطأ: ' + error.message, 'danger');
    });
  } catch (error) {
    hideLoading();
    console.error('خطأ غير متوقع في revokeLicense:', error);
    showAlert('حدث خطأ غير متوقع: ' + error.message, 'danger');
  }
}

// دالة لتحديد ما إذا كانت مكتبة Bootstrap متاحة
function isBootstrapAvailable() {
  return typeof bootstrap !== 'undefined' && typeof bootstrap.Modal !== 'undefined';
}

// دالة مساعدة لإنشاء وعرض نافذة منبثقة
function createAndShowModal(modalElement) {
  // التحقق من توفر مكتبة Bootstrap
  if (!isBootstrapAvailable()) {
    console.error('خطأ: مكتبة Bootstrap غير متاحة!');
    showAlert('خطأ في تحميل مكتبة النوافذ المنبثقة، يرجى تحديث الصفحة.', 'danger');
    return null;
  }
  
  // التحقق من وجود عنصر النافذة
  if (!modalElement) {
    console.error('خطأ: عنصر النافذة المنبثقة غير موجود!');
    showAlert('خطأ في إنشاء النافذة المنبثقة: العنصر غير موجود.', 'danger');
    return null;
  }
  
  // التحقق من نوع عنصر النافذة
  if (!(modalElement instanceof HTMLElement)) {
    console.error('خطأ: العنصر المقدم ليس عنصر HTML صالح!', typeof modalElement, modalElement);
    showAlert('خطأ في إنشاء النافذة المنبثقة: نوع العنصر غير صالح.', 'danger');
    return null;
  }
  
  try {
    // التحقق من وجود سمة معرف النافذة
    const modalId = modalElement.id;
    if (!modalId) {
      console.warn('تحذير: عنصر النافذة المنبثقة ليس له معرف، قد يسبب ذلك مشاكل.');
    }
    
    // التحقق من وجود سمة data-bs-backdrop
    if (!modalElement.hasAttribute('data-bs-backdrop')) {
      modalElement.setAttribute('data-bs-backdrop', 'static');
    }
    
    // التحقق من وجود سمة data-bs-keyboard
    if (!modalElement.hasAttribute('data-bs-keyboard')) {
      modalElement.setAttribute('data-bs-keyboard', 'true');
    }
    
    // التحقق إذا كانت النافذة المنبثقة مسجلة سابقاً
    let modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) {
      console.log('النافذة المنبثقة موجودة مسبقاً، استخدام النسخة الموجودة.');
      return modalInstance;
    }
    
    // إنشاء نسخة جديدة من النافذة المنبثقة
    console.log('إنشاء نسخة جديدة من النافذة المنبثقة.');
    return new bootstrap.Modal(modalElement, {
      backdrop: 'static',
      keyboard: true,
      focus: true
    });
  } catch (error) {
    console.error('خطأ في إنشاء النافذة المنبثقة:', error);
    console.error('تفاصيل العنصر:', modalElement);
    showAlert('حدث خطأ أثناء إنشاء النافذة المنبثقة: ' + error.message, 'danger');
    return null;
  }
}

// تعديل دالة showLicenseModal
function showLicenseModal(licenseId) {
  console.log('عرض النافذة المنبثقة للترخيص:', licenseId);
  
  // تنظيف النموذج
  document.getElementById('license-form').reset();
  
  // تهيئة حقول النموذج
  document.getElementById('license-id').value = licenseId || '';
  document.getElementById('license-start-date').value = new Date().toISOString().split('T')[0];
  
  const expiryDate = new Date();
  expiryDate.setFullYear(expiryDate.getFullYear() + 1);
  document.getElementById('license-expiry-date').value = expiryDate.toISOString().split('T')[0];
  
  // تعيين عنوان النافذة بناءً على وجود معرف الترخيص
  document.getElementById('license-modal-title').textContent = licenseId ? 'تعديل بيانات الترخيص' : 'إضافة ترخيص جديد';
  
  // تحميل المنتجات والعملاء
  loadProductsAndCustomersForLicense();
  
  if (licenseId) {
    // حالة التعديل: جلب بيانات الترخيص الحالي
    showLoading('جاري تحميل بيانات الترخيص...');
    
    fetch(`/api/licenses/${licenseId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    })
    .then(response => response.json())
    .then(data => {
      hideLoading();
      
      const license = data.license;
      if (license) {
        // تعبئة النموذج ببيانات الترخيص
        document.getElementById('license-product').value = license.productId || '';
        document.getElementById('license-customer').value = license.customerId || '';
        document.getElementById('license-type').value = license.type || 'subscription';
        document.getElementById('license-max-activations').value = license.maxActivations || 1;
        
        if (license.startDate) {
          document.getElementById('license-start-date').value = license.startDate.split('T')[0];
        }
        
        if (license.expiryDate) {
          document.getElementById('license-expiry-date').value = license.expiryDate.split('T')[0];
        }
        
        document.getElementById('license-notes').value = license.notes || '';
        
        // تحديث ظهور حقل تاريخ الانتهاء بناءً على نوع الترخيص
        toggleExpiryDateVisibility();
      }
    })
    .catch(error => {
      hideLoading();
      showAlert('فشل في تحميل بيانات الترخيص: ' + error.message, 'danger');
    });
  }
  
  // عرض النافذة المنبثقة
  const modalElement = document.getElementById('license-modal');
  const modal = createAndShowModal(modalElement);
  if (modal) {
    modal.show();
  }
}

// تعديل دالة showCustomerModal
function showCustomerModal(customerId) {
  console.log('عرض النافذة المنبثقة للعميل:', customerId);
  
  try {
    // التحقق من وجود نموذج العميل
  const customerForm = document.getElementById('customer-form');
  if (!customerForm) {
    console.error('لم يتم العثور على نموذج العميل');
    showAlert('حدث خطأ: لم يتم العثور على نموذج العميل', 'danger');
    return;
  }
  
    // تنظيف النموذج
  customerForm.reset();
  
    // التحقق من وجود عناصر النموذج المطلوبة
    const modalTitle = document.getElementById('customer-modal-title');
  const customerIdField = document.getElementById('customer-id');
    const modalElement = document.getElementById('customer-modal');
    
    if (!modalElement) {
      console.error('لم يتم العثور على نافذة العميل');
      showAlert('حدث خطأ: لم يتم العثور على نافذة العميل', 'danger');
      return;
    }
    
    // تعيين معرف العميل (إن وجد)
  if (customerIdField) {
    customerIdField.value = customerId || '';
    } else {
      console.warn('حقل معرف العميل غير موجود');
  }
  
  // تعيين عنوان النافذة بناءً على وجود معرف العميل
  if (modalTitle) {
    modalTitle.textContent = customerId ? 'تعديل بيانات العميل' : 'إضافة عميل جديد';
    } else {
      console.warn('عنصر عنوان النافذة غير موجود');
  }
  
  // إظهار حقول الشركة بشكل افتراضي
  if (typeof toggleCompanyFields === 'function') {
    toggleCompanyFields();
  }
  
  if (customerId) {
    // حالة التعديل: جلب بيانات العميل الحالي
    showLoading('جاري تحميل بيانات العميل...');
    
    fetch(`/api/customers/${customerId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('فشل جلب بيانات العميل: ' + response.statusText);
      }
      return response.json();
    })
    .then(data => {
      hideLoading();
      
      const customer = data.customer;
      if (customer) {
          // تعبئة النموذج ببيانات العميل - مع التحقق من وجود كل عنصر
        const customerTypeField = document.getElementById('customer-type');
        const customerNameField = document.getElementById('customer-name');
        const customerEmailField = document.getElementById('customer-email');
        const customerPhoneField = document.getElementById('customer-phone');
        const companyNameField = document.getElementById('company-name');
        const taxNumberField = document.getElementById('tax-number');
        
          // التحقق من وجود العناصر قبل تعيين القيم
        if (customerTypeField) customerTypeField.value = customer.type || 'individual';
        if (customerNameField) customerNameField.value = customer.name || '';
        if (customerEmailField) customerEmailField.value = customer.email || '';
        if (customerPhoneField) customerPhoneField.value = customer.phone || '';
        if (companyNameField) companyNameField.value = customer.companyName || '';
        if (taxNumberField) taxNumberField.value = customer.taxNumber || '';
        
        // تحديث ظهور حقول الشركة بناءً على نوع العميل
        if (typeof toggleCompanyFields === 'function') {
          toggleCompanyFields();
        }
      }
    })
    .catch(error => {
      hideLoading();
      showAlert('فشل في تحميل بيانات العميل: ' + error.message, 'danger');
      console.error('خطأ في جلب بيانات العميل:', error);
    });
  }
  
  // عرض النافذة المنبثقة باستخدام الدالة المساعدة
    if (isBootstrapAvailable()) {
      try {
        const modal = createAndShowModal(modalElement);
        if (modal) {
          modal.show();
        } else {
          showAlert('فشل في إنشاء نافذة العميل', 'danger');
        }
      } catch (error) {
        console.error('خطأ في إنشاء نافذة العميل:', error);
        showAlert('حدث خطأ أثناء إنشاء نافذة العميل', 'danger');
      }
    } else {
      showAlert('مكتبة Bootstrap غير متاحة، يرجى تحديث الصفحة', 'danger');
    }
  } catch (error) {
    console.error('خطأ غير متوقع أثناء فتح نافذة العميل:', error);
    showAlert('حدث خطأ غير متوقع: ' + error.message, 'danger');
  }
}

// عرض نموذج إضافة/تعديل منتج
function showProductModal(productId) {
  console.log('فتح نموذج المنتج:', productId);
  
  try {
    // التحقق من وجود نموذج المنتج
    const productForm = document.getElementById('product-form');
    const productModal = document.getElementById('product-modal');
    
    // التحقق من وجود العناصر الأساسية
    if (!productModal) {
      console.error('لم يتم العثور على نافذة المنتج (product-modal)');
      showAlert('خطأ: نافذة المنتج غير موجودة', 'danger');
      return;
    }
    
    if (!productForm) {
      console.error('لم يتم العثور على نموذج المنتج (product-form)');
      showAlert('خطأ: نموذج المنتج غير موجود', 'danger');
      return;
    }
    
    // الحصول على مراجع العناصر الرئيسية
    const modalTitle = document.getElementById('product-modal-title');
    const productIdField = document.getElementById('product-id');
    const saveButton = document.querySelector('#product-modal .modal-footer .btn-primary');
    
    // التحقق من العناصر الإضافية المهمة
    if (!modalTitle) {
      console.warn('لم يتم العثور على عنوان النافذة (product-modal-title)');
    }
    
    if (!productIdField) {
      console.warn('لم يتم العثور على حقل معرف المنتج (product-id)');
    }
    
    if (!saveButton) {
      console.warn('لم يتم العثور على زر الحفظ');
    }
    
    // إعادة تعيين النموذج
    productForm.reset();
    
    // تعيين العنوان وقيمة معرّف المنتج
    if (modalTitle) {
      modalTitle.textContent = productId ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد';
    }
    
    if (productIdField) {
      productIdField.value = productId || '';
    }
    
    // تغيير نص زر الحفظ حسب الحالة
    if (saveButton) {
      saveButton.textContent = productId ? 'تحديث' : 'إضافة';
    }
    
    // إذا كان هناك معرّف منتج، نقوم بجلب بيانات المنتج من الخادم
  if (productId) {
      // التحقق من وجود العناصر اللازمة قبل إظهار مؤشر التحميل
      // محاولة البحث عن محتوى النموذج بعدة طرق مختلفة (لأن هيكل النموذج قد يختلف)
      let formContent = document.querySelector('#product-form .modal-body');
      
      if (!formContent) {
        // محاولة أخرى - قد يكون .modal-body موجودًا في نفس المستوى مع النموذج
        formContent = document.querySelector('#product-modal .modal-body');
      }
      
      if (!formContent) {
        // محاولة أخيرة - البحث عن أي .modal-body داخل الصفحة
        formContent = document.querySelector('.modal-body');
      }
      
      if (!formContent) {
        console.error('لم يتم العثور على محتوى النموذج (.modal-body)');
        console.log('استخدام نموذج المنتج كبديل لمحتوى النموذج');
        // استخدام نموذج المنتج نفسه كبديل إذا لم يتم العثور على محتوى النموذج
        formContent = productForm;
      }
      
      // حفظ العنوان الأصلي واستخدام مؤشر التحميل
      const originalTitle = modalTitle ? modalTitle.textContent : '';
      
      if (modalTitle) {
        modalTitle.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> جاري التحميل...';
      }
      
      // تطبيق تأثير بصري لإظهار مؤشر التحميل
      if (formContent) {
        formContent.style.opacity = '0.5';
      }
      
      // التحقق من وجود رمز التوثيق
      if (!authToken) {
        console.error('رمز التوثيق غير موجود');
        showAlert('يجب تسجيل الدخول أولاً', 'warning');
        
        // إعادة العناصر إلى حالتها الطبيعية
        if (modalTitle) modalTitle.textContent = originalTitle;
        if (formContent) formContent.style.opacity = '1';
        return;
      }
      
      // جلب بيانات المنتج من الخادم
    fetch(`/api/products/${productId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('فشل جلب بيانات المنتج: ' + response.statusText);
        }
        return response.json();
      })
    .then(data => {
        console.log('تم جلب بيانات المنتج:', data);
        
        // التأكد من الحصول على بيانات المنتج بشكل صحيح (يمكن أن تكون في أشكال مختلفة حسب تصميم API)
        // قد تكون البيانات موجودة في data.product أو في الكائن data نفسه
        const product = data.product || data;
        
        // طباعة كائن المنتج بالكامل للفحص
        console.log('هيكل بيانات المنتج المستخرجة:', product);
        
        if (!product || (typeof product === 'object' && Object.keys(product).length === 0)) {
          throw new Error('تم استلام بيانات المنتج بتنسيق غير صالح أو فارغة');
        }
        
        // التحقق من حقول النموذج قبل ملؤها
        const productNameField = document.getElementById('product-name');
        const productCodeField = document.getElementById('product-code');
        const productDescriptionField = document.getElementById('product-description');
        const productPriceField = document.getElementById('product-price');
        const productCategoryField = document.getElementById('product-category');
        
        // التحقق من وجود الحقول الأساسية
        if (!productNameField || !productCodeField) {
          console.error('لم يتم العثور على حقول المنتج الأساسية');
          throw new Error('حقول المنتج الأساسية غير موجودة');
        }
        
        // طباعة قيم المنتج التي سيتم تعبئتها
        console.log('القيم التي سيتم تعبئتها:', {
          name: product.name,
          code: product.code,
          description: product.description,
          price: product.price,
          category: product.category
        });
        
        // ملء حقول النموذج ببيانات المنتج
        productNameField.value = product.name || '';
        productCodeField.value = product.code || '';
        
        if (productDescriptionField) productDescriptionField.value = product.description || '';
        if (productPriceField) productPriceField.value = product.price || '';
        if (productCategoryField) productCategoryField.value = product.category || '';
        
        // إعادة العناصر إلى حالتها الطبيعية
        if (modalTitle) modalTitle.textContent = originalTitle;
        if (formContent) formContent.style.opacity = '1';
    })
    .catch(error => {
        console.error('خطأ في جلب بيانات المنتج:', error);
      showAlert('فشل في تحميل بيانات المنتج: ' + error.message, 'danger');
        
        // إعادة العناصر إلى حالتها الطبيعية
        if (modalTitle) modalTitle.textContent = originalTitle;
        if (formContent) formContent.style.opacity = '1';
      });
    }
    
    // إنشاء وعرض النموذج باستخدام Bootstrap
    if (isBootstrapAvailable()) {
      try {
        const modal = new bootstrap.Modal(productModal);
    modal.show();
      } catch (error) {
        console.error('خطأ في عرض نافذة المنتج:', error);
        showAlert('حدث خطأ أثناء عرض نافذة المنتج: ' + error.message, 'danger');
      }
    } else {
      console.error('مكتبة Bootstrap غير متاحة');
      showAlert('مكتبة Bootstrap غير متاحة، يرجى تحديث الصفحة', 'danger');
    }
  } catch (error) {
    console.error('خطأ في فتح نموذج المنتج:', error);
    showAlert('حدث خطأ غير متوقع أثناء فتح نموذج المنتج: ' + error.message, 'danger');
  }
}

// حفظ الترخيص
function saveLicense() {
  try {
    console.log('حفظ بيانات الترخيص...');
    
    // التحقق من وجود رمز توثيق
    if (!authToken) {
      showAlert('يجب تسجيل الدخول أولاً', 'danger');
      return;
    }
    
    // التحقق من وجود نموذج الترخيص
    const licenseForm = document.getElementById('license-form');
    if (!licenseForm) {
      showAlert('لم يتم العثور على نموذج الترخيص', 'danger');
      return;
    }
    
    // التحقق من وجود حقول النموذج المطلوبة
    const licenseId = document.getElementById('license-id');
    const productSelect = document.getElementById('license-product');
    const customerSelect = document.getElementById('license-customer');
    const licenseTypeSelect = document.getElementById('license-type');
    const maxActivationsInput = document.getElementById('license-max-activations');
    const startDateInput = document.getElementById('license-start-date');
    const expiryDateInput = document.getElementById('license-expiry-date');
    const notesTextarea = document.getElementById('license-notes');
    
    // التحقق من وجود العناصر الأساسية
    if (!productSelect || !customerSelect || !licenseTypeSelect || !maxActivationsInput || !startDateInput) {
      showAlert('بعض عناصر النموذج الأساسية مفقودة', 'danger');
      return;
    }
    
    // التحقق من الحقول المطلوبة
    if (!productSelect.value) {
      showAlert('يرجى اختيار المنتج', 'warning');
      productSelect.focus();
      return;
    }
    
    if (!customerSelect.value) {
      showAlert('يرجى اختيار العميل', 'warning');
      customerSelect.focus();
      return;
    }
    
    if (!licenseTypeSelect.value) {
      showAlert('يرجى اختيار نوع الترخيص', 'warning');
      licenseTypeSelect.focus();
      return;
    }
    
    if (!startDateInput.value) {
      showAlert('يرجى تحديد تاريخ بدء الترخيص', 'warning');
      startDateInput.focus();
      return;
    }
    
    // التحقق من تاريخ الانتهاء لأنواع التراخيص غير الدائمة
    if (licenseTypeSelect.value !== 'perpetual' && !expiryDateInput.value) {
      showAlert('يرجى تحديد تاريخ انتهاء الترخيص', 'warning');
      expiryDateInput.focus();
      return;
    }
    
    // التحقق من وجود خيارات في القوائم المنسدلة
    const productOptions = productSelect.querySelectorAll('option');
    const customerOptions = customerSelect.querySelectorAll('option');
    
    if (productOptions.length <= 1) {
      showAlert('لا توجد منتجات متاحة. الرجاء إضافة منتج أولاً.', 'warning');
      return;
    }
    
    if (customerOptions.length <= 1) {
      showAlert('لا يوجد عملاء متاحين. الرجاء إضافة عميل أولاً.', 'warning');
      return;
    }
    
    // الحصول على بيانات العميل المحدد
    const selectedCustomerOption = customerSelect.options[customerSelect.selectedIndex];
    const customerName = selectedCustomerOption.textContent || '';
    
    // جلب بيانات العميل كاملة
    showLoading('جاري التحقق من بيانات العميل...');
    
    fetch(`/api/customers/${customerSelect.value}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    })
    .then(response => {
      if (!response.ok) {
        hideLoading();
        throw new Error('فشل في جلب بيانات العميل: ' + response.statusText);
      }
      return response.json();
    })
    .then(customerData => {
      hideLoading();
      
      if (!customerData || !customerData.customer) {
        throw new Error('لم يتم العثور على بيانات العميل');
      }
      
      const customer = customerData.customer;
      
      // التحقق من وجود البيانات الأساسية للعميل
      if (!customer.name || !customer.email) {
        throw new Error('بيانات العميل ناقصة. يرجى تحديث بيانات العميل أولاً.');
    }
    
    // جمع بيانات النموذج
    const licenseData = {
      productId: productSelect.value,
      customerId: customerSelect.value,
      type: licenseTypeSelect.value,
      maxActivations: parseInt(maxActivationsInput.value) || 1,
      startDate: startDateInput.value,
        notes: notesTextarea ? notesTextarea.value : '',
        // إضافة بيانات العميل المطلوبة
        customerName: customer.name,
        customerEmail: customer.email
    };
    
    // إضافة تاريخ الانتهاء للتراخيص غير الدائمة
    if (licenseTypeSelect.value !== 'perpetual' && expiryDateInput && expiryDateInput.value) {
      licenseData.expiryDate = expiryDateInput.value;
    }
    
    // إضافة معرف الترخيص في حالة التعديل
    if (licenseId && licenseId.value) {
      licenseData.id = licenseId.value;
    }
    
    // تعطيل زر الحفظ وإظهار مؤشر التحميل
    const saveButton = document.querySelector('#license-modal .modal-footer .btn-primary');
      let originalText = 'حفظ'; // تعريف قيمة افتراضية للنص الأصلي
      
    if (saveButton) {
        originalText = saveButton.innerHTML; // تخزين النص الأصلي
      saveButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> جاري الحفظ...';
      saveButton.disabled = true;
    }
    
    // إرسال البيانات إلى الخادم
    const url = licenseData.id ? `/api/licenses/${licenseData.id}` : '/api/licenses';
    const method = licenseData.id ? 'PUT' : 'POST';
    
      console.log('إرسال بيانات الترخيص:', licenseData);
      
      return fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(licenseData)
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(errorData => {
          throw new Error(errorData.message || `فشل حفظ الترخيص: ${response.statusText}`);
        });
      }
      return response.json();
    })
    .then(data => {
      // إغلاق النافذة المنبثقة
      const licenseModal = bootstrap.Modal.getInstance(document.getElementById('license-modal'));
      if (licenseModal) {
        licenseModal.hide();
      }
      
      // عرض رسالة نجاح
      showAlert(`تم ${licenseData.id ? 'تحديث' : 'إضافة'} الترخيص بنجاح`, 'success');
      
      // تحديث قائمة التراخيص
      if (typeof loadLicensesData === 'function') {
        loadLicensesData();
      }
      
      // تحديث البيانات على لوحة التحكم
      if (typeof loadDashboardData === 'function') {
        loadDashboardData();
      }
    })
    .catch(error => {
      console.error('خطأ في حفظ الترخيص:', error);
      showAlert('حدث خطأ: ' + error.message, 'danger');
      
      // إعادة زر الحفظ إلى حالته الأصلية
      if (saveButton) {
          saveButton.innerHTML = originalText; // استخدام المتغير المحفوظ مسبقًا
        saveButton.disabled = false;
      }
      });
    })
    .catch(error => {
      hideLoading();
      console.error('خطأ في جلب بيانات العميل:', error);
      showAlert('حدث خطأ: ' + error.message, 'danger');
    });
  } catch (error) {
    console.error('خطأ غير متوقع أثناء حفظ الترخيص:', error);
    showAlert('حدث خطأ غير متوقع: ' + error.message, 'danger');
  }
}

// عرض نموذج إضافة/تعديل عميل
function showCustomerModal(customerId) {
  console.log('عرض النافذة المنبثقة للعميل:', customerId);
  
  try {
    // التحقق من وجود نموذج العميل
    const customerForm = document.getElementById('customer-form');
    if (!customerForm) {
      console.error('لم يتم العثور على نموذج العميل');
      showAlert('حدث خطأ: لم يتم العثور على نموذج العميل', 'danger');
      return;
    }
    
    // تنظيف النموذج
    customerForm.reset();
    
    // التحقق من وجود عناصر النموذج المطلوبة
    const modalTitle = document.getElementById('customer-modal-title');
    const customerIdField = document.getElementById('customer-id');
    const modalElement = document.getElementById('customer-modal');
    
    if (!modalElement) {
      console.error('لم يتم العثور على نافذة العميل');
      showAlert('حدث خطأ: لم يتم العثور على نافذة العميل', 'danger');
      return;
    }
    
    // تعيين معرف العميل (إن وجد)
    if (customerIdField) {
      customerIdField.value = customerId || '';
    } else {
      console.warn('حقل معرف العميل غير موجود');
    }
    
    // تعيين عنوان النافذة بناءً على وجود معرف العميل
    if (modalTitle) {
      modalTitle.textContent = customerId ? 'تعديل بيانات العميل' : 'إضافة عميل جديد';
    } else {
      console.warn('عنصر عنوان النافذة غير موجود');
    }
    
    // إظهار حقول الشركة بشكل افتراضي
    if (typeof toggleCompanyFields === 'function') {
      toggleCompanyFields();
    }
    
    if (customerId) {
      // حالة التعديل: جلب بيانات العميل الحالي
      showLoading('جاري تحميل بيانات العميل...');
      
        fetch(`/api/customers/${customerId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        })
        .then(response => {
          if (!response.ok) {
            throw new Error('فشل جلب بيانات العميل: ' + response.statusText);
      }
      return response.json();
    })
    .then(data => {
        hideLoading();
          
        const customer = data.customer;
        if (customer) {
          // تعبئة النموذج ببيانات العميل - مع التحقق من وجود كل عنصر
          const customerTypeField = document.getElementById('customer-type');
          const customerNameField = document.getElementById('customer-name');
          const customerEmailField = document.getElementById('customer-email');
          const customerPhoneField = document.getElementById('customer-phone');
          const companyNameField = document.getElementById('company-name');
          const taxNumberField = document.getElementById('tax-number');
          
          // التحقق من وجود العناصر قبل تعيين القيم
          if (customerTypeField) customerTypeField.value = customer.type || 'individual';
          if (customerNameField) customerNameField.value = customer.name || '';
          if (customerEmailField) customerEmailField.value = customer.email || '';
          if (customerPhoneField) customerPhoneField.value = customer.phone || '';
          if (companyNameField) companyNameField.value = customer.companyName || '';
          if (taxNumberField) taxNumberField.value = customer.taxNumber || '';
          
          // تحديث ظهور حقول الشركة بناءً على نوع العميل
          if (typeof toggleCompanyFields === 'function') {
            toggleCompanyFields();
          }
        }
        })
        .catch(error => {
        hideLoading();
        showAlert('فشل في تحميل بيانات العميل: ' + error.message, 'danger');
          console.error('خطأ في جلب بيانات العميل:', error);
      });
    }
    
    // عرض النافذة المنبثقة باستخدام الدالة المساعدة
    if (isBootstrapAvailable()) {
      try {
        const modal = createAndShowModal(modalElement);
        if (modal) {
          modal.show();
        } else {
          showAlert('فشل في إنشاء نافذة العميل', 'danger');
        }
      } catch (error) {
        console.error('خطأ في إنشاء نافذة العميل:', error);
        showAlert('حدث خطأ أثناء إنشاء نافذة العميل', 'danger');
      }
    } else {
      showAlert('مكتبة Bootstrap غير متاحة، يرجى تحديث الصفحة', 'danger');
    }
  } catch (error) {
    console.error('خطأ غير متوقع أثناء فتح نافذة العميل:', error);
    showAlert('حدث خطأ غير متوقع: ' + error.message, 'danger');
  }
}

// حفظ الترخيص
function saveLicense() {
  try {
    console.log('حفظ بيانات الترخيص...');
    
    // التحقق من وجود رمز توثيق
    if (!authToken) {
      showAlert('يجب تسجيل الدخول أولاً', 'danger');
      return;
    }
    
    // التحقق من وجود نموذج الترخيص
    const licenseForm = document.getElementById('license-form');
    if (!licenseForm) {
      showAlert('لم يتم العثور على نموذج الترخيص', 'danger');
      return;
    }
    
    // التحقق من وجود حقول النموذج المطلوبة
    const licenseId = document.getElementById('license-id');
    const productSelect = document.getElementById('license-product');
    const customerSelect = document.getElementById('license-customer');
    const licenseTypeSelect = document.getElementById('license-type');
    const maxActivationsInput = document.getElementById('license-max-activations');
    const startDateInput = document.getElementById('license-start-date');
    const expiryDateInput = document.getElementById('license-expiry-date');
    const notesTextarea = document.getElementById('license-notes');
    
    // التحقق من وجود العناصر الأساسية
    if (!productSelect || !customerSelect || !licenseTypeSelect || !maxActivationsInput || !startDateInput) {
      showAlert('بعض عناصر النموذج الأساسية مفقودة', 'danger');
      return;
    }
    
    // التحقق من الحقول المطلوبة
    if (!productSelect.value) {
      showAlert('يرجى اختيار المنتج', 'warning');
      productSelect.focus();
      return;
    }
    
    if (!customerSelect.value) {
      showAlert('يرجى اختيار العميل', 'warning');
      customerSelect.focus();
      return;
    }
    
    if (!licenseTypeSelect.value) {
      showAlert('يرجى اختيار نوع الترخيص', 'warning');
      licenseTypeSelect.focus();
      return;
    }
    
    if (!startDateInput.value) {
      showAlert('يرجى تحديد تاريخ بدء الترخيص', 'warning');
      startDateInput.focus();
      return;
    }
    
    // التحقق من تاريخ الانتهاء لأنواع التراخيص غير الدائمة
    if (licenseTypeSelect.value !== 'perpetual' && !expiryDateInput.value) {
      showAlert('يرجى تحديد تاريخ انتهاء الترخيص', 'warning');
      expiryDateInput.focus();
      return;
    }
    
    // التحقق من وجود خيارات في القوائم المنسدلة
    const productOptions = productSelect.querySelectorAll('option');
    const customerOptions = customerSelect.querySelectorAll('option');
    
    if (productOptions.length <= 1) {
      showAlert('لا توجد منتجات متاحة. الرجاء إضافة منتج أولاً.', 'warning');
      return;
    }
    
    if (customerOptions.length <= 1) {
      showAlert('لا يوجد عملاء متاحين. الرجاء إضافة عميل أولاً.', 'warning');
      return;
    }
    
    // الحصول على بيانات العميل المحدد
    const selectedCustomerOption = customerSelect.options[customerSelect.selectedIndex];
    const customerName = selectedCustomerOption.textContent || '';
    
    // جلب بيانات العميل كاملة
    showLoading('جاري التحقق من بيانات العميل...');
    
    fetch(`/api/customers/${customerSelect.value}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    })
    .then(response => {
      if (!response.ok) {
        hideLoading();
        throw new Error('فشل في جلب بيانات العميل: ' + response.statusText);
      }
      return response.json();
    })
    .then(customerData => {
      hideLoading();
      
      if (!customerData || !customerData.customer) {
        throw new Error('لم يتم العثور على بيانات العميل');
      }
      
      const customer = customerData.customer;
      
      // التحقق من وجود البيانات الأساسية للعميل
      if (!customer.name || !customer.email) {
        throw new Error('بيانات العميل ناقصة. يرجى تحديث بيانات العميل أولاً.');
    }
    
    // جمع بيانات النموذج
    const licenseData = {
      productId: productSelect.value,
      customerId: customerSelect.value,
      type: licenseTypeSelect.value,
      maxActivations: parseInt(maxActivationsInput.value) || 1,
      startDate: startDateInput.value,
        notes: notesTextarea ? notesTextarea.value : '',
        // إضافة بيانات العميل المطلوبة
        customerName: customer.name,
        customerEmail: customer.email
    };
    
    // إضافة تاريخ الانتهاء للتراخيص غير الدائمة
    if (licenseTypeSelect.value !== 'perpetual' && expiryDateInput && expiryDateInput.value) {
      licenseData.expiryDate = expiryDateInput.value;
    }
    
    // إضافة معرف الترخيص في حالة التعديل
    if (licenseId && licenseId.value) {
      licenseData.id = licenseId.value;
    }
    
    // تعطيل زر الحفظ وإظهار مؤشر التحميل
    const saveButton = document.querySelector('#license-modal .modal-footer .btn-primary');
      let originalText = 'حفظ'; // تعريف قيمة افتراضية للنص الأصلي
      
    if (saveButton) {
        originalText = saveButton.innerHTML; // تخزين النص الأصلي
      saveButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> جاري الحفظ...';
      saveButton.disabled = true;
    }
    
    // إرسال البيانات إلى الخادم
    const url = licenseData.id ? `/api/licenses/${licenseData.id}` : '/api/licenses';
    const method = licenseData.id ? 'PUT' : 'POST';
    
      console.log('إرسال بيانات الترخيص:', licenseData);
      
      return fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(licenseData)
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(errorData => {
          throw new Error(errorData.message || `فشل حفظ الترخيص: ${response.statusText}`);
        });
      }
      return response.json();
    })
    .then(data => {
      // إغلاق النافذة المنبثقة
      const licenseModal = bootstrap.Modal.getInstance(document.getElementById('license-modal'));
      if (licenseModal) {
        licenseModal.hide();
        }
        
        // عرض رسالة نجاح
      showAlert(`تم ${licenseData.id ? 'تحديث' : 'إضافة'} الترخيص بنجاح`, 'success');
      
      // تحديث قائمة التراخيص
      if (typeof loadLicensesData === 'function') {
        loadLicensesData();
      }
      
      // تحديث البيانات على لوحة التحكم
      if (typeof loadDashboardData === 'function') {
        loadDashboardData();
      }
    })
    .catch(error => {
      console.error('خطأ في حفظ الترخيص:', error);
      showAlert('حدث خطأ: ' + error.message, 'danger');
      
      // إعادة زر الحفظ إلى حالته الأصلية
      if (saveButton) {
          saveButton.innerHTML = originalText; // استخدام المتغير المحفوظ مسبقًا
        saveButton.disabled = false;
      }
      });
    })
    .catch(error => {
      hideLoading();
      console.error('خطأ في جلب بيانات العميل:', error);
      showAlert('حدث خطأ: ' + error.message, 'danger');
    });
  } catch (error) {
    console.error('خطأ غير متوقع أثناء حفظ الترخيص:', error);
    showAlert('حدث خطأ غير متوقع: ' + error.message, 'danger');
  }
}

// عرض نموذج إضافة/تعديل عميل
function showCustomerModal(customerId) {
  console.log('عرض النافذة المنبثقة للعميل:', customerId);
  
  try {
    // التحقق من وجود نموذج العميل
    const customerForm = document.getElementById('customer-form');
    if (!customerForm) {
      console.error('لم يتم العثور على نموذج العميل');
      showAlert('حدث خطأ: لم يتم العثور على نموذج العميل', 'danger');
      return;
    }
    
    // تنظيف النموذج
    customerForm.reset();
    
    // التحقق من وجود عناصر النموذج المطلوبة
    const modalTitle = document.getElementById('customer-modal-title');
    const customerIdField = document.getElementById('customer-id');
    const modalElement = document.getElementById('customer-modal');
    
    if (!modalElement) {
      console.error('لم يتم العثور على نافذة العميل');
      showAlert('حدث خطأ: لم يتم العثور على نافذة العميل', 'danger');
      return;
    }
    
    // تعيين معرف العميل (إن وجد)
    if (customerIdField) {
      customerIdField.value = customerId || '';
    } else {
      console.warn('حقل معرف العميل غير موجود');
    }
    
    // تعيين عنوان النافذة بناءً على وجود معرف العميل
    if (modalTitle) {
      modalTitle.textContent = customerId ? 'تعديل بيانات العميل' : 'إضافة عميل جديد';
    } else {
      console.warn('عنصر عنوان النافذة غير موجود');
    }
    
    // إظهار حقول الشركة بشكل افتراضي
    if (typeof toggleCompanyFields === 'function') {
      toggleCompanyFields();
    }
    
    if (customerId) {
      // حالة التعديل: جلب بيانات العميل الحالي
      showLoading('جاري تحميل بيانات العميل...');
      
        fetch(`/api/customers/${customerId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        })
        .then(response => {
          if (!response.ok) {
            throw new Error('فشل جلب بيانات العميل: ' + response.statusText);
      }
      return response.json();
    })
    .then(data => {
        hideLoading();
          
        const customer = data.customer;
        if (customer) {
          // تعبئة النموذج ببيانات العميل - مع التحقق من وجود كل عنصر
          const customerTypeField = document.getElementById('customer-type');
          const customerNameField = document.getElementById('customer-name');
          const customerEmailField = document.getElementById('customer-email');
          const customerPhoneField = document.getElementById('customer-phone');
          const companyNameField = document.getElementById('company-name');
          const taxNumberField = document.getElementById('tax-number');
          
          // التحقق من وجود العناصر قبل تعيين القيم
          if (customerTypeField) customerTypeField.value = customer.type || 'individual';
          if (customerNameField) customerNameField.value = customer.name || '';
          if (customerEmailField) customerEmailField.value = customer.email || '';
          if (customerPhoneField) customerPhoneField.value = customer.phone || '';
          if (companyNameField) companyNameField.value = customer.companyName || '';
          if (taxNumberField) taxNumberField.value = customer.taxNumber || '';
          
          // تحديث ظهور حقول الشركة بناءً على نوع العميل
          if (typeof toggleCompanyFields === 'function') {
            toggleCompanyFields();
          }
        }
        })
        .catch(error => {
        hideLoading();
        showAlert('فشل في تحميل بيانات العميل: ' + error.message, 'danger');
          console.error('خطأ في جلب بيانات العميل:', error);
      });
    }
    
    // عرض النافذة المنبثقة باستخدام الدالة المساعدة
    if (isBootstrapAvailable()) {
      try {
        const modal = createAndShowModal(modalElement);
        if (modal) {
          modal.show();
        } else {
          showAlert('فشل في إنشاء نافذة العميل', 'danger');
    }
  } catch (error) {
        console.error('خطأ في إنشاء نافذة العميل:', error);
        showAlert('حدث خطأ أثناء إنشاء نافذة العميل', 'danger');
      }
    } else {
      showAlert('مكتبة Bootstrap غير متاحة، يرجى تحديث الصفحة', 'danger');
    }
  } catch (error) {
    console.error('خطأ غير متوقع أثناء فتح نافذة العميل:', error);
    showAlert('حدث خطأ غير متوقع: ' + error.message, 'danger');
  }
}

// حفظ الترخيص
function saveLicense() {
  try {
    console.log('حفظ بيانات الترخيص...');
    
    // التحقق من وجود رمز توثيق
    if (!authToken) {
      showAlert('يجب تسجيل الدخول أولاً', 'danger');
      return;
    }
    
    // التحقق من وجود نموذج الترخيص
    const licenseForm = document.getElementById('license-form');
    if (!licenseForm) {
      showAlert('لم يتم العثور على نموذج الترخيص', 'danger');
      return;
    }
    
    // التحقق من وجود حقول النموذج المطلوبة
    const licenseId = document.getElementById('license-id');
    const productSelect = document.getElementById('license-product');
    const customerSelect = document.getElementById('license-customer');
    const licenseTypeSelect = document.getElementById('license-type');
    const maxActivationsInput = document.getElementById('license-max-activations');
    const startDateInput = document.getElementById('license-start-date');
    const expiryDateInput = document.getElementById('license-expiry-date');
    const notesTextarea = document.getElementById('license-notes');
    
    // التحقق من وجود العناصر الأساسية
    if (!productSelect || !customerSelect || !licenseTypeSelect || !maxActivationsInput || !startDateInput) {
      showAlert('بعض عناصر النموذج الأساسية مفقودة', 'danger');
      return;
    }
    
    // التحقق من الحقول المطلوبة
    if (!productSelect.value) {
      showAlert('يرجى اختيار المنتج', 'warning');
      productSelect.focus();
      return;
    }
    
    if (!customerSelect.value) {
      showAlert('يرجى اختيار العميل', 'warning');
      customerSelect.focus();
      return;
    }
    
    if (!licenseTypeSelect.value) {
      showAlert('يرجى اختيار نوع الترخيص', 'warning');
      licenseTypeSelect.focus();
      return;
    }
    
    if (!startDateInput.value) {
      showAlert('يرجى تحديد تاريخ بدء الترخيص', 'warning');
      startDateInput.focus();
      return;
    }
    
    // التحقق من تاريخ الانتهاء لأنواع التراخيص غير الدائمة
    if (licenseTypeSelect.value !== 'perpetual' && !expiryDateInput.value) {
      showAlert('يرجى تحديد تاريخ انتهاء الترخيص', 'warning');
      expiryDateInput.focus();
      return;
    }
    
    // التحقق من وجود خيارات في القوائم المنسدلة
    const productOptions = productSelect.querySelectorAll('option');
    const customerOptions = customerSelect.querySelectorAll('option');
    
    if (productOptions.length <= 1) {
      showAlert('لا توجد منتجات متاحة. الرجاء إضافة منتج أولاً.', 'warning');
      return;
    }
    
    if (customerOptions.length <= 1) {
      showAlert('لا يوجد عملاء متاحين. الرجاء إضافة عميل أولاً.', 'warning');
      return;
    }
    
    // الحصول على بيانات العميل المحدد
    const selectedCustomerOption = customerSelect.options[customerSelect.selectedIndex];
    const customerName = selectedCustomerOption.textContent || '';
    
    // جلب بيانات العميل كاملة
    showLoading('جاري التحقق من بيانات العميل...');
    
    fetch(`/api/customers/${customerSelect.value}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    })
    .then(response => {
      if (!response.ok) {
        hideLoading();
        throw new Error('فشل في جلب بيانات العميل: ' + response.statusText);
      }
      return response.json();
    })
    .then(customerData => {
      hideLoading();
      
      if (!customerData || !customerData.customer) {
        throw new Error('لم يتم العثور على بيانات العميل');
      }
      
      const customer = customerData.customer;
      
      // التحقق من وجود البيانات الأساسية للعميل
      if (!customer.name || !customer.email) {
        throw new Error('بيانات العميل ناقصة. يرجى تحديث بيانات العميل أولاً.');
      }
      
      // جمع بيانات النموذج
      const licenseData = {
        productId: productSelect.value,
        customerId: customerSelect.value,
        type: licenseTypeSelect.value,
        maxActivations: parseInt(maxActivationsInput.value) || 1,
        startDate: startDateInput.value,
        notes: notesTextarea ? notesTextarea.value : '',
        // إضافة بيانات العميل المطلوبة
        customerName: customer.name,
        customerEmail: customer.email
      };
      
      // إضافة تاريخ الانتهاء للتراخيص غير الدائمة
      if (licenseTypeSelect.value !== 'perpetual' && expiryDateInput && expiryDateInput.value) {
        licenseData.expiryDate = expiryDateInput.value;
      }
      
      // إضافة معرف الترخيص في حالة التعديل
      if (licenseId && licenseId.value) {
        licenseData.id = licenseId.value;
      }
      
      // تعطيل زر الحفظ وإظهار مؤشر التحميل
      const saveButton = document.querySelector('#license-modal .modal-footer .btn-primary');
      let originalText = 'حفظ'; // تعريف قيمة افتراضية للنص الأصلي
      
      if (saveButton) {
        originalText = saveButton.innerHTML; // تخزين النص الأصلي
        saveButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> جاري الحفظ...';
        saveButton.disabled = true;
      }

    // إرسال البيانات إلى الخادم
      const url = licenseData.id ? `/api/licenses/${licenseData.id}` : '/api/licenses';
      const method = licenseData.id ? 'PUT' : 'POST';
      
      console.log('إرسال بيانات الترخيص:', licenseData);
      
      return fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
        body: JSON.stringify(licenseData)
    })
    .then(response => {
      if (!response.ok) {
          return response.json().then(errorData => {
            throw new Error(errorData.message || `فشل حفظ الترخيص: ${response.statusText}`);
        });
      }
      return response.json();
    })
    .then(data => {
        // إغلاق النافذة المنبثقة
        const licenseModal = bootstrap.Modal.getInstance(document.getElementById('license-modal'));
        if (licenseModal) {
          licenseModal.hide();
        }
        
        // عرض رسالة نجاح
        showAlert(`تم ${licenseData.id ? 'تحديث' : 'إضافة'} الترخيص بنجاح`, 'success');
        
        // تحديث قائمة التراخيص
        if (typeof loadLicensesData === 'function') {
          loadLicensesData();
        }
        
        // تحديث البيانات على لوحة التحكم
        if (typeof loadDashboardData === 'function') {
          loadDashboardData();
      }
    })
    .catch(error => {
        console.error('خطأ في حفظ الترخيص:', error);
        showAlert('حدث خطأ: ' + error.message, 'danger');
        
      // إعادة زر الحفظ إلى حالته الأصلية
        if (saveButton) {
          saveButton.innerHTML = originalText; // استخدام المتغير المحفوظ مسبقًا
          saveButton.disabled = false;
        }
      });
    })
    .catch(error => {
      hideLoading();
      console.error('خطأ في جلب بيانات العميل:', error);
      showAlert('حدث خطأ: ' + error.message, 'danger');
    });
  } catch (error) {
    console.error('خطأ غير متوقع أثناء حفظ الترخيص:', error);
    showAlert('حدث خطأ غير متوقع: ' + error.message, 'danger');
  }
}

// عرض نموذج إضافة/تعديل عميل
function showCustomerModal(customerId) {
  console.log('عرض النافذة المنبثقة للعميل:', customerId);
  
  try {
    // التحقق من وجود نموذج العميل
    const customerForm = document.getElementById('customer-form');
    if (!customerForm) {
      console.error('لم يتم العثور على نموذج العميل');
      showAlert('حدث خطأ: لم يتم العثور على نموذج العميل', 'danger');
      return;
    }
    
    // تنظيف النموذج
    customerForm.reset();
    
    // التحقق من وجود عناصر النموذج المطلوبة
    const modalTitle = document.getElementById('customer-modal-title');
    const customerIdField = document.getElementById('customer-id');
    const modalElement = document.getElementById('customer-modal');
    
    if (!modalElement) {
      console.error('لم يتم العثور على نافذة العميل');
      showAlert('حدث خطأ: لم يتم العثور على نافذة العميل', 'danger');
      return;
    }
    
    // تعيين معرف العميل (إن وجد)
    if (customerIdField) {
      customerIdField.value = customerId || '';
    } else {
      console.warn('حقل معرف العميل غير موجود');
    }
    
    // تعيين عنوان النافذة بناءً على وجود معرف العميل
    if (modalTitle) {
      modalTitle.textContent = customerId ? 'تعديل بيانات العميل' : 'إضافة عميل جديد';
    } else {
      console.warn('عنصر عنوان النافذة غير موجود');
    }
    
    // إظهار حقول الشركة بشكل افتراضي
    if (typeof toggleCompanyFields === 'function') {
      toggleCompanyFields();
    }
    
    if (customerId) {
      // حالة التعديل: جلب بيانات العميل الحالي
      showLoading('جاري تحميل بيانات العميل...');
      
        fetch(`/api/customers/${customerId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        })
        .then(response => {
          if (!response.ok) {
            throw new Error('فشل جلب بيانات العميل: ' + response.statusText);
      }
      return response.json();
    })
    .then(data => {
        hideLoading();
          
        const customer = data.customer;
        if (customer) {
          // تعبئة النموذج ببيانات العميل - مع التحقق من وجود كل عنصر
          const customerTypeField = document.getElementById('customer-type');
          const customerNameField = document.getElementById('customer-name');
          const customerEmailField = document.getElementById('customer-email');
          const customerPhoneField = document.getElementById('customer-phone');
          const companyNameField = document.getElementById('company-name');
          const taxNumberField = document.getElementById('tax-number');
          
          // التحقق من وجود العناصر قبل تعيين القيم
          if (customerTypeField) customerTypeField.value = customer.type || 'individual';
          if (customerNameField) customerNameField.value = customer.name || '';
          if (customerEmailField) customerEmailField.value = customer.email || '';
          if (customerPhoneField) customerPhoneField.value = customer.phone || '';
          if (companyNameField) companyNameField.value = customer.companyName || '';
          if (taxNumberField) taxNumberField.value = customer.taxNumber || '';
          
          // تحديث ظهور حقول الشركة بناءً على نوع العميل
          if (typeof toggleCompanyFields === 'function') {
            toggleCompanyFields();
          }
        }
        })
        .catch(error => {
        hideLoading();
        showAlert('فشل في تحميل بيانات العميل: ' + error.message, 'danger');
          console.error('خطأ في جلب بيانات العميل:', error);
      });
    }
    
    // عرض النافذة المنبثقة باستخدام الدالة المساعدة
    if (isBootstrapAvailable()) {
      try {
        const modal = createAndShowModal(modalElement);
        if (modal) {
          modal.show();
        } else {
          showAlert('فشل في إنشاء نافذة العميل', 'danger');
    }
  } catch (error) {
        console.error('خطأ في إنشاء نافذة العميل:', error);
        showAlert('حدث خطأ أثناء إنشاء نافذة العميل', 'danger');
      }
    } else {
      showAlert('مكتبة Bootstrap غير متاحة، يرجى تحديث الصفحة', 'danger');
    }
  } catch (error) {
    console.error('خطأ غير متوقع أثناء فتح نافذة العميل:', error);
    showAlert('حدث خطأ غير متوقع: ' + error.message, 'danger');
  }
}

// حفظ الترخيص
function saveLicense() {
  try {
    console.log('حفظ بيانات الترخيص...');
    
    // التحقق من وجود رمز توثيق
    if (!authToken) {
      showAlert('يجب تسجيل الدخول أولاً', 'danger');
      return;
    }
    
    // التحقق من وجود نموذج الترخيص
    const licenseForm = document.getElementById('license-form');
    if (!licenseForm) {
      showAlert('لم يتم العثور على نموذج الترخيص', 'danger');
      return;
    }
    
    // التحقق من وجود حقول النموذج المطلوبة
    const licenseId = document.getElementById('license-id');
    const productSelect = document.getElementById('license-product');
    const customerSelect = document.getElementById('license-customer');
    const licenseTypeSelect = document.getElementById('license-type');
    const maxActivationsInput = document.getElementById('license-max-activations');
    const startDateInput = document.getElementById('license-start-date');
    const expiryDateInput = document.getElementById('license-expiry-date');
    const notesTextarea = document.getElementById('license-notes');
    
    // التحقق من وجود العناصر الأساسية
    if (!productSelect || !customerSelect || !licenseTypeSelect || !maxActivationsInput || !startDateInput) {
      showAlert('بعض عناصر النموذج الأساسية مفقودة', 'danger');
      return;
    }
    
    // التحقق من الحقول المطلوبة
    if (!productSelect.value) {
      showAlert('يرجى اختيار المنتج', 'warning');
      productSelect.focus();
      return;
    }
    
    if (!customerSelect.value) {
      showAlert('يرجى اختيار العميل', 'warning');
      customerSelect.focus();
      return;
    }
    
    if (!licenseTypeSelect.value) {
      showAlert('يرجى اختيار نوع الترخيص', 'warning');
      licenseTypeSelect.focus();
      return;
    }
    
    if (!startDateInput.value) {
      showAlert('يرجى تحديد تاريخ بدء الترخيص', 'warning');
      startDateInput.focus();
      return;
    }
    
    // التحقق من تاريخ الانتهاء لأنواع التراخيص غير الدائمة
    if (licenseTypeSelect.value !== 'perpetual' && !expiryDateInput.value) {
      showAlert('يرجى تحديد تاريخ انتهاء الترخيص', 'warning');
      expiryDateInput.focus();
      return;
    }
    
    // التحقق من وجود خيارات في القوائم المنسدلة
    const productOptions = productSelect.querySelectorAll('option');
    const customerOptions = customerSelect.querySelectorAll('option');
    
    if (productOptions.length <= 1) {
      showAlert('لا توجد منتجات متاحة. الرجاء إضافة منتج أولاً.', 'warning');
      return;
    }
    
    if (customerOptions.length <= 1) {
      showAlert('لا يوجد عملاء متاحين. الرجاء إضافة عميل أولاً.', 'warning');
      return;
    }
    
    // الحصول على بيانات العميل المحدد
    const selectedCustomerOption = customerSelect.options[customerSelect.selectedIndex];
    const customerName = selectedCustomerOption.textContent || '';
    
    // جلب بيانات العميل كاملة
    showLoading('جاري التحقق من بيانات العميل...');
    
    fetch(`/api/customers/${customerSelect.value}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    })
    .then(response => {
      if (!response.ok) {
        hideLoading();
        throw new Error('فشل في جلب بيانات العميل: ' + response.statusText);
      }
      return response.json();
    })
    .then(customerData => {
      hideLoading();
      
      if (!customerData || !customerData.customer) {
        throw new Error('لم يتم العثور على بيانات العميل');
      }
      
      const customer = customerData.customer;
      
      // التحقق من وجود البيانات الأساسية للعميل
      if (!customer.name || !customer.email) {
        throw new Error('بيانات العميل ناقصة. يرجى تحديث بيانات العميل أولاً.');
    }
    
    // جمع بيانات النموذج
    const licenseData = {
      productId: productSelect.value,
      customerId: customerSelect.value,
      type: licenseTypeSelect.value,
      maxActivations: parseInt(maxActivationsInput.value) || 1,
      startDate: startDateInput.value,
        notes: notesTextarea ? notesTextarea.value : '',
        // إضافة بيانات العميل المطلوبة
        customerName: customer.name,
        customerEmail: customer.email
    };
    
    // إضافة تاريخ الانتهاء للتراخيص غير الدائمة
    if (licenseTypeSelect.value !== 'perpetual' && expiryDateInput && expiryDateInput.value) {
      licenseData.expiryDate = expiryDateInput.value;
    }
    
    // إضافة معرف الترخيص في حالة التعديل
    if (licenseId && licenseId.value) {
      licenseData.id = licenseId.value;
    }
    
    // تعطيل زر الحفظ وإظهار مؤشر التحميل
    const saveButton = document.querySelector('#license-modal .modal-footer .btn-primary');
      let originalText = 'حفظ'; // تعريف قيمة افتراضية للنص الأصلي
      
    if (saveButton) {
        originalText = saveButton.innerHTML; // تخزين النص الأصلي
      saveButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> جاري الحفظ...';
      saveButton.disabled = true;
    }
    
    // إرسال البيانات إلى الخادم
    const url = licenseData.id ? `/api/licenses/${licenseData.id}` : '/api/licenses';
    const method = licenseData.id ? 'PUT' : 'POST';
    
      console.log('إرسال بيانات الترخيص:', licenseData);
      
      return fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(licenseData)
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(errorData => {
          throw new Error(errorData.message || `فشل حفظ الترخيص: ${response.statusText}`);
        });
      }
      return response.json();
    })
    .then(data => {
      // إغلاق النافذة المنبثقة
      const licenseModal = bootstrap.Modal.getInstance(document.getElementById('license-modal'));
      if (licenseModal) {
        licenseModal.hide();
        }
        
        // عرض رسالة نجاح
      showAlert(`تم ${licenseData.id ? 'تحديث' : 'إضافة'} الترخيص بنجاح`, 'success');
      
      // تحديث قائمة التراخيص
      if (typeof loadLicensesData === 'function') {
        loadLicensesData();
      }
      
      // تحديث البيانات على لوحة التحكم
      if (typeof loadDashboardData === 'function') {
        loadDashboardData();
      }
    })
    .catch(error => {
      console.error('خطأ في حفظ الترخيص:', error);
      showAlert('حدث خطأ: ' + error.message, 'danger');
      
      // إعادة زر الحفظ إلى حالته الأصلية
      if (saveButton) {
          saveButton.innerHTML = originalText; // استخدام المتغير المحفوظ مسبقًا
        saveButton.disabled = false;
      }
      });
    })
    .catch(error => {
      hideLoading();
      console.error('خطأ في جلب بيانات العميل:', error);
      showAlert('حدث خطأ: ' + error.message, 'danger');
    });
  } catch (error) {
    console.error('خطأ غير متوقع أثناء حفظ الترخيص:', error);
    showAlert('حدث خطأ غير متوقع: ' + error.message, 'danger');
  }
}

// عرض نموذج إضافة/تعديل منتج
function showProductModal(productId) {
  console.log('فتح نموذج المنتج:', productId);
  
  try {
    // التحقق من وجود نموذج المنتج
    const productForm = document.getElementById('product-form');
    const productModal = document.getElementById('product-modal');
    
    // التحقق من وجود العناصر الأساسية
    if (!productModal) {
      console.error('لم يتم العثور على نافذة المنتج (product-modal)');
      showAlert('خطأ: نافذة المنتج غير موجودة', 'danger');
      return;
    }
    
    if (!productForm) {
      console.error('لم يتم العثور على نموذج المنتج (product-form)');
      showAlert('خطأ: نموذج المنتج غير موجود', 'danger');
      return;
    }
    
    // الحصول على مراجع العناصر الرئيسية
    const modalTitle = document.getElementById('product-modal-title');
    const productIdField = document.getElementById('product-id');
    const saveButton = document.querySelector('#product-modal .modal-footer .btn-primary');
    
    // التحقق من العناصر الإضافية المهمة
    if (!modalTitle) {
      console.warn('لم يتم العثور على عنوان النافذة (product-modal-title)');
    }
    
    if (!productIdField) {
      console.warn('لم يتم العثور على حقل معرف المنتج (product-id)');
    }
    
    if (!saveButton) {
      console.warn('لم يتم العثور على زر الحفظ');
    }
    
    // إعادة تعيين النموذج
    productForm.reset();
    
    // تعيين العنوان وقيمة معرّف المنتج
    if (modalTitle) {
      modalTitle.textContent = productId ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد';
    }
    
    if (productIdField) {
      productIdField.value = productId || '';
    }
    
    // تغيير نص زر الحفظ حسب الحالة
    if (saveButton) {
      saveButton.textContent = productId ? 'تحديث' : 'إضافة';
    }
    
    // إذا كان هناك معرّف منتج، نقوم بجلب بيانات المنتج من الخادم
    if (productId) {
      // التحقق من وجود العناصر اللازمة قبل إظهار مؤشر التحميل
      // محاولة البحث عن محتوى النموذج بعدة طرق مختلفة (لأن هيكل النموذج قد يختلف)
      let formContent = document.querySelector('#product-form .modal-body');
      
      if (!formContent) {
        // محاولة أخرى - قد يكون .modal-body موجودًا في نفس المستوى مع النموذج
        formContent = document.querySelector('#product-modal .modal-body');
      }
      
      if (!formContent) {
        // محاولة أخيرة - البحث عن أي .modal-body داخل الصفحة
        formContent = document.querySelector('.modal-body');
      }
      
      if (!formContent) {
        console.error('لم يتم العثور على محتوى النموذج (.modal-body)');
        console.log('استخدام نموذج المنتج كبديل لمحتوى النموذج');
        // استخدام نموذج المنتج نفسه كبديل إذا لم يتم العثور على محتوى النموذج
        formContent = productForm;
      }
      
      // حفظ العنوان الأصلي واستخدام مؤشر التحميل
      const originalTitle = modalTitle ? modalTitle.textContent : '';
      
      if (modalTitle) {
        modalTitle.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> جاري التحميل...';
      }
      
      // تطبيق تأثير بصري لإظهار مؤشر التحميل
      if (formContent) {
        formContent.style.opacity = '0.5';
      }
      
      // التحقق من وجود رمز التوثيق
      if (!authToken) {
        console.error('رمز التوثيق غير موجود');
        showAlert('يجب تسجيل الدخول أولاً', 'warning');
        
        // إعادة العناصر إلى حالتها الطبيعية
        if (modalTitle) modalTitle.textContent = originalTitle;
        if (formContent) formContent.style.opacity = '1';
        return;
      }
        
        // جلب بيانات المنتج من الخادم
        fetch(`/api/products/${productId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        })
        .then(response => {
          if (!response.ok) {
            throw new Error('فشل جلب بيانات المنتج: ' + response.statusText);
          }
          return response.json();
        })
      .then(data => {
        console.log('تم جلب بيانات المنتج:', data);
        
        // التأكد من الحصول على بيانات المنتج بشكل صحيح (يمكن أن تكون في أشكال مختلفة حسب تصميم API)
        // قد تكون البيانات موجودة في data.product أو في الكائن data نفسه
        const product = data.product || data;
        
        // طباعة كائن المنتج بالكامل للفحص
        console.log('هيكل بيانات المنتج المستخرجة:', product);
        
        if (!product || (typeof product === 'object' && Object.keys(product).length === 0)) {
          throw new Error('تم استلام بيانات المنتج بتنسيق غير صالح أو فارغة');
        }
        
        // التحقق من حقول النموذج قبل ملؤها
          const productNameField = document.getElementById('product-name');
          const productCodeField = document.getElementById('product-code');
          const productDescriptionField = document.getElementById('product-description');
          const productPriceField = document.getElementById('product-price');
          const productCategoryField = document.getElementById('product-category');
          
        // التحقق من وجود الحقول الأساسية
        if (!productNameField || !productCodeField) {
          console.error('لم يتم العثور على حقول المنتج الأساسية');
          throw new Error('حقول المنتج الأساسية غير موجودة');
        }
        
        // طباعة قيم المنتج التي سيتم تعبئتها
        console.log('القيم التي سيتم تعبئتها:', {
          name: product.name,
          code: product.code,
          description: product.description,
          price: product.price,
          category: product.category
        });
        
        // ملء حقول النموذج ببيانات المنتج
        productNameField.value = product.name || '';
        productCodeField.value = product.code || '';
        
          if (productDescriptionField) productDescriptionField.value = product.description || '';
          if (productPriceField) productPriceField.value = product.price || '';
          if (productCategoryField) productCategoryField.value = product.category || '';
          
          // إعادة العناصر إلى حالتها الطبيعية
          if (modalTitle) modalTitle.textContent = originalTitle;
          if (formContent) formContent.style.opacity = '1';
        })
        .catch(error => {
          console.error('خطأ في جلب بيانات المنتج:', error);
        showAlert('فشل في تحميل بيانات المنتج: ' + error.message, 'danger');
          
        // إعادة العناصر إلى حالتها الطبيعية
          if (modalTitle) modalTitle.textContent = originalTitle;
          if (formContent) formContent.style.opacity = '1';
      });
    }
    
    // إنشاء وعرض النموذج باستخدام Bootstrap
    if (isBootstrapAvailable()) {
      try {
      const modal = new bootstrap.Modal(productModal);
      modal.show();
      } catch (error) {
        console.error('خطأ في عرض نافذة المنتج:', error);
        showAlert('حدث خطأ أثناء عرض نافذة المنتج: ' + error.message, 'danger');
      }
    } else {
      console.error('مكتبة Bootstrap غير متاحة');
      showAlert('مكتبة Bootstrap غير متاحة، يرجى تحديث الصفحة', 'danger');
    }
  } catch (error) {
    console.error('خطأ في فتح نموذج المنتج:', error);
    showAlert('حدث خطأ غير متوقع أثناء فتح نموذج المنتج: ' + error.message, 'danger');
  }
}

// حفظ بيانات المنتج
function saveProduct() {
  try {
    // التحقق من وجود رمز توثيق
    if (!authToken) {
      alert('يجب تسجيل الدخول أولاً');
      return;
    }

    // التحقق من وجود عناصر النموذج المطلوبة
    const productNameInput = document.getElementById('product-name');
    const productCodeInput = document.getElementById('product-code');
    const productDescriptionInput = document.getElementById('product-description');
    const productPriceInput = document.getElementById('product-price');
    const productCategoryInput = document.getElementById('product-category');
    const productIdInput = document.getElementById('product-id');
    
    // التحقق من وجود العناصر الأساسية
    if (!productNameInput || !productCodeInput) {
      console.error('لم يتم العثور على عناصر النموذج الأساسية');
      alert('حدث خطأ: عناصر النموذج الأساسية مفقودة');
      return;
    }

    // جمع بيانات النموذج
    const productData = {
      name: productNameInput.value,
      productCode: productCodeInput.value, // تغيير من code إلى productCode
      description: productDescriptionInput ? productDescriptionInput.value : '',
      price: productPriceInput ? parseFloat(productPriceInput.value) : 0,
      category: productCategoryInput ? productCategoryInput.value : ''
    };

    // التحقق من الحقول المطلوبة
    if (!productData.name) {
      alert('يرجى إدخال اسم المنتج');
      return;
    }
    
    if (!productData.productCode) { // تغيير من code إلى productCode
      alert('يرجى إدخال رمز المنتج');
      return;
    }

    if (!productData.description) { // إضافة التحقق من وصف المنتج كونه مطلوباً
      alert('يرجى إدخال وصف المنتج');
      return;
    }

    // إضافة مؤشر التحميل
    const submitButton = document.querySelector('#product-modal .modal-footer .btn-primary');
    if (!submitButton) {
      console.error('لم يتم العثور على زر الحفظ');
      alert('حدث خطأ: لم يتم العثور على زر الحفظ');
      return;
    }
    
    const originalButtonText = submitButton.innerHTML;
    submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> جاري الحفظ...';
    submitButton.disabled = true;

    // تحديد ما إذا كانت عملية إضافة أو تحديث
    const productId = productIdInput ? productIdInput.value : '';
    const method = productId ? 'PUT' : 'POST';
    const url = productId ? `/api/products/${productId}` : '/api/products';

    // إرسال البيانات إلى الخادم
    fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(productData)
    })
    .then(response => {
      if (!response.ok) {
        if (response.status === 401) {
          alert('غير مصرح: الرجاء إعادة تسجيل الدخول');
          // إعادة التوجيه إلى صفحة تسجيل الدخول
          const productModal = document.getElementById('product-modal');
          const loginSection = document.getElementById('login-section');
          
          if (productModal) {
            const modalInstance = bootstrap.Modal.getInstance(productModal);
            if (modalInstance) modalInstance.hide();
          }
          
          if (loginSection) loginSection.classList.remove('d-none');
          
          localStorage.removeItem('authToken');
          authToken = null;
          return;
        }
        throw new Error('فشل حفظ بيانات المنتج: ' + response.statusText);
      }
      return response.json();
    })
    .then(data => {
      if (data) {
        console.log('تم حفظ بيانات المنتج بنجاح:', data);
        
        // إغلاق النموذج
        const modal = document.getElementById('product-modal');
        if (modal) {
          const modalInstance = bootstrap.Modal.getInstance(modal);
          if (modalInstance) modalInstance.hide();
        }
        
        // تحديث البيانات
        loadProductsData();
        
        // عرض رسالة نجاح
        if (productId) {
          alert('تم تحديث بيانات المنتج بنجاح');
        } else {
          alert('تم إضافة المنتج بنجاح');
        }
      }
    })
    .catch(error => {
      console.error('خطأ في حفظ بيانات المنتج:', error);
      alert('حدث خطأ: ' + error.message);
    })
    .finally(() => {
      // إعادة زر الحفظ إلى حالته الأصلية
      if (submitButton) {
        submitButton.innerHTML = originalButtonText;
        submitButton.disabled = false;
      }
    });
  } catch (error) {
    console.error('خطأ غير متوقع أثناء حفظ بيانات المنتج:', error);
    alert('حدث خطأ غير متوقع: ' + error.message);
  }
}

// إعداد أزرار التراخيص والمنتجات والعملاء
function setupButtons() {
  console.log('إعداد أزرار التراخيص والمنتجات والعملاء والنماذج...');
  
  // وظيفة مساعدة لإضافة معالج النقر
  function addClickHandler(selector, callback) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      // تحقق إذا كان العنصر موجود
      if (element) {
        console.log(`تم العثور على العنصر: ${selector}`);
        
        // إزالة المستمعين السابقين لتجنب التكرار
        const newElement = element.cloneNode(true);
        element.parentNode.replaceChild(newElement, element);
        
        // إضافة المستمع الجديد
        newElement.addEventListener('click', function(e) {
          e.preventDefault();
          console.log(`تم النقر على: ${selector}`);
          callback();
        });
      } else {
        console.warn(`لم يتم العثور على العنصر: ${selector}`);
      }
    });
  }
  
  // إعداد أزرار إضافة التراخيص
  addClickHandler('#add-license-btn', () => showLicenseModal());
  addClickHandler('#add-license-btn2', () => showLicenseModal());
  
  // إعداد أزرار إضافة العملاء
  addClickHandler('#add-customer-btn', () => showCustomerModal());
  
  // إعداد أزرار إضافة المنتجات
  addClickHandler('#add-product-btn', () => showProductModal());
  
  // إعداد أزرار الإرسال
  const licenseForm = document.getElementById('license-form');
  if (licenseForm) {
    licenseForm.addEventListener('submit', function(e) {
      e.preventDefault();
      saveLicense();
    });
  }
  
  const customerForm = document.getElementById('customer-form');
  if (customerForm) {
    customerForm.addEventListener('submit', function(e) {
      e.preventDefault();
      saveCustomer();
    });
  }
  
  const productForm = document.getElementById('product-form');
  if (productForm) {
    productForm.addEventListener('submit', function(e) {
      e.preventDefault();
      saveProduct();
    });
  }
  
  // إعداد أحداث تغيير النماذج
  const licenseTypeSelect = document.getElementById('license-type');
  if (licenseTypeSelect) {
    licenseTypeSelect.addEventListener('change', toggleExpiryDateVisibility);
  }
  
  const customerTypeSelect = document.getElementById('customer-type');
  if (customerTypeSelect) {
    customerTypeSelect.addEventListener('change', toggleCompanyFields);
  }
}

// عندما يتم تحميل الصفحة بالكامل
document.addEventListener('DOMContentLoaded', function() {
  // إعداد الأزرار ومستمعي الأحداث
  setupButtons();
});

// تحميل بيانات العملاء
function loadCustomersData() {
  console.log('تحميل بيانات العملاء...');
  
  // عرض مؤشر التحميل
  document.getElementById('customers-table').innerHTML = '<tr><td colspan="6" class="text-center">جاري تحميل البيانات...</td></tr>';
  
  // إنشاء معايير البحث
  let queryParams = new URLSearchParams();
  if (customerSearchQuery) queryParams.append('search', customerSearchQuery);
  queryParams.append('page', customersPage);
  queryParams.append('limit', customersLimit);
  
  // إضافة مؤشر التحميل
  const tableContainer = document.querySelector('#customers-table-container');
  if (tableContainer) tableContainer.classList.add('loading-state');
  
  // جلب البيانات من الخادم
  fetch(`/api/customers?${queryParams.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    }
  })
  .then(response => {
    if (!response.ok) {
      // التحقق من نوع الخطأ
      if (response.status === 401) {
        document.getElementById('customers-section').classList.add('d-none');
        document.getElementById('login-section').classList.remove('d-none');
        localStorage.removeItem('token');
        authToken = null;
        throw new Error('غير مصرح: الرجاء إعادة تسجيل الدخول');
      }
      throw new Error('فشل جلب بيانات العملاء: ' + response.statusText);
    }
    return response.json();
  })
  .then(data => {
    console.log('تم استلام بيانات العملاء:', data);
    
    // تحديث المتغيرات العامة
    customers = data.customers || [];
    customersTotalCount = data.total || 0;
    customersTotalPages = Math.ceil(customersTotalCount / customersLimit);
    
    // تحديث معلومات الترقيم
    document.getElementById('customers-count').textContent = customersTotalCount;
    document.getElementById('customers-page').textContent = customersPage;
    document.getElementById('prev-customers-page').disabled = customersPage <= 1;
    document.getElementById('next-customers-page').disabled = customersPage >= customersTotalPages;
    
    // عرض العملاء في الجدول
    renderCustomersTable(customers);
    
    // إزالة مؤشر التحميل
    if (tableContainer) tableContainer.classList.remove('loading-state');
  })
  .catch(error => {
    console.error('خطأ في جلب بيانات العملاء:', error);
    
    // عرض رسالة الخطأ في الجدول
    document.getElementById('customers-table').innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-danger">
          <i class="bi bi-exclamation-triangle me-2"></i>
          حدث خطأ أثناء تحميل البيانات: ${error.message}
        </td>
      </tr>
    `;
    
    // إزالة مؤشر التحميل
    if (tableContainer) tableContainer.classList.remove('loading-state');
  });
}

// عرض بيانات العملاء في الجدول
function renderCustomersTable(customers) {
  // التحقق من وجود جدول العملاء
  const customersTable = document.getElementById('customers-table');
  if (!customersTable) {
    console.error('لم يتم العثور على جدول العملاء');
    return;
  }
  
  // إذا لم تكن هناك عملاء، اعرض رسالة
  if (!customers || customers.length === 0) {
    customersTable.innerHTML = '<tr><td colspan="6" class="text-center">لا توجد بيانات للعرض</td></tr>';
    return;
  }
  
  // إنشاء صفوف الجدول
  let tableRows = '';
  customers.forEach((customer, index) => {
    tableRows += `
      <tr>
        <td>${(customersPage - 1) * customersLimit + index + 1}</td>
        <td>${customer.name || 'غير محدد'}</td>
        <td>${customer.email || 'غير محدد'}</td>
        <td>${customer.phone || 'غير محدد'}</td>
        <td>${customer.company || 'غير محدد'}</td>
        <td>
          <div class="btn-group btn-group-sm">
            <button type="button" class="btn btn-info" onclick="viewCustomer('${customer._id}')">
              <i class="bi bi-eye"></i>
            </button>
            <button type="button" class="btn btn-primary" onclick="showCustomerModal('${customer._id}')">
              <i class="bi bi-pencil"></i>
            </button>
            <button type="button" class="btn btn-danger" onclick="confirmDeleteCustomer('${customer._id}', '${customer.name || 'عميل غير معروف'}')">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  });
  
  // تحديث الجدول
  customersTable.innerHTML = tableRows;
}

// عرض تفاصيل العميل
function viewCustomer(customerId) {
  console.log('عرض تفاصيل العميل:', customerId);
  
  try {
    // التحقق من وجود معرف العميل
    if (!customerId) {
      showAlert('خطأ: معرف العميل غير صالح', 'danger');
      return;
    }
    
    // التحقق من وجود رمز التوثيق
    if (!authToken) {
      showAlert('يجب تسجيل الدخول أولاً لعرض تفاصيل العميل', 'danger');
      return;
    }
    
    // التحقق من وجود عنصر لعرض التنبيهات
    const alertPlaceholder = document.getElementById('alert-placeholder');
    if (!alertPlaceholder) {
      console.warn('لم يتم العثور على عنصر عرض التنبيهات');
    }
    
    // عرض مؤشر التحميل
    showLoading('جاري تحميل بيانات العميل...');
    
    // جلب تفاصيل العميل من الخادم
    fetch(`/api/customers/${customerId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    })
    .then(response => {
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('غير مصرح لك بالوصول. الرجاء إعادة تسجيل الدخول.');
        }
        throw new Error('فشل في جلب بيانات العميل: ' + response.statusText);
      }
      return response.json();
    })
    .then(data => {
      hideLoading();
      
      // تحضير البيانات للعرض
      const customer = data.customer;
      if (!customer) {
        throw new Error('لم يتم العثور على بيانات العميل');
      }
      
      // إزالة النافذة القديمة إن وجدت
      const existingModal = document.getElementById('viewCustomerModal');
      if (existingModal) {
        // محاولة إزالة النافذة باستخدام Bootstrap إذا كانت موجودة
        try {
          const oldModal = bootstrap.Modal.getInstance(existingModal);
          if (oldModal) {
            oldModal.dispose();
          }
        } catch (error) {
          console.warn('تعذر التخلص من نافذة العميل السابقة:', error);
        }
        existingModal.remove();
      }
      
      // إنشاء نافذة منبثقة لعرض التفاصيل
      const modalHtml = `
        <div class="modal fade" id="viewCustomerModal" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">
          <div class="modal-dialog modal-lg">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">تفاصيل العميل: ${customer.name || 'غير معروف'}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="إغلاق"></button>
              </div>
              <div class="modal-body">
                <div class="row">
                  <div class="col-md-6">
                    <div class="mb-3">
                      <label class="fw-bold">الاسم:</label>
                      <div>${customer.name || 'غير محدد'}</div>
                    </div>
                    <div class="mb-3">
                      <label class="fw-bold">البريد الإلكتروني:</label>
                      <div>${customer.email || 'غير محدد'}</div>
                    </div>
                    <div class="mb-3">
                      <label class="fw-bold">رقم الهاتف:</label>
                      <div>${customer.phone || 'غير محدد'}</div>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="mb-3">
                      <label class="fw-bold">الشركة:</label>
                      <div>${customer.companyName || customer.company || 'غير محدد'}</div>
                    </div>
                    <div class="mb-3">
                      <label class="fw-bold">العنوان:</label>
                      <div>${customer.address ? (typeof customer.address === 'object' ? JSON.stringify(customer.address) : customer.address) : 'غير محدد'}</div>
                    </div>
                    <div class="mb-3">
                      <label class="fw-bold">الحالة:</label>
                      <div><span class="badge ${customer.status === 'active' ? 'bg-success' : (customer.status === 'inactive' ? 'bg-warning' : 'bg-secondary')}">${getCustomerStatusText(customer.status)}</span></div>
                    </div>
                  </div>
                </div>
                
                <hr>
                
                <div class="mb-3">
                  <label class="fw-bold">ملاحظات:</label>
                  <div>${customer.notes || 'لا توجد ملاحظات'}</div>
                </div>
                
                <div class="mb-3">
                  <label class="fw-bold">تاريخ الإنشاء:</label>
                  <div>${customer.createdAt ? new Date(customer.createdAt).toLocaleString('ar-SA') : 'غير معروف'}</div>
                </div>
                
                <div class="mb-3">
                  <label class="fw-bold">آخر تحديث:</label>
                  <div>${customer.updatedAt ? new Date(customer.updatedAt).toLocaleString('ar-SA') : 'غير معروف'}</div>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إغلاق</button>
                <button type="button" class="btn btn-primary" onclick="showCustomerModal('${customer._id}')">تعديل</button>
              </div>
            </div>
          </div>
        </div>
      `;
      
      // إضافة النافذة إلى DOM مباشرة في body
      document.body.insertAdjacentHTML('beforeend', modalHtml);
      
      // عرض النافذة بعد إضافتها للصفحة
      const viewCustomerModal = document.getElementById('viewCustomerModal');
      if (!viewCustomerModal) {
        throw new Error('فشل في إنشاء نافذة العرض: لم يتم العثور على العنصر بعد إضافته');
      }
      
      // التحقق من توفر مكتبة Bootstrap
      if (!isBootstrapAvailable()) {
        throw new Error('مكتبة Bootstrap غير متاحة');
      }
      
      // إنشاء وعرض النافذة المنبثقة
      setTimeout(() => {
        try {
          const modal = new bootstrap.Modal(viewCustomerModal, {
            backdrop: 'static',
            keyboard: true,
            focus: true
          });
          
              modal.show();
              
              // إزالة النافذة من DOM عند إغلاقها
              viewCustomerModal.addEventListener('hidden.bs.modal', function() {
                this.remove();
              });
          } catch (error) {
            console.error('خطأ في إنشاء النافذة المنبثقة:', error);
            showAlert('حدث خطأ أثناء إنشاء النافذة المنبثقة: ' + error.message, 'danger');
          
          // محاولة الإصلاح بالإزالة وإعادة الإضافة
          viewCustomerModal.remove();
          showAlert('تم إلغاء نافذة العرض بسبب خطأ فني. يرجى المحاولة مرة أخرى.', 'warning');
        }
      }, 100); // تأخير بسيط للتأكد من أن العنصر تم إضافته بالكامل
    })
    .catch(error => {
      hideLoading();
      showAlert('حدث خطأ: ' + error.message, 'danger');
      console.error('خطأ في عرض تفاصيل العميل:', error);
    });
  } catch (error) {
    console.error('خطأ غير متوقع أثناء عرض تفاصيل العميل:', error);
    showAlert('حدث خطأ غير متوقع: ' + error.message, 'danger');
    hideLoading();
  }
}

// تأكيد حذف العميل
function confirmDeleteCustomer(customerId, customerName) {
  console.log('تأكيد حذف العميل:', customerId, customerName);
  
  try {
    // التحقق من وجود معرف العميل
    if (!customerId) {
      showAlert('خطأ: معرف العميل غير صالح', 'danger');
      return;
    }
    
    // التحقق من وجود رمز التوثيق
    if (!authToken) {
      showAlert('يجب تسجيل الدخول أولاً لحذف العميل', 'danger');
      return;
    }
    
    // إزالة النافذة القديمة إن وجدت
    const existingModal = document.getElementById('deleteCustomerModal');
    if (existingModal) {
      // محاولة إزالة النافذة باستخدام Bootstrap إذا كانت موجودة
      try {
        const oldModal = bootstrap.Modal.getInstance(existingModal);
        if (oldModal) {
          oldModal.dispose();
        }
      } catch (error) {
        console.warn('تعذر التخلص من نافذة تأكيد الحذف السابقة:', error);
      }
      existingModal.remove();
    }
    
    // تحضير اسم العميل للعرض (استخدام قيمة افتراضية إذا لم يتم توفيرها)
    const displayName = customerName || 'عميل غير معروف';

    // إنشاء نافذة تأكيد الحذف
    const modalHtml = `
      <div class="modal fade" id="deleteCustomerModal" tabindex="-1" aria-labelledby="deleteCustomerModalLabel" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header bg-danger text-white">
              <h5 class="modal-title" id="deleteCustomerModalLabel">تأكيد حذف العميل</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="إغلاق"></button>
            </div>
            <div class="modal-body">
              <div class="alert alert-warning">
                <i class="bi bi-exclamation-triangle me-2"></i>
                <strong>تحذير:</strong> هذا الإجراء لا يمكن التراجع عنه!
              </div>
              <p>هل أنت متأكد من رغبتك في حذف العميل:</p>
              <p class="fw-bold">${displayName}</p>
              <p>سيتم حذف جميع بيانات هذا العميل بشكل نهائي، بما في ذلك جميع التراخيص المرتبطة به.</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إلغاء</button>
              <button type="button" class="btn btn-danger" onclick="deleteCustomer('${customerId}')">
                <i class="bi bi-trash me-1"></i> تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // إضافة النافذة إلى DOM مباشرة في body
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // عرض النافذة بعد إضافتها للصفحة
    const deleteCustomerModal = document.getElementById('deleteCustomerModal');
    if (!deleteCustomerModal) {
      throw new Error('فشل في إنشاء نافذة تأكيد الحذف: لم يتم العثور على العنصر بعد إضافته');
    }
    
    // التحقق من توفر مكتبة Bootstrap
    if (!isBootstrapAvailable()) {
      throw new Error('مكتبة Bootstrap غير متاحة');
    }
    
    // إنشاء وعرض النافذة المنبثقة مع تأخير بسيط
    setTimeout(() => {
      try {
        const modal = new bootstrap.Modal(deleteCustomerModal);
            modal.show();
            
            // إزالة النافذة من DOM عند إغلاقها
        deleteCustomerModal.addEventListener('hidden.bs.modal', function() {
              this.remove();
            });
        } catch (error) {
        console.error('خطأ في إنشاء نافذة تأكيد الحذف:', error);
        showAlert('حدث خطأ أثناء إنشاء نافذة تأكيد الحذف: ' + error.message, 'danger');
        
        // محاولة الإصلاح بالإزالة
        if (deleteCustomerModal) {
          deleteCustomerModal.remove();
        }
      }
    }, 100); // تأخير بسيط للتأكد من أن العنصر تم إضافته بالكامل
  } catch (error) {
    console.error('خطأ غير متوقع أثناء تأكيد حذف العميل:', error);
    showAlert('حدث خطأ غير متوقع: ' + error.message, 'danger');
  }
}

// حذف العميل
function deleteCustomer(customerId) {
  console.log('حذف العميل:', customerId);
  
  // التحقق من وجود معرف العميل
  if (!customerId) {
    showAlert('خطأ: معرف العميل غير صالح', 'danger');
    return;
  }
  
  // إغلاق نافذة التأكيد إن وجدت
  const deleteModal = bootstrap.Modal.getInstance(document.getElementById('deleteCustomerModal'));
  if (deleteModal) {
    deleteModal.hide();
  }
  
  // عرض مؤشر التحميل
  showLoading('جاري حذف العميل...');
  
  // إرسال طلب الحذف إلى الخادم
  fetch(`/api/customers/${customerId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    }
  })
  .then(response => {
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('غير مصرح لك بالوصول. الرجاء إعادة تسجيل الدخول.');
      }
      return response.json().then(err => {
        throw new Error(err.message || 'فشل في حذف العميل: ' + response.statusText);
      });
    }
    return response.json();
  })
  .then(data => {
    hideLoading();
    showAlert('تم حذف العميل بنجاح', 'success');
    
    // تحديث قائمة العملاء
    loadCustomersData();
  })
  .catch(error => {
    hideLoading();
    showAlert('حدث خطأ: ' + error.message, 'danger');
    console.error('خطأ في حذف العميل:', error);
  });
}

// دالة لعرض رسالة تنبيه
function showAlert(message, type = 'info') {
  console.log(`عرض تنبيه: ${message} (النوع: ${type})`);
  
  const alertPlaceholder = document.getElementById('alert-placeholder');
  if (!alertPlaceholder) {
    console.warn('لم يتم العثور على عنصر لعرض التنبيه');
    alert(message);
    return;
  }
  
  // إزالة التنبيهات السابقة من نفس النوع
  alertPlaceholder.querySelectorAll(`.alert-${type}`).forEach(oldAlert => {
    try {
      const alert = bootstrap.Alert.getInstance(oldAlert);
      if (alert) {
        alert.close();
      } else {
        oldAlert.remove();
      }
    } catch (e) {
      oldAlert.remove();
    }
  });
  
  const wrapper = document.createElement('div');
  wrapper.className = 'alert-wrapper my-2';
  wrapper.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="إغلاق"></button>
    </div>
  `;
  
  // إضافة التنبيه في بداية الحاوية
  alertPlaceholder.prepend(wrapper);
  
  // التأكد من ظهور التنبيه في منطقة العرض
  window.scrollTo({
    top: alertPlaceholder.offsetTop - 10,
    behavior: 'smooth'
  });
  
  // إزالة التنبيه تلقائيًا بعد 5 ثوانٍ
  setTimeout(() => {
    try {
      const alertElement = wrapper.querySelector('.alert');
      if (alertElement) {
        const bsAlert = bootstrap.Alert.getInstance(alertElement);
        if (bsAlert) {
          bsAlert.close();
    } else {
          wrapper.remove();
        }
      } else {
        wrapper.remove();
      }
    } catch (e) {
      console.warn('خطأ عند إزالة التنبيه:', e);
      wrapper.remove();
    }
  }, 5000);
}

// دالة لعرض مؤشر التحميل
function showLoading(message = 'جاري التحميل...') {
  let loadingOverlay = document.getElementById('loading-overlay');
  
  if (!loadingOverlay) {
    loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'loading-overlay';
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.innerHTML = `
      <div class="loading-spinner">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">جاري التحميل...</span>
        </div>
        <div class="loading-message mt-2">${message}</div>
      </div>
    `;
    document.body.appendChild(loadingOverlay);
  } else {
    loadingOverlay.querySelector('.loading-message').textContent = message;
    loadingOverlay.style.display = 'flex';
  }
}

// دالة لإخفاء مؤشر التحميل
function hideLoading() {
  const loadingOverlay = document.getElementById('loading-overlay');
  if (loadingOverlay) {
    loadingOverlay.style.display = 'none';
  }
}

// دالة لعرض حالة العميل بالنص
function getCustomerStatusText(status) {
  switch (status) {
    case 'active': return 'نشط';
    case 'inactive': return 'غير نشط';
    case 'pending': return 'قيد الانتظار';
    default: return status || 'نشط';
  }
}

// إخفاء/إظهار حقل تاريخ الانتهاء بناءً على نوع الترخيص
function toggleExpiryDateVisibility() {
  const licenseType = document.getElementById('license-type');
  const expiryDateGroup = document.getElementById('license-expiry-date-group');
  
  if (!licenseType || !expiryDateGroup) {
    console.warn('عناصر نوع الترخيص أو مجموعة تاريخ الانتهاء غير موجودة');
    return;
  }
  
  // إخفاء أو إظهار حقل تاريخ الانتهاء حسب نوع الترخيص
  if (licenseType.value === 'perpetual') {
    // ترخيص دائم - إخفاء حقل تاريخ الانتهاء
    expiryDateGroup.style.display = 'none';
  } else {
    // ترخيص اشتراك - إظهار حقل تاريخ الانتهاء
    expiryDateGroup.style.display = 'block';
  }
}

function setupLicenseButtons() {
  console.log('تهيئة أزرار إدارة التراخيص');
  
  // زر إضافة ترخيص جديد
  const addLicenseBtn = document.getElementById('add-license-btn');
  if (addLicenseBtn) {
    addLicenseBtn.addEventListener('click', function() {
      showLicenseModal();
    });
  }
  
  // زر تصفية التراخيص
  const filterLicensesBtn = document.getElementById('filter-licenses-btn');
  if (filterLicensesBtn) {
    filterLicensesBtn.addEventListener('click', function() {
      const productFilter = document.getElementById('product-filter');
      const statusFilter = document.getElementById('status-filter');
      
      // تحديث عرض التراخيص مع المرشحات
      loadLicensesData({
        productId: productFilter ? productFilter.value : '',
        status: statusFilter ? statusFilter.value : ''
      });
    });
  }
  
  // زر إعادة تعيين المرشحات
  const resetFiltersBtn = document.getElementById('reset-filters-btn');
  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', function() {
      const productFilter = document.getElementById('product-filter');
      const statusFilter = document.getElementById('status-filter');
      
      if (productFilter) productFilter.value = '';
      if (statusFilter) statusFilter.value = '';
      
      // إعادة تحميل جميع التراخيص
      loadLicensesData();
    });
  }
}

// تحميل المنتجات والعملاء لنموذج الترخيص
function loadProductsAndCustomersForLicense() {
  console.log('تحميل المنتجات والعملاء لنموذج الترخيص...');
  
  // التحقق من وجود رمز توثيق
  if (!authToken) {
    console.warn('لم يتم تحميل المنتجات والعملاء: لا يوجد رمز توثيق');
    return;
  }
  
  // تحميل المنتجات
  const productSelect = document.getElementById('license-product');
  if (productSelect) {
    productSelect.innerHTML = '<option value="">جاري تحميل المنتجات...</option>';
    productSelect.disabled = true;
    
    fetch('/api/products?limit=100', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    })
    .then(response => response.json())
    .then(data => {
      productSelect.innerHTML = '<option value="">-- اختر المنتج --</option>';
      
      const products = data.products || [];
      if (products.length === 0) {
        productSelect.innerHTML += '<option value="" disabled>لا توجد منتجات متاحة</option>';
      } else {
        products.forEach(product => {
          const option = document.createElement('option');
          option.value = product._id || product.id;
          option.textContent = `${product.name} (${product.code || 'بدون رمز'})`;
          productSelect.appendChild(option);
        });
      }
      
      // تفعيل القائمة المنسدلة
      productSelect.disabled = false;
    })
    .catch(error => {
      console.error('خطأ في تحميل المنتجات:', error);
      productSelect.innerHTML = '<option value="">-- خطأ في تحميل المنتجات --</option>';
      productSelect.disabled = false;
    });
  } else {
    console.warn('لم يتم العثور على قائمة المنتجات');
  }
  
  // تحميل العملاء
  const customerSelect = document.getElementById('license-customer');
  if (customerSelect) {
    customerSelect.innerHTML = '<option value="">جاري تحميل العملاء...</option>';
    customerSelect.disabled = true;
    
    fetch('/api/customers?limit=100', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    })
    .then(response => response.json())
    .then(data => {
      customerSelect.innerHTML = '<option value="">-- اختر العميل --</option>';
      
      const customers = data.customers || [];
      if (customers.length === 0) {
        customerSelect.innerHTML += '<option value="" disabled>لا يوجد عملاء متاحين</option>';
      } else {
        customers.forEach(customer => {
          const option = document.createElement('option');
          option.value = customer._id || customer.id;
          option.textContent = customer.name;
          customerSelect.appendChild(option);
        });
      }
      
      // تفعيل القائمة المنسدلة
      customerSelect.disabled = false;
    })
    .catch(error => {
      console.error('خطأ في تحميل العملاء:', error);
      customerSelect.innerHTML = '<option value="">-- خطأ في تحميل العملاء --</option>';
      customerSelect.disabled = false;
    });
  } else {
    console.warn('لم يتم العثور على قائمة العملاء');
  }
}

// دالة مساعدة للتحقق من وجود العناصر قبل استخدامها
function ensureElementExists(id, action = 'استخدام') {
  const element = document.getElementById(id);
  if (!element) {
    console.warn(`لم يتم العثور على العنصر "${id}" الذي يحاول البرنامج ${action}`);
    return null;
  }
  return element;
}

// تحميل بيانات المنتجات
function loadProductsData() {
  console.log('تحميل بيانات المنتجات...');
  
  // التحقق من وجود عنصر الجدول
  const productsTable = document.getElementById('products-table');
  if (!productsTable) {
    console.error('لم يتم العثور على جدول المنتجات');
    return;
  }
  
  // عرض مؤشر التحميل
  const tableContainer = document.querySelector('#products-table-container');
  if (tableContainer) {
    tableContainer.classList.add('loading-state');
  }
  
  // جلب بيانات المنتجات من الخادم
  fetch('/api/products', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    }
  })
  .then(response => {
    if (!response.ok) {
      // التحقق من نوع الخطأ
      if (response.status === 401) {
        // إعادة التوجيه إلى صفحة تسجيل الدخول
        const productsSection = document.getElementById('products-section');
        const loginSection = document.getElementById('login-section');
        
        if (productsSection) {
          productsSection.classList.add('d-none');
        }
        
        if (loginSection) {
          loginSection.classList.remove('d-none');
        }
        
        localStorage.removeItem('authToken');
        authToken = null;
        throw new Error('غير مصرح: الرجاء إعادة تسجيل الدخول');
      }
      throw new Error('فشل في جلب بيانات المنتجات: ' + response.statusText);
    }
    return response.json();
  })
  .then(data => {
    console.log('تم استلام بيانات المنتجات:', data);
    
    // عرض المنتجات في الجدول
    renderProductsTable(data.products || []);
    
    // إزالة مؤشر التحميل
    if (tableContainer) {
      tableContainer.classList.remove('loading-state');
    }
  })
  .catch(error => {
    console.error('خطأ في تحميل بيانات المنتجات:', error);
    
    // عرض رسالة الخطأ في الجدول
    if (productsTable) {
      productsTable.innerHTML = `
        <tr>
          <td colspan="6" class="text-center text-danger">
            <i class="bi bi-exclamation-triangle me-2"></i>
            حدث خطأ أثناء تحميل البيانات: ${error.message}
          </td>
        </tr>
      `;
    }
    
    // إزالة مؤشر التحميل
    if (tableContainer) {
      tableContainer.classList.remove('loading-state');
    }
  });
}

// عرض بيانات المنتجات في الجدول
function renderProductsTable(products) {
  const productsTable = document.getElementById('products-table');
  if (!productsTable) {
    console.error('لم يتم العثور على جدول المنتجات');
    return;
  }
  
  // تفريغ محتويات الجدول
  productsTable.innerHTML = '';
  
  // التحقق من وجود منتجات
  if (!products || products.length === 0) {
    productsTable.innerHTML = '<tr><td colspan="6" class="text-center">لا توجد منتجات</td></tr>';
    return;
  }
  
  // إنشاء صفوف المنتجات
  products.forEach((product, index) => {
    const tr = document.createElement('tr');
    
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${product.id || index + 1}</td>
      <td>${product.code || 'غير محدد'}</td>
      <td>${product.name || 'غير محدد'}</td>
      <td>${product.category || 'غير محدد'}</td>
      <td>${product.version || 'غير محدد'}</td>
      <td>${product.price || '0'}</td>
      <td>
        <div class="btn-group btn-group-sm">
          <button type="button" class="btn btn-info" onclick="viewProduct('${product._id || product.id}')">
            <i class="bi bi-eye"></i>
          </button>
          <button type="button" class="btn btn-primary" onclick="showProductModal('${product._id || product.id}')">
            <i class="bi bi-pencil"></i>
          </button>
          <button type="button" class="btn btn-danger" onclick="confirmDeleteProduct('${product._id || product.id}')">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </td>
    `;
    
    productsTable.appendChild(tr);
  });
}

// عرض تفاصيل المنتج
function viewProduct(productId) {
  console.log('عرض تفاصيل المنتج:', productId);
  
  try {
    // التحقق من وجود معرف المنتج
    if (!productId) {
      showAlert('خطأ: معرف المنتج غير صالح', 'danger');
      return;
    }
    
    // التحقق من وجود رمز التوثيق
    if (!authToken) {
      showAlert('يجب تسجيل الدخول أولاً لعرض تفاصيل المنتج', 'danger');
      return;
    }
    
    // عرض مؤشر التحميل
    showLoading('جاري تحميل بيانات المنتج...');
    
    // جلب تفاصيل المنتج من الخادم
    fetch(`/api/products/${productId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    })
    .then(response => {
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('غير مصرح لك بالوصول. الرجاء إعادة تسجيل الدخول.');
        }
        throw new Error('فشل في جلب بيانات المنتج: ' + response.statusText);
      }
      return response.json();
    })
    .then(data => {
      hideLoading();
      
      // تحضير البيانات للعرض
      const product = data.product || data;
      if (!product) {
        throw new Error('لم يتم العثور على بيانات المنتج');
      }
      
      // إزالة النافذة القديمة إن وجدت
      const existingModal = document.getElementById('viewProductModal');
      if (existingModal) {
        // محاولة إزالة النافذة باستخدام Bootstrap إذا كانت موجودة
        try {
          const oldModal = bootstrap.Modal.getInstance(existingModal);
          if (oldModal) {
            oldModal.dispose();
          }
        } catch (error) {
          console.warn('تعذر التخلص من نافذة المنتج السابقة:', error);
        }
        existingModal.remove();
      }
      
      // تحضير أي قيم إضافية للعرض
      const formattedPrice = typeof product.price === 'number' ? product.price.toFixed(2) + ' $' : (product.price || 'غير محدد');
      const createdDate = product.createdAt ? new Date(product.createdAt).toLocaleString('ar-SA') : 'غير محدد';
      const updatedDate = product.updatedAt ? new Date(product.updatedAt).toLocaleString('ar-SA') : 'غير محدد';
      
      // إنشاء نافذة منبثقة لعرض التفاصيل
      const modalHtml = `
        <div class="modal fade" id="viewProductModal" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">
          <div class="modal-dialog modal-lg">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">تفاصيل المنتج: ${product.name || 'غير معروف'}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="إغلاق"></button>
              </div>
              <div class="modal-body">
                <div class="row">
                  <div class="col-md-6">
                    <div class="mb-3">
                      <label class="fw-bold">الاسم:</label>
                      <div>${product.name || 'غير محدد'}</div>
                    </div>
                    <div class="mb-3">
                      <label class="fw-bold">الرمز:</label>
                      <div>${product.code || 'غير محدد'}</div>
                    </div>
                    <div class="mb-3">
                      <label class="fw-bold">السعر:</label>
                      <div>${formattedPrice}</div>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="mb-3">
                      <label class="fw-bold">التصنيف:</label>
                      <div>${product.category || 'غير محدد'}</div>
                    </div>
                    <div class="mb-3">
                      <label class="fw-bold">الإصدار:</label>
                      <div>${product.version || 'غير محدد'}</div>
                    </div>
                    <div class="mb-3">
                      <label class="fw-bold">الحالة:</label>
                      <div><span class="badge ${product.active ? 'bg-success' : 'bg-secondary'}">${product.active ? 'نشط' : 'غير نشط'}</span></div>
                    </div>
                  </div>
                </div>
                
                <hr>
                
                <div class="mb-3">
                  <label class="fw-bold">الوصف:</label>
                  <div>${product.description || 'لا يوجد وصف'}</div>
                </div>
                
                <div class="mb-3">
                  <label class="fw-bold">تاريخ الإنشاء:</label>
                  <div>${createdDate}</div>
                </div>
                
                <div class="mb-3">
                  <label class="fw-bold">آخر تحديث:</label>
                  <div>${updatedDate}</div>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إغلاق</button>
                <button type="button" class="btn btn-primary" onclick="showProductModal('${product._id || product.id}')">تعديل</button>
              </div>
            </div>
          </div>
        </div>
      `;
      
      // إضافة النافذة إلى DOM مباشرة في body
      document.body.insertAdjacentHTML('beforeend', modalHtml);
      
      // عرض النافذة بعد إضافتها للصفحة
      const viewProductModal = document.getElementById('viewProductModal');
      if (!viewProductModal) {
        throw new Error('فشل في إنشاء نافذة عرض المنتج: لم يتم العثور على العنصر بعد إضافته');
      }
      
      // التحقق من توفر مكتبة Bootstrap
      if (!isBootstrapAvailable()) {
        throw new Error('مكتبة Bootstrap غير متاحة');
      }
      
      // إنشاء وعرض النافذة المنبثقة مع تأخير بسيط
      setTimeout(() => {
        try {
          const modal = new bootstrap.Modal(viewProductModal);
          modal.show();
          
          // إزالة النافذة من DOM عند إغلاقها
          viewProductModal.addEventListener('hidden.bs.modal', function() {
            this.remove();
          });
        } catch (error) {
          console.error('خطأ في إنشاء النافذة المنبثقة للمنتج:', error);
          showAlert('حدث خطأ أثناء إنشاء النافذة المنبثقة: ' + error.message, 'danger');
          
          // محاولة الإصلاح بالإزالة
          if (viewProductModal) {
            viewProductModal.remove();
          }
        }
      }, 100); // تأخير بسيط للتأكد من أن العنصر تم إضافته بالكامل
    })
    .catch(error => {
      hideLoading();
      showAlert('حدث خطأ: ' + error.message, 'danger');
      console.error('خطأ في عرض تفاصيل المنتج:', error);
    });
  } catch (error) {
    console.error('خطأ غير متوقع أثناء عرض تفاصيل المنتج:', error);
    showAlert('حدث خطأ غير متوقع: ' + error.message, 'danger');
    hideLoading();
  }
}

// تأكيد حذف المنتج
function confirmDeleteProduct(productId) {
  console.log('طلب تأكيد حذف المنتج:', productId);
  
  try {
    // التحقق من وجود معرف المنتج
    if (!productId) {
      showAlert('خطأ: معرف المنتج غير صالح', 'danger');
      return;
    }
    
    // التحقق من وجود رمز التوثيق
    if (!authToken) {
      showAlert('يجب تسجيل الدخول أولاً لحذف المنتج', 'danger');
      return;
    }
    
    // جلب معلومات المنتج للتأكد من صحة المعرف واستخدام الاسم في التأكيد
    showLoading('جاري التحقق من بيانات المنتج...');
    
    fetch(`/api/products/${productId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('فشل في جلب بيانات المنتج: ' + response.statusText);
      }
      return response.json();
    })
    .then(data => {
      hideLoading();
      
      const product = data.product || data;
      const productName = product ? (product.name || 'منتج غير معروف') : 'منتج غير معروف';
      
      // إزالة النافذة القديمة إن وجدت
      const existingModal = document.getElementById('deleteProductModal');
      if (existingModal) {
        // محاولة إزالة النافذة باستخدام Bootstrap إذا كانت موجودة
        try {
          const oldModal = bootstrap.Modal.getInstance(existingModal);
          if (oldModal) {
            oldModal.dispose();
          }
        } catch (error) {
          console.warn('تعذر التخلص من نافذة تأكيد الحذف السابقة:', error);
        }
        existingModal.remove();
      }

      // إنشاء نافذة تأكيد الحذف
      const modalHtml = `
        <div class="modal fade" id="deleteProductModal" tabindex="-1" aria-labelledby="deleteProductModalLabel" aria-hidden="true">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header bg-danger text-white">
                <h5 class="modal-title" id="deleteProductModalLabel">تأكيد حذف المنتج</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="إغلاق"></button>
              </div>
              <div class="modal-body">
                <div class="alert alert-warning">
                  <i class="bi bi-exclamation-triangle me-2"></i>
                  <strong>تحذير:</strong> هذا الإجراء لا يمكن التراجع عنه!
                </div>
                <p>هل أنت متأكد من رغبتك في حذف المنتج:</p>
                <p class="fw-bold">${productName}</p>
                <p>سيتم حذف هذا المنتج بشكل نهائي من النظام، ولكن التراخيص المرتبطة به ستبقى محفوظة.</p>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إلغاء</button>
                <button type="button" class="btn btn-danger" onclick="deleteProduct('${productId}')">
                  <i class="bi bi-trash me-1"></i> تأكيد الحذف
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
      
      // إضافة النافذة إلى DOM مباشرة في body
      document.body.insertAdjacentHTML('beforeend', modalHtml);
      
      // عرض النافذة بعد إضافتها للصفحة
      const deleteProductModal = document.getElementById('deleteProductModal');
      if (!deleteProductModal) {
        throw new Error('فشل في إنشاء نافذة تأكيد الحذف: لم يتم العثور على العنصر بعد إضافته');
      }
      
      // التحقق من توفر مكتبة Bootstrap
      if (!isBootstrapAvailable()) {
        throw new Error('مكتبة Bootstrap غير متاحة');
      }
      
      // إنشاء وعرض النافذة المنبثقة مع تأخير بسيط
      setTimeout(() => {
        try {
          const modal = new bootstrap.Modal(deleteProductModal);
          modal.show();
          
          // إزالة النافذة من DOM عند إغلاقها
          deleteProductModal.addEventListener('hidden.bs.modal', function() {
            this.remove();
          });
        } catch (error) {
          console.error('خطأ في إنشاء نافذة تأكيد الحذف:', error);
          showAlert('حدث خطأ أثناء إنشاء نافذة تأكيد الحذف: ' + error.message, 'danger');
          
          // محاولة الإصلاح بالإزالة
          if (deleteProductModal) {
            deleteProductModal.remove();
          }
        }
      }, 100); // تأخير بسيط للتأكد من أن العنصر تم إضافته بالكامل
    })
    .catch(error => {
      hideLoading();
      showAlert('حدث خطأ أثناء التحقق من بيانات المنتج: ' + error.message, 'danger');
      console.error('خطأ في جلب معلومات المنتج للحذف:', error);
    });
  } catch (error) {
    hideLoading();
    console.error('خطأ غير متوقع أثناء تأكيد حذف المنتج:', error);
    showAlert('حدث خطأ غير متوقع: ' + error.message, 'danger');
  }
}

// حذف المنتج
function deleteProduct(productId) {
  console.log('حذف المنتج:', productId);
  
  // التحقق من وجود معرف المنتج
  if (!productId) {
    showAlert('خطأ: معرف المنتج غير صالح', 'danger');
    return;
  }
  
  // إغلاق نافذة التأكيد إن وجدت
  const deleteModal = bootstrap.Modal.getInstance(document.getElementById('deleteProductModal'));
  if (deleteModal) {
    deleteModal.hide();
  }
  
  // عرض مؤشر التحميل
  showLoading('جاري حذف المنتج...');
  
  // إرسال طلب الحذف إلى الخادم
  fetch(`/api/products/${productId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    }
  })
  .then(response => {
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('غير مصرح لك بالوصول. الرجاء إعادة تسجيل الدخول.');
      }
      return response.json().then(err => {
        throw new Error(err.message || 'فشل في حذف المنتج: ' + response.statusText);
      });
    }
    return response.json();
  })
  .then(data => {
    hideLoading();
    showAlert('تم حذف المنتج بنجاح', 'success');
    
    // تحديث قائمة المنتجات
    loadProductsData();
  })
  .catch(error => {
    hideLoading();
    showAlert('حدث خطأ: ' + error.message, 'danger');
    console.error('خطأ في حذف المنتج:', error);
  });
}

// تحميل بيانات الإحصائيات
function loadStatisticsData() {
  console.log('تحميل بيانات الإحصائيات...');
  
  const statisticsContainer = ensureElementExists('statistics-container', 'عرض الإحصائيات');
  if (!statisticsContainer) {
    console.error('لم يتم العثور على حاوية الإحصائيات');
    return;
  }
  
  // عرض مؤشر التحميل
  statisticsContainer.innerHTML = `
    <div class="text-center p-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">جاري التحميل...</span>
      </div>
      <p class="mt-2">جاري تحميل الإحصائيات...</p>
    </div>
  `;
  
  // استخدام API لجلب البيانات
  fetch('/api/statistics', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    }
  })
  .then(response => {
    if (!response.ok) {
      // التحقق من نوع الخطأ
      if (response.status === 401) {
        // إعادة التوجيه إلى صفحة تسجيل الدخول
        const statisticsSection = ensureElementExists('statistics-section');
        const loginSection = ensureElementExists('login-section');
        
        if (statisticsSection) {
          statisticsSection.classList.add('d-none');
        }
        
        if (loginSection) {
          loginSection.classList.remove('d-none');
        }
        
        localStorage.removeItem('authToken');
        authToken = null;
        throw new Error('غير مصرح: الرجاء إعادة تسجيل الدخول');
      }
      throw new Error('فشل في جلب بيانات الإحصائيات: ' + response.statusText);
    }
    return response.json();
  })
  .then(data => {
    console.log('تم استلام بيانات الإحصائيات:', data);
    
    // تحضير عرض الإحصائيات
    renderStatistics(data);
  })
  .catch(error => {
    console.error('خطأ في تحميل بيانات الإحصائيات:', error);
    
    // عرض رسالة الخطأ
    statisticsContainer.innerHTML = `
      <div class="alert alert-danger text-center" role="alert">
        <i class="bi bi-exclamation-triangle me-2"></i>
        حدث خطأ أثناء تحميل بيانات الإحصائيات: ${error.message}
      </div>
    `;
  });
}

// عرض الإحصائيات
function renderStatistics(data) {
  const statisticsContainer = ensureElementExists('statistics-container');
  if (!statisticsContainer) {
    return;
  }
  
  // إعداد محتوى الإحصائيات
  let content = `
    <div class="row">
      <div class="col-md-6 mb-4">
        <div class="card h-100">
          <div class="card-header">
            <h5 class="mb-0">إحصائيات التراخيص</h5>
          </div>
          <div class="card-body">
            <canvas id="licenses-chart"></canvas>
          </div>
        </div>
      </div>
      <div class="col-md-6 mb-4">
        <div class="card h-100">
          <div class="card-header">
            <h5 class="mb-0">إحصائيات المنتجات</h5>
          </div>
          <div class="card-body">
            <canvas id="products-chart"></canvas>
          </div>
        </div>
      </div>
    </div>
    <div class="row">
      <div class="col-md-12 mb-4">
        <div class="card">
          <div class="card-header">
            <h5 class="mb-0">الاتجاهات الشهرية</h5>
          </div>
          <div class="card-body">
            <canvas id="monthly-chart"></canvas>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // تحديث المحتوى
  statisticsContainer.innerHTML = content;
  
  // إنشاء الرسوم البيانية
  createLicensesChart(data.licenses || {});
  createProductsChart(data.products || {});
  createMonthlyTrendsChart(data.monthly || {});
}

// إنشاء مخطط التراخيص
function createLicensesChart(data) {
  const ctx = document.getElementById('licenses-chart');
  if (!ctx) return;
  
  // إعادة تهيئة الرسم البياني إذا كان موجودًا من قبل
  if (statisticsCharts.licensesChart) {
    statisticsCharts.licensesChart.destroy();
  }
  
  // بيانات افتراضية للعرض
  const chartData = {
    labels: ['نشط', 'منتهي', 'ملغي', 'تجريبي'],
    datasets: [{
      data: [
        data.active || 0,
        data.expired || 0,
        data.revoked || 0,
        data.trial || 0
      ],
      backgroundColor: [
        'rgba(75, 192, 192, 0.7)',  // أخضر للنشط
        'rgba(255, 206, 86, 0.7)',   // أصفر للمنتهي
        'rgba(255, 99, 132, 0.7)',   // أحمر للملغي
        'rgba(54, 162, 235, 0.7)'    // أزرق للتجريبي
      ]
    }]
  };
  
  // إنشاء الرسم البياني
  statisticsCharts.licensesChart = new Chart(ctx, {
    type: 'pie',
    data: chartData,
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'right'
        },
        title: {
          display: true,
          text: 'توزيع حالات التراخيص'
        }
      }
    }
  });
}

// إنشاء مخطط المنتجات
function createProductsChart(data) {
  const ctx = document.getElementById('products-chart');
  if (!ctx) return;
  
  // إعادة تهيئة الرسم البياني إذا كان موجودًا من قبل
  if (statisticsCharts.productsChart) {
    statisticsCharts.productsChart.destroy();
  }
  
  // تحضير البيانات
  const products = Object.keys(data).slice(0, 5);  // أخذ أعلى 5 منتجات
  const counts = products.map(p => data[p] || 0);
  
  // بيانات افتراضية للعرض
  const chartData = {
    labels: products.length > 0 ? products : ['لا توجد منتجات'],
    datasets: [{
      label: 'عدد التراخيص',
      data: counts.length > 0 ? counts : [0],
      backgroundColor: 'rgba(54, 162, 235, 0.7)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 1
    }]
  };
  
  // إنشاء الرسم البياني
  statisticsCharts.productsChart = new Chart(ctx, {
    type: 'bar',
    data: chartData,
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'التراخيص حسب المنتج'
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

// إنشاء مخطط الاتجاهات الشهرية
function createMonthlyTrendsChart(data) {
  const ctx = document.getElementById('monthly-chart');
  if (!ctx) return;
  
  // إعادة تهيئة الرسم البياني إذا كان موجودًا من قبل
  if (statisticsCharts.monthlyChart) {
    statisticsCharts.monthlyChart.destroy();
  }
  
  // تحضير البيانات
  const months = Object.keys(data).slice(-12);  // آخر 12 شهر
  const counts = months.map(m => data[m] || 0);
  
  // بيانات افتراضية للعرض
  const chartData = {
    labels: months.length > 0 ? months : ['لا توجد بيانات'],
    datasets: [{
      label: 'التراخيص الجديدة',
      data: counts.length > 0 ? counts : [0],
      fill: false,
      borderColor: 'rgba(54, 162, 235, 1)',
      tension: 0.1
    }]
  };
  
  // إنشاء الرسم البياني
  statisticsCharts.monthlyChart = new Chart(ctx, {
    type: 'line',
    data: chartData,
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: true
        },
        title: {
          display: true,
          text: 'التراخيص الجديدة شهريًا'
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

// تحميل بيانات الإعدادات
function loadSettingsData() {
  console.log('تحميل بيانات الإعدادات...');
  
  // التحقق من وجود العناصر الضرورية
  const adminSettingsForm = ensureElementExists('admin-settings-form', 'عرض إعدادات المسؤول');
  const serverSettingsForm = ensureElementExists('server-settings-form', 'عرض إعدادات الخادم');
  
  if (!adminSettingsForm && !serverSettingsForm) {
    console.error('لم يتم العثور على نماذج الإعدادات');
    return;
  }
  
  // عرض مؤشر التحميل
  const settingsContainer = document.querySelector('#settings-section .container-fluid');
  if (settingsContainer) {
    settingsContainer.classList.add('loading-state');
  }
  
  // إنشاء مصفوفة من الوعود لتحميل جميع البيانات بالتوازي
  const promises = [];
  
  // تحميل إعدادات المسؤول
  if (adminSettingsForm) {
    const adminPromise = fetch('/api/settings/admin', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    }
  })
  .then(response => {
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('غير مصرح: الرجاء إعادة تسجيل الدخول');
      }
        throw new Error('فشل في جلب إعدادات المسؤول: ' + response.statusText);
    }
    return response.json();
  })
  .then(data => {
      console.log('تم استلام إعدادات المسؤول:', data);
      fillAdminSettings(data.admin || {});
      return true;
    })
    .catch(error => {
      console.error('خطأ في تحميل إعدادات المسؤول:', error);
      if (error.message.includes('غير مصرح')) {
        handleAuthError();
      } else {
        showAlert('خطأ في تحميل إعدادات المسؤول: ' + error.message, 'warning');
      }
      return false;
    });
    
    promises.push(adminPromise);
  }
  
  // تحميل إعدادات الخادم
  if (serverSettingsForm) {
    const serverPromise = fetch('/api/settings/server', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    })
    .then(response => {
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('غير مصرح: الرجاء إعادة تسجيل الدخول');
        }
        throw new Error('فشل في جلب إعدادات الخادم: ' + response.statusText);
      }
      return response.json();
    })
    .then(data => {
      console.log('تم استلام إعدادات الخادم:', data);
      fillServerSettings(data.server || {});
      return true;
    })
  .catch(error => {
      console.error('خطأ في تحميل إعدادات الخادم:', error);
      if (error.message.includes('غير مصرح')) {
        handleAuthError();
      } else {
        showAlert('خطأ في تحميل إعدادات الخادم: ' + error.message, 'warning');
      }
      return false;
    });
    
    promises.push(serverPromise);
  }
  
  // انتظار اكتمال جميع الطلبات
  Promise.all(promises)
    .finally(() => {
      // إزالة مؤشر التحميل عند الانتهاء بغض النظر عن النتيجة
    if (settingsContainer) {
      settingsContainer.classList.remove('loading-state');
    }
  });
}

// معالجة خطأ المصادقة
function handleAuthError() {
  const settingsSection = ensureElementExists('settings-section');
  const loginSection = ensureElementExists('login-section');
  
  if (settingsSection) {
    settingsSection.classList.add('d-none');
  }
  
  if (loginSection) {
    loginSection.classList.remove('d-none');
  }
  
  localStorage.removeItem('authToken');
  authToken = null;
  
  showAlert('انتهت جلستك. الرجاء إعادة تسجيل الدخول.', 'danger');
}

// تعبئة إعدادات المسؤول
function fillAdminSettings(data) {
  const adminUsernameInput = document.getElementById('admin-username');
  const adminNameInput = document.getElementById('admin-name');
  const adminEmailInput = document.getElementById('admin-email');
  
  if (adminUsernameInput) adminUsernameInput.value = data.username || '';
  if (adminNameInput) adminNameInput.value = data.name || '';
  if (adminEmailInput) adminEmailInput.value = data.email || '';
}

// تعبئة إعدادات الخادم
function fillServerSettings(data) {
  const serverNameInput = document.getElementById('server-name');
  const serverUrlInput = document.getElementById('server-url');
  const smtpHostInput = document.getElementById('smtp-host');
  const smtpPortInput = document.getElementById('smtp-port');
  const smtpUserInput = document.getElementById('smtp-user');
  const smtpPasswordInput = document.getElementById('smtp-password');
  const smtpFromInput = document.getElementById('smtp-from');
  const licenseFormatInput = document.getElementById('license-format');
  const maxActivationsDefaultInput = document.getElementById('max-activations-default');
  const trialDaysDefaultInput = document.getElementById('trial-days-default');
  const apiKeyInput = document.getElementById('api-key');
  const apiRequestLimitInput = document.getElementById('api-request-limit');
  
  if (serverNameInput) serverNameInput.value = data.name || '';
  if (serverUrlInput) serverUrlInput.value = data.url || '';
  
  // إعدادات SMTP
  if (data.smtp) {
    if (smtpHostInput) smtpHostInput.value = data.smtp.host || '';
    if (smtpPortInput) smtpPortInput.value = data.smtp.port || '';
    if (smtpUserInput) smtpUserInput.value = data.smtp.user || '';
    // لا نملأ كلمة المرور لأسباب أمنية
    if (smtpFromInput) smtpFromInput.value = data.smtp.from || '';
  }
  
  // إعدادات التراخيص
  if (data.license) {
    if (licenseFormatInput) licenseFormatInput.value = data.license.format || '';
    if (maxActivationsDefaultInput) maxActivationsDefaultInput.value = data.license.maxActivationsDefault || 1;
    if (trialDaysDefaultInput) trialDaysDefaultInput.value = data.license.trialDaysDefault || 30;
  }
  
  // إعدادات API
  if (data.api) {
    if (apiKeyInput) apiKeyInput.value = data.api.key || '';
    if (apiRequestLimitInput) apiRequestLimitInput.value = data.api.requestLimit || 1000;
  }
  
  // إعداد مستمعي أحداث لأزرار API
  setupApiKeyButtons();
}

// إعداد أزرار مفتاح API
function setupApiKeyButtons() {
  const generateApiKeyBtn = document.getElementById('generate-api-key');
  const copyApiKeyBtn = document.getElementById('copy-api-key');
  const apiKeyInput = document.getElementById('api-key');
  
  // زر توليد مفتاح API جديد
  if (generateApiKeyBtn) {
    generateApiKeyBtn.addEventListener('click', function() {
      if (confirm('هل أنت متأكد من توليد مفتاح API جديد؟ سيتم إبطال المفتاح القديم.')) {
        const newApiKey = generateRandomApiKey();
        apiKeyInput.value = newApiKey;
        showAlert('تم توليد مفتاح API جديد. لا تنس الضغط على زر الحفظ لتأكيد التغييرات.', 'info');
      }
    });
  }
  
  // زر نسخ مفتاح API
  if (copyApiKeyBtn && apiKeyInput) {
    copyApiKeyBtn.addEventListener('click', function() {
      apiKeyInput.select();
      document.execCommand('copy');
      showAlert('تم نسخ مفتاح API إلى الحافظة', 'success', 2000);
    });
  }
}

// توليد مفتاح API عشوائي
function generateRandomApiKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const length = 32;
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

// حفظ إعدادات الخادم
function saveServerSettings() {
  console.log('حفظ إعدادات الخادم...');
  
  // تسجيل معلومات التصحيح
  console.log('توكن المصادقة موجود:', !!authToken);
  if (authToken) {
    console.log('طول توكن المصادقة:', authToken.length);
    console.log('بداية التوكن:', authToken.substring(0, 10) + '...');
  } else {
    console.error('توكن المصادقة غير موجود، يجب تسجيل الدخول أولاً');
    showAlert('يجب تسجيل الدخول لحفظ الإعدادات', 'danger');
    return;
  }
  
  // التحقق من وجود العناصر الضرورية
  const serverSettingsForm = ensureElementExists('server-settings-form', 'حفظ إعدادات الخادم');
  if (!serverSettingsForm) {
    showAlert('لم يتم العثور على نموذج إعدادات الخادم', 'danger');
      return;
    }
    
  // جمع البيانات من النموذج
  const serverNameInput = document.getElementById('server-name');
  const serverUrlInput = document.getElementById('server-url');
  const smtpHostInput = document.getElementById('smtp-host');
  const smtpPortInput = document.getElementById('smtp-port');
  const smtpUserInput = document.getElementById('smtp-user');
  const smtpPasswordInput = document.getElementById('smtp-password');
  const smtpFromInput = document.getElementById('smtp-from');
  const licenseFormatInput = document.getElementById('license-format');
  const maxActivationsDefaultInput = document.getElementById('max-activations-default');
  const trialDaysDefaultInput = document.getElementById('trial-days-default');
  const apiKeyInput = document.getElementById('api-key');
  const apiRequestLimitInput = document.getElementById('api-request-limit');
  
  // التحقق من البيانات الأساسية
  if (!serverNameInput || !serverNameInput.value) {
    showAlert('يرجى إدخال اسم الخادم', 'warning');
    if (serverNameInput) serverNameInput.focus();
      return;
    }
  
  if (!serverUrlInput || !serverUrlInput.value) {
    showAlert('يرجى إدخال رابط الخادم', 'warning');
    if (serverUrlInput) serverUrlInput.focus();
    return;
  }
  
  // تجهيز البيانات للإرسال
  const serverData = {
    name: serverNameInput ? serverNameInput.value : '',
    url: serverUrlInput ? serverUrlInput.value : '',
    smtp: {
      host: smtpHostInput ? smtpHostInput.value : '',
      port: smtpPortInput ? smtpPortInput.value : '',
      user: smtpUserInput ? smtpUserInput.value : '',
      password: smtpPasswordInput && smtpPasswordInput.value ? smtpPasswordInput.value : undefined,
      from: smtpFromInput ? smtpFromInput.value : ''
    },
    license: {
      format: licenseFormatInput ? licenseFormatInput.value : '',
      maxActivationsDefault: maxActivationsDefaultInput ? parseInt(maxActivationsDefaultInput.value) || 1 : 1,
      trialDaysDefault: trialDaysDefaultInput ? parseInt(trialDaysDefaultInput.value) || 30 : 30
    },
    api: {
      key: apiKeyInput ? apiKeyInput.value : '',
      requestLimit: apiRequestLimitInput ? parseInt(apiRequestLimitInput.value) || 1000 : 1000
    }
  };
  
  console.log('إرسال بيانات الخادم للحفظ:', serverData);
  
  // عرض مؤشر التحميل
  const saveButton = document.getElementById('save-server-settings');
  if (saveButton) {
    const originalText = saveButton.innerHTML;
    saveButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> جاري الحفظ...';
    saveButton.disabled = true;
    
    // حفظ البيانات
    fetch('/api/settings/server', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(serverData)
    })
    .then(response => {
      console.log('استجابة الخادم:', { 
        status: response.status, 
        statusText: response.statusText, 
        ok: response.ok 
      });
      
      if (!response.ok) {
        return response.json().then(errorData => {
          console.error('تفاصيل خطأ الاستجابة:', errorData);
          throw new Error(errorData.message || `فشل حفظ إعدادات الخادم: ${response.statusText}`);
        }).catch(jsonError => {
          // في حالة عدم القدرة على قراءة رد خطأ JSON
          console.error('تعذر قراءة تفاصيل الخطأ من الخادم:', jsonError);
          throw new Error(`فشل حفظ إعدادات الخادم: ${response.statusText}`);
        });
      }
      return response.json();
    })
    .then(data => {
      console.log('تم حفظ إعدادات الخادم بنجاح:', data);
      
      // عرض رسالة نجاح
      showAlert('تم حفظ إعدادات الخادم بنجاح', 'success');
      
      // مسح حقل كلمة المرور
      if (smtpPasswordInput) smtpPasswordInput.value = '';
    })
    .catch(error => {
      console.error('خطأ في حفظ إعدادات الخادم:', error);
      showAlert('حدث خطأ أثناء حفظ الإعدادات: ' + error.message, 'danger');
    })
    .finally(() => {
      // إعادة زر الحفظ إلى حالته الأصلية
      if (saveButton) {
        saveButton.innerHTML = originalText;
        saveButton.disabled = false;
      }
    });
  } else {
    showAlert('لم يتم العثور على زر حفظ إعدادات الخادم', 'danger');
  }
}

// دالة لعرض نوع الترخيص بالنص
function getLicenseTypeText(type) {
  switch (type) {
    case 'perpetual': return 'دائم';
    case 'subscription': return 'اشتراك';
    case 'trial': return 'تجريبي';
    case 'development': return 'تطويري';
    default: return type || 'غير معروف';
  }
}

// حفظ إعدادات المسؤول
function saveAdminSettings() {
  console.log('حفظ إعدادات المسؤول...');
  
  // التحقق من وجود توكن المصادقة
  if (!authToken) {
    console.error('توكن المصادقة غير موجود، يجب تسجيل الدخول أولاً');
    showAlert('يجب تسجيل الدخول لحفظ الإعدادات', 'danger');
    return;
  }
  
  // التحقق من وجود نموذج إعدادات المسؤول
  const adminSettingsForm = ensureElementExists('admin-settings-form', 'حفظ إعدادات المسؤول');
  if (!adminSettingsForm) {
    showAlert('لم يتم العثور على نموذج إعدادات المسؤول', 'danger');
    return;
  }
  
  // جمع البيانات من النموذج
  const adminUsernameInput = document.getElementById('admin-username');
  const adminNameInput = document.getElementById('admin-name');
  const adminEmailInput = document.getElementById('admin-email');
  const currentPasswordInput = document.getElementById('current-password');
  const newPasswordInput = document.getElementById('new-user-password');
  const confirmPasswordInput = document.getElementById('confirm-password');
  
  // التحقق من وجود البيانات الأساسية
  if (!adminNameInput || !adminNameInput.value) {
    showAlert('يرجى إدخال اسم المسؤول', 'warning');
    if (adminNameInput) adminNameInput.focus();
    return;
  }
  
  if (!adminEmailInput || !adminEmailInput.value) {
    showAlert('يرجى إدخال البريد الإلكتروني للمسؤول', 'warning');
    if (adminEmailInput) adminEmailInput.focus();
      return;
    }
    
  // التحقق من تطابق كلمتي المرور
  if (newPasswordInput && newPasswordInput.value) {
    if (!confirmPasswordInput || confirmPasswordInput.value !== newPasswordInput.value) {
      showAlert('كلمة المرور الجديدة وتأكيدها غير متطابقين', 'warning');
      if (confirmPasswordInput) confirmPasswordInput.focus();
      return;
    }
    
    // التحقق من وجود كلمة المرور الحالية
    if (!currentPasswordInput || !currentPasswordInput.value) {
      showAlert('يجب إدخال كلمة المرور الحالية لتغيير كلمة المرور', 'warning');
      if (currentPasswordInput) currentPasswordInput.focus();
      return;
    }
  }
  
  // تجهيز البيانات للإرسال
  const adminData = {
    name: adminNameInput ? adminNameInput.value : '',
    email: adminEmailInput ? adminEmailInput.value : '',
    currentPassword: currentPasswordInput && currentPasswordInput.value ? currentPasswordInput.value : '',
    newPassword: newPasswordInput && newPasswordInput.value ? newPasswordInput.value : ''
  };
  
  console.log('إرسال بيانات المسؤول للحفظ:', { ...adminData, currentPassword: '***', newPassword: '***' });
  
  // عرض مؤشر التحميل
  const saveButton = document.getElementById('save-admin-settings');
  if (saveButton) {
    const originalText = saveButton.innerHTML;
    saveButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> جاري الحفظ...';
    saveButton.disabled = true;
    
    // حفظ البيانات
    fetch('/api/settings/admin', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(adminData)
    })
    .then(response => {
      console.log('استجابة الخادم:', { 
        status: response.status, 
        statusText: response.statusText, 
        ok: response.ok 
      });
      
      if (!response.ok) {
        return response.json().then(errorData => {
          console.error('تفاصيل خطأ الاستجابة:', errorData);
          throw new Error(errorData.message || `فشل حفظ إعدادات المسؤول: ${response.statusText}`);
        }).catch(jsonError => {
          // في حالة عدم القدرة على قراءة رد خطأ JSON
          console.error('تعذر قراءة تفاصيل الخطأ من الخادم:', jsonError);
          throw new Error(`فشل حفظ إعدادات المسؤول: ${response.statusText}`);
        });
      }
      return response.json();
    })
    .then(data => {
      console.log('تم حفظ إعدادات المسؤول بنجاح:', data);
      
      // عرض رسالة نجاح
      showAlert('تم حفظ إعدادات المسؤول بنجاح', 'success');
      
      // مسح حقول كلمة المرور
      if (currentPasswordInput) currentPasswordInput.value = '';
      if (newPasswordInput) newPasswordInput.value = '';
      if (confirmPasswordInput) confirmPasswordInput.value = '';
    })
    .catch(error => {
      console.error('خطأ في حفظ إعدادات المسؤول:', error);
      showAlert('حدث خطأ أثناء حفظ الإعدادات: ' + error.message, 'danger');
    })
    .finally(() => {
      // إعادة زر الحفظ إلى حالته الأصلية
      if (saveButton) {
        saveButton.innerHTML = originalText;
        saveButton.disabled = false;
      }
    });
  } else {
    showAlert('لم يتم العثور على زر حفظ إعدادات المسؤول', 'danger');
  }
}
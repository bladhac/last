// حفظ بيانات العميل
function saveCustomer() {
  try {
    console.log('جاري حفظ بيانات العميل...');
    
    // التحقق من وجود رمز توثيق
    if (!authToken) {
      showAlert('يجب تسجيل الدخول أولاً', 'danger');
      return;
    }

    // التحقق من وجود عناصر النموذج المطلوبة
    const customerNameInput = document.getElementById('customer-name');
    const customerEmailInput = document.getElementById('customer-email');
    const customerPhoneInput = document.getElementById('customer-phone');
    const customerAddressInput = document.getElementById('customer-address');
    const customerTypeInput = document.getElementById('customer-type');
    const customerNotesInput = document.getElementById('customer-notes');
    const customerIdInput = document.getElementById('customer-id');
    
    // التحقق من وجود الحقول الإلزامية
    if (!customerNameInput || !customerNameInput.value) {
      showAlert('يرجى إدخال اسم العميل', 'warning');
      if (customerNameInput) customerNameInput.focus();
      return;
    }

    // جمع بيانات النموذج
    const customerData = {
      name: customerNameInput.value,
      email: customerEmailInput ? customerEmailInput.value : '',
      phone: customerPhoneInput ? customerPhoneInput.value : '',
      address: customerAddressInput ? customerAddressInput.value : '',
      type: customerTypeInput ? customerTypeInput.value : 'individual',
      notes: customerNotesInput ? customerNotesInput.value : ''
    };

    // عرض مؤشر التحميل
    const submitButton = document.querySelector('#customer-modal .modal-footer .btn-primary');
    const originalButtonText = submitButton ? submitButton.innerHTML : 'حفظ';
    if (submitButton) {
      submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> جاري الحفظ...';
      submitButton.disabled = true;
    }

    // تحديد ما إذا كانت عملية إضافة أو تحديث
    const customerId = customerIdInput ? customerIdInput.value : '';
    const method = customerId ? 'PUT' : 'POST';
    const url = customerId ? `/api/customers/${customerId}` : '/api/customers';
    
    // إرسال البيانات إلى الخادم
    fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(customerData)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`فشل حفظ بيانات العميل: ${response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      // إغلاق النموذج
      const modal = document.getElementById('customer-modal');
      if (modal) {
        const modalInstance = bootstrap.Modal.getInstance(modal);
        if (modalInstance) modalInstance.hide();
      }
      
      // تحديث قائمة العملاء
      if (typeof loadCustomersData === 'function') {
        loadCustomersData();
      }
      
      // عرض رسالة نجاح
      showAlert(customerId ? 'تم تحديث بيانات العميل بنجاح' : 'تم إضافة العميل بنجاح', 'success');
    })
    .catch(error => {
      console.error('خطأ في حفظ بيانات العميل:', error);
      showAlert('حدث خطأ: ' + error.message, 'danger');
    })
    .finally(() => {
      // إعادة زر الحفظ إلى حالته الأصلية
      if (submitButton) {
        submitButton.innerHTML = originalButtonText;
        submitButton.disabled = false;
      }
    });
  } catch (error) {
    console.error('خطأ غير متوقع أثناء حفظ بيانات العميل:', error);
    showAlert('حدث خطأ غير متوقع: ' + error.message, 'danger');
  }
} 
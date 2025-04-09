# نظام إدارة التراخيص

نظام متكامل لإدارة تراخيص وتفعيل البرامج، يوفر واجهة برمجة تطبيقات (API) للتحقق من صحة التراخيص ولوحة تحكم لإدارة المنتجات والعملاء والتراخيص.

## المميزات

- **إدارة المنتجات**: إنشاء وتعديل منتجات البرمجيات مع إعدادات مخصصة.
- **إدارة العملاء**: تسجيل وإدارة بيانات العملاء.
- **إدارة التراخيص**: إنشاء مفاتيح ترخيص للعملاء مع أنواع مختلفة (دائم، اشتراك، تجريبي).
- **التحقق من الترخيص**: API للتحقق من صحة مفاتيح الترخيص وتنشيط المنتجات.
- **دعم عدة أجهزة**: إمكانية تحديد عدد الأجهزة المسموح بها لكل ترخيص.
- **التحقق دون اتصال**: دعم التحقق من الترخيص دون اتصال بالإنترنت.
- **نظام أمان متقدم**: حماية البيانات والتراخيص باستخدام تقنيات التشفير المتقدمة.
- **معلومات إحصائية**: إحصائيات ومؤشرات أداء للمنتجات والتراخيص.

## متطلبات النظام

- Node.js (v14+)
- MongoDB
- NPM أو Yarn

## إعداد المشروع

### التثبيت

1. استنساخ المشروع:
   ```
   git clone https://github.com/yourusername/license-server.git
   cd license-server
   ```

2. تثبيت الاعتماديات:
   ```
   npm install
   ```

3. إنشاء ملف `.env` وتكوينه:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/license-system
   JWT_SECRET=your_jwt_secret_key
   LICENSE_SECRET_KEY=your_license_secret_key
   API_SECRET_KEY=your_api_secret_key
   ADMIN_EMAIL=admin@example.com
   ADMIN_PASSWORD=your_secure_password
   ```

### تشغيل الخادم

- **وضع التطوير**:
  ```
  npm run dev
  ```

- **وضع الإنتاج**:
  ```
  npm start
  ```

## واجهة برمجة التطبيقات (API)

### المصادقة

- `POST /api/auth/login`: تسجيل الدخول وإنشاء رمز JWT
- `POST /api/auth/register`: تسجيل مستخدم جديد (للمسؤولين فقط)
- `GET /api/auth/me`: الحصول على بيانات المستخدم الحالي
- `POST /api/auth/change-password`: تغيير كلمة المرور للمستخدم الحالي

### المنتجات

- `POST /api/products`: إنشاء منتج جديد
- `GET /api/products`: الحصول على قائمة المنتجات
- `GET /api/products/:id`: الحصول على منتج محدد
- `PUT /api/products/:id`: تحديث منتج
- `DELETE /api/products/:id`: حذف منتج
- `GET /api/products/:id/stats`: الحصول على إحصائيات المنتج

### العملاء

- `POST /api/customers`: إنشاء عميل جديد
- `GET /api/customers`: الحصول على قائمة العملاء
- `GET /api/customers/:id`: الحصول على عميل محدد
- `PUT /api/customers/:id`: تحديث عميل
- `DELETE /api/customers/:id`: حذف عميل
- `GET /api/customers/:id/licenses`: الحصول على تراخيص عميل محدد

### التراخيص

- `POST /api/licenses`: إنشاء ترخيص جديد
- `GET /api/licenses`: الحصول على قائمة التراخيص
- `GET /api/licenses/:id`: الحصول على ترخيص محدد
- `PUT /api/licenses/:id`: تحديث ترخيص
- `PUT /api/licenses/:id/revoke`: إلغاء ترخيص
- `PUT /api/licenses/:id/deactivate-device`: إلغاء تنشيط جهاز

### التحقق من الترخيص (للعملاء)

- `POST /api/licenses/verify`: التحقق من ترخيص وتنشيط جهاز
- `POST /api/licenses/verify-offline`: التحقق من الترخيص دون اتصال

## دمج النظام في تطبيقك

للتحقق من الترخيص في تطبيقك، يمكنك استخدام واجهة برمجة التطبيقات كما يلي:

```javascript
// مثال لكيفية التحقق من الترخيص في تطبيقك
async function verifyLicense(licenseKey, deviceFingerprint) {
  try {
    const response = await fetch('https://your-license-server.com/api/licenses/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': 'your_api_key'
      },
      body: JSON.stringify({
        licenseKey,
        deviceFingerprint,
        deviceInfo: {
          // معلومات إضافية عن الجهاز
          osName: 'Windows 10',
          hostname: 'DESKTOP-ABC123',
          appVersion: '1.2.0'
        }
      })
    });

    const result = await response.json();
    
    if (result.success) {
      // حفظ بيانات التحقق دون اتصال للاستخدام في المستقبل
      localStorage.setItem('offlineData', result.offlineData);
      return {
        valid: true,
        info: result.licenseInfo
      };
    } else {
      return {
        valid: false,
        message: result.message
      };
    }
  } catch (error) {
    // محاولة التحقق دون اتصال
    const offlineData = localStorage.getItem('offlineData');
    if (offlineData) {
      // ...
    }
    return {
      valid: false,
      message: 'فشل الاتصال بخادم التراخيص'
    };
  }
}
```

## الأمان

- جميع كلمات المرور مشفرة باستخدام bcrypt
- مفاتيح الترخيص مشفرة باستخدام AES مع توقيع HMAC للتحقق من السلامة
- واجهة برمجة التطبيقات محمية باستخدام رموز JWT ومفاتيح API
- جميع الطلبات تستخدم بروتوكول HTTPS في بيئة الإنتاج

## المساهمة

نرحب بمساهماتكم! يرجى إنشاء طلب سحب (Pull Request) أو فتح تذكرة (Issue) للتحسينات والإضافات. 
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

/**
 * تسجيل الدخول للمستخدم
 * @route POST /api/auth/login
 * @access Public
 */
const login = async (req, res) => {
  try {
    console.log('بدء عملية تسجيل الدخول...');
    const { username, password } = req.body;

    // تسجيل المعلومات للتشخيص
    console.log(`محاولة تسجيل الدخول لـ: ${username}`);
    console.log(`كلمة المرور المدخلة: ${password?.slice(0, 1)}***`);
    
    // التحقق من وجود المستخدم
    const user = await User.findOne({ username });
    
    if (!user) {
      console.log(`المستخدم غير موجود: ${username}`);
      
      // محاولة إنشاء مستخدم افتراضي في وضع التطوير
      if (username === 'admin' && process.env.NODE_ENV === 'development') {
        console.log('محاولة إنشاء مستخدم افتراضي للتطوير');
        
        // إنشاء مستخدم افتراضي
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('Mo0598138822++', salt);
        
        const newUser = new User({
          username: 'admin',
          password: hashedPassword,
          name: 'مدير النظام',
          role: 'admin',
          active: true
        });
        
        await newUser.save();
        console.log('تم إنشاء مستخدم افتراضي بنجاح');
        
        // إنشاء التوكن
        const token = jwt.sign(
          { id: newUser._id, role: newUser.role },
          process.env.JWT_SECRET || 'secret-dev-key',
          { expiresIn: '7d' }
        );
        
        return res.json({
          token,
          user: {
            id: newUser._id,
            username: newUser.username,
            name: newUser.name,
            role: newUser.role
          },
          message: 'تم إنشاء مستخدم افتراضي وتسجيل الدخول بنجاح'
        });
      }
      
      return res.status(400).json({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }
    
    // التحقق من كلمة المرور
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      console.log('كلمة المرور غير صحيحة');
      return res.status(400).json({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }
    
    // التحقق من حالة الحساب
    if (!user.active) {
      console.log('الحساب غير نشط');
      return res.status(401).json({ message: 'حسابك غير نشط. يرجى التواصل مع المسؤول' });
    }
    
    // إنشاء التوكن
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'secret-dev-key',
      { expiresIn: '7d' }
    );
    
    console.log('تم تسجيل الدخول بنجاح');
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('خطأ في عملية تسجيل الدخول:', error);
    res.status(500).json({ message: 'خطأ في الخادم. يرجى المحاولة مرة أخرى لاحقًا' });
  }
};

/**
 * إنشاء مستخدم جديد
 * @route POST /api/auth/register
 * @access Private (Admin only)
 */
const register = async (req, res) => {
  try {
    const { username, name, password, role } = req.body;
    
    // التحقق من وجود البيانات الضرورية
    if (!username || !name || !password) {
      return res.status(400).json({
        message: 'الرجاء إدخال جميع البيانات المطلوبة'
      });
    }
    
    // التحقق من عدم وجود المستخدم مسبقًا
    const existingUser = await User.findOne({ username });
    
    if (existingUser) {
      return res.status(400).json({
        message: 'اسم المستخدم مستخدم بالفعل'
      });
    }
    
    // إنشاء مستخدم جديد
    const user = new User({
      username,
      name,
      password,
      role: role || 'user'
    });
    
    await user.save();
    
    res.status(201).json({
      message: 'تم إنشاء المستخدم بنجاح',
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('خطأ في إنشاء مستخدم:', error);
    res.status(500).json({
      message: 'حدث خطأ أثناء إنشاء المستخدم'
    });
  }
};

/**
 * الحصول على بيانات المستخدم الحالي
 * @route GET /api/auth/me
 * @access Private
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        message: 'المستخدم غير موجود'
      });
    }
    
    res.status(200).json({
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        role: user.role,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('خطأ في الحصول على بيانات المستخدم:', error);
    res.status(500).json({
      message: 'حدث خطأ أثناء محاولة الحصول على بيانات المستخدم'
    });
  }
};

/**
 * تغيير كلمة المرور
 * @route POST /api/auth/change-password
 * @access Private
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: 'الرجاء إدخال كلمة المرور الحالية والجديدة'
      });
    }
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        message: 'المستخدم غير موجود'
      });
    }
    
    // التحقق من كلمة المرور الحالية
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    
    if (!isMatch) {
      return res.status(401).json({
        message: 'كلمة المرور الحالية غير صحيحة'
      });
    }
    
    // تحديث كلمة المرور
    user.password = newPassword;
    await user.save();
    
    res.status(200).json({
      message: 'تم تغيير كلمة المرور بنجاح'
    });
  } catch (error) {
    console.error('خطأ في تغيير كلمة المرور:', error);
    res.status(500).json({
      message: 'حدث خطأ أثناء تغيير كلمة المرور'
    });
  }
};

module.exports = {
  login,
  register,
  getMe,
  changePassword
}; 
const Activity = require('../models/Activity');

/**
 * الحصول على آخر الأنشطة
 * @route GET /api/activities
 * @access Private (Admin/Manager)
 */
const getActivities = async (req, res) => {
  try {
    const { page = 1, limit = 10, type } = req.query;
    
    // إنشاء شروط البحث
    const query = {};
    
    if (type) {
      query.type = type;
    }
    
    // تنفيذ الاستعلام مع التقسيم إلى صفحات
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { createdAt: -1 },
      populate: 'user'
    };
    
    const activities = await Activity.find(query)
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .sort(options.sort)
      .populate({ path: 'user', select: 'name email' });
    
    // الحصول على إجمالي عدد الأنشطة
    const total = await Activity.countDocuments(query);
    
    res.status(200).json({
      activities: activities.map(activity => ({
        id: activity._id,
        message: activity.message,
        type: activity.type,
        user: activity.user ? {
          id: activity.user._id,
          name: activity.user.name,
          email: activity.user.email
        } : null,
        time: activity.createdAt
      })),
      totalPages: Math.ceil(total / options.limit),
      currentPage: options.page,
      total
    });
  } catch (error) {
    console.error('خطأ في الحصول على الأنشطة:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء استرجاع الأنشطة' });
  }
};

/**
 * إضافة نشاط جديد
 * @access Internal Only
 */
const addActivity = async (activityData) => {
  try {
    const activity = new Activity(activityData);
    await activity.save();
    return activity;
  } catch (error) {
    console.error('خطأ في إضافة نشاط جديد:', error);
    return null;
  }
};

module.exports = {
  getActivities,
  addActivity
}; 
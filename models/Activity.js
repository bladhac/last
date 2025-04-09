const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['license', 'customer', 'product', 'user', 'system'],
    default: 'system'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId
  },
  referenceModel: {
    type: String,
    enum: ['License', 'Customer', 'Product', 'User']
  },
  ipAddress: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// إضافة مؤشر على تاريخ الإنشاء للبحث السريع
activitySchema.index({ createdAt: -1 });

// إضافة مؤشر على النوع للبحث السريع
activitySchema.index({ type: 1 });

const Activity = mongoose.model('Activity', activitySchema);

module.exports = Activity; 
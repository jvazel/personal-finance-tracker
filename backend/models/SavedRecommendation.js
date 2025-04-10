const mongoose = require('mongoose');

const SavedRecommendationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  steps: [{
    text: {
      type: String,
      required: true
    },
    completed: {
      type: Boolean,
      default: false
    }
  }],
  dateCreated: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('SavedRecommendation', SavedRecommendationSchema);
const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String 
  },
  url: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['article', 'video', 'course', 'book', 'tool', 'other'] 
  },
  rating: { 
    type: Number, 
    min: 0, 
    max: 5, 
    default: 0 
  },
  sourceType: { 
    type: String, 
    enum: ['scraped', 'user', 'curated'], 
    default: 'scraped' 
  },
  roadmapNodeId: { 
    type: String 
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Resource', resourceSchema);

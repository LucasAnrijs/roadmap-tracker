const mongoose = require('mongoose');

const roadmapSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String 
  },
  url: { 
    type: String, 
    required: true, 
    unique: true 
  },
  category: { 
    type: String 
  },
  nodes: [{
    id: { 
      type: String, 
      required: true 
    },
    title: { 
      type: String, 
      required: true 
    },
    description: { 
      type: String 
    },
    type: { 
      type: String, 
      enum: ['roadmap', 'topic', 'subtopic', 'skill'] 
    },
    parentId: { 
      type: String, 
      default: null 
    },
    resources: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resource'
    }],
    position: {
      x: { type: Number },
      y: { type: Number }
    }
  }],
  edges: [{
    source: { 
      type: String, 
      required: true 
    },
    target: { 
      type: String, 
      required: true 
    },
    type: { 
      type: String, 
      default: 'default' 
    }
  }],
  lastUpdated: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Roadmap', roadmapSchema);

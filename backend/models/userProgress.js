const mongoose = require('mongoose');

const userProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  roadmapId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Roadmap',
    required: true
  },
  completedNodes: [{
    nodeId: { 
      type: String, 
      required: true 
    },
    completedAt: { 
      type: Date, 
      default: Date.now 
    }
  }],
  currentNode: { 
    type: String 
  },
  startedAt: { 
    type: Date, 
    default: Date.now 
  },
  lastActivity: { 
    type: Date, 
    default: Date.now 
  }
});

// Create a compound index to ensure users can only have one progress record per roadmap
userProgressSchema.index({ userId: 1, roadmapId: 1 }, { unique: true });

// Method to check if a node is completed
userProgressSchema.methods.isNodeCompleted = function(nodeId) {
  return this.completedNodes.some(node => node.nodeId === nodeId);
};

// Method to calculate completion percentage
userProgressSchema.methods.getCompletionPercentage = async function() {
  try {
    const roadmap = await mongoose.model('Roadmap').findById(this.roadmapId);
    if (!roadmap) return 0;
    
    const totalNodes = roadmap.nodes.length;
    if (totalNodes === 0) return 0;
    
    const completedCount = this.completedNodes.length;
    return Math.round((completedCount / totalNodes) * 100);
  } catch (error) {
    return 0;
  }
};

module.exports = mongoose.model('UserProgress', userProgressSchema);

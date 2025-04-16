const Roadmap = require('../models/roadmap');
const logger = require('../utils/logger');

/**
 * Get all roadmaps
 */
exports.getAllRoadmaps = async (req, res) => {
  try {
    const roadmaps = await Roadmap.find({}, 'title description category url lastUpdated')
      .sort({ lastUpdated: -1 });
    
    res.status(200).json({
      success: true,
      count: roadmaps.length,
      data: roadmaps
    });
  } catch (error) {
    logger.error('Error fetching roadmaps:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch roadmaps',
      error: error.message
    });
  }
};

/**
 * Get roadmap by ID
 */
exports.getRoadmapById = async (req, res) => {
  try {
    const roadmap = await Roadmap.findById(req.params.id);
    
    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: roadmap
    });
  } catch (error) {
    logger.error(`Error fetching roadmap ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch roadmap',
      error: error.message
    });
  }
};

/**
 * Create new roadmap (admin only)
 */
exports.createRoadmap = async (req, res) => {
  try {
    // Check if user has admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }
    
    const roadmap = new Roadmap(req.body);
    await roadmap.save();
    
    res.status(201).json({
      success: true,
      message: 'Roadmap created successfully',
      data: roadmap
    });
  } catch (error) {
    logger.error('Error creating roadmap:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create roadmap',
      error: error.message
    });
  }
};

/**
 * Update roadmap (admin only)
 */
exports.updateRoadmap = async (req, res) => {
  try {
    // Check if user has admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }
    
    const roadmap = await Roadmap.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Roadmap updated successfully',
      data: roadmap
    });
  } catch (error) {
    logger.error(`Error updating roadmap ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to update roadmap',
      error: error.message
    });
  }
};

/**
 * Delete roadmap (admin only)
 */
exports.deleteRoadmap = async (req, res) => {
  try {
    // Check if user has admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }
    
    const roadmap = await Roadmap.findByIdAndDelete(req.params.id);
    
    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Roadmap deleted successfully'
    });
  } catch (error) {
    logger.error(`Error deleting roadmap ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete roadmap',
      error: error.message
    });
  }
};

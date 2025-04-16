const User = require('../models/user');
const UserProgress = require('../models/userProgress');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

/**
 * Register a new user
 */
exports.registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email or username'
      });
    }
    
    // Create new user
    const user = new User({
      username,
      email,
      password
    });
    
    await user.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register user',
      error: error.message
    });
  }
};

/**
 * Login user
 */
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to login',
      error: error.message
    });
  }
};

/**
 * Get user profile
 */
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile',
      error: error.message
    });
  }
};

/**
 * Get user progress for all roadmaps
 */
exports.getUserProgress = async (req, res) => {
  try {
    const userProgress = await UserProgress.find({ userId: req.user.id })
      .populate('roadmapId', 'title description category')
      .sort({ lastActivity: -1 });
    
    // Calculate completion percentage for each roadmap
    const progressWithPercentage = await Promise.all(
      userProgress.map(async (progress) => {
        const percentage = await progress.getCompletionPercentage();
        return {
          _id: progress._id,
          roadmap: progress.roadmapId,
          completedNodes: progress.completedNodes.length,
          currentNode: progress.currentNode,
          startedAt: progress.startedAt,
          lastActivity: progress.lastActivity,
          completionPercentage: percentage
        };
      })
    );
    
    res.status(200).json({
      success: true,
      count: progressWithPercentage.length,
      data: progressWithPercentage
    });
  } catch (error) {
    logger.error('Error fetching user progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user progress',
      error: error.message
    });
  }
};

/**
 * Get user progress for a specific roadmap
 */
exports.getRoadmapProgress = async (req, res) => {
  try {
    const { roadmapId } = req.params;
    
    const progress = await UserProgress.findOne({
      userId: req.user.id,
      roadmapId
    });
    
    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Progress not found for this roadmap'
      });
    }
    
    const completionPercentage = await progress.getCompletionPercentage();
    
    res.status(200).json({
      success: true,
      data: {
        _id: progress._id,
        roadmapId: progress.roadmapId,
        completedNodes: progress.completedNodes,
        currentNode: progress.currentNode,
        startedAt: progress.startedAt,
        lastActivity: progress.lastActivity,
        completionPercentage
      }
    });
  } catch (error) {
    logger.error(`Error fetching progress for roadmap ${req.params.roadmapId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch roadmap progress',
      error: error.message
    });
  }
};

/**
 * Update user progress for a roadmap
 */
exports.updateProgress = async (req, res) => {
  try {
    const { roadmapId } = req.params;
    const { nodeId, completed, currentNode } = req.body;
    
    // Find existing progress or create new one
    let progress = await UserProgress.findOne({
      userId: req.user.id,
      roadmapId
    });
    
    if (!progress) {
      // Create new progress entry
      progress = new UserProgress({
        userId: req.user.id,
        roadmapId,
        completedNodes: [],
        currentNode: currentNode || null
      });
    }
    
    // Update completed nodes
    if (nodeId && completed !== undefined) {
      if (completed) {
        // Add to completed nodes if not already present
        if (!progress.isNodeCompleted(nodeId)) {
          progress.completedNodes.push({
            nodeId,
            completedAt: Date.now()
          });
        }
      } else {
        // Remove from completed nodes
        progress.completedNodes = progress.completedNodes.filter(
          node => node.nodeId !== nodeId
        );
      }
    }
    
    // Update current node if provided
    if (currentNode) {
      progress.currentNode = currentNode;
    }
    
    // Update last activity timestamp
    progress.lastActivity = Date.now();
    
    await progress.save();
    
    // Calculate completion percentage
    const completionPercentage = await progress.getCompletionPercentage();
    
    res.status(200).json({
      success: true,
      message: 'Progress updated successfully',
      data: {
        _id: progress._id,
        roadmapId: progress.roadmapId,
        completedNodes: progress.completedNodes,
        currentNode: progress.currentNode,
        startedAt: progress.startedAt,
        lastActivity: progress.lastActivity,
        completionPercentage
      }
    });
  } catch (error) {
    logger.error(`Error updating progress for roadmap ${req.params.roadmapId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to update progress',
      error: error.message
    });
  }
};

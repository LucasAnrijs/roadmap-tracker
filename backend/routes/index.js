const express = require('express');
const router = express.Router();
const roadmapController = require('../controllers/roadmapController');
const userController = require('../controllers/userController');
const scraperController = require('../controllers/scraperController');
const authMiddleware = require('../middleware/auth');

// Public routes
router.get('/roadmaps', roadmapController.getAllRoadmaps);
router.get('/roadmaps/:id', roadmapController.getRoadmapById);
router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);

// Protected routes
router.use('/user', authMiddleware);
router.use('/scrape', authMiddleware);

router.get('/user/progress', userController.getUserProgress);
router.post('/user/progress/:roadmapId', userController.updateProgress);
router.post('/scrape/roadmaps', scraperController.scrapeAllRoadmaps);
router.post('/scrape/roadmaps/:roadmapId', scraperController.updateRoadmap);
router.get('/scrape/roadmaps/:roadmapId/nodes/:nodeId', scraperController.scrapeNodeDetail);

module.exports = router;

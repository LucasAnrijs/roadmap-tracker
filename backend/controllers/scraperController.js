const RoadmapScraper = require('../services/scraper/roadmapScraper');
const Roadmap = require('../models/roadmap');
const Resource = require('../models/resource');
const logger = require('../utils/logger');

/**
 * Scrape all roadmaps from roadmap.sh
 */
exports.scrapeAllRoadmaps = async (req, res) => {
  try {
    // Only admin can perform scraping operations
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }
    
    await RoadmapScraper.initialize();
    const roadmapList = await RoadmapScraper.scrapeRoadmapList();
    
    let updatedCount = 0;
    let newCount = 0;
    
    for (const roadmapInfo of roadmapList) {
      // Check if roadmap already exists
      let roadmap = await Roadmap.findOne({ url: roadmapInfo.url });
      
      if (roadmap) {
        // Update existing roadmap
        const roadmapData = await RoadmapScraper.scrapeRoadmapDetail(roadmapInfo.url);
        
        roadmap.title = roadmapInfo.title;
        roadmap.description = roadmapInfo.description;
        roadmap.nodes = roadmapData.nodes;
        roadmap.edges = roadmapData.edges;
        roadmap.lastUpdated = Date.now();
        
        await roadmap.save();
        updatedCount++;
      } else {
        // Scrape detailed roadmap data for new roadmap
        const roadmapData = await RoadmapScraper.scrapeRoadmapDetail(roadmapInfo.url);
        
        // Create new roadmap entry
        roadmap = new Roadmap({
          title: roadmapInfo.title,
          description: roadmapInfo.description,
          url: roadmapInfo.url,
          nodes: roadmapData.nodes,
          edges: roadmapData.edges
        });
        
        await roadmap.save();
        newCount++;
      }
      
      // Process resources if available
      if (roadmapData && roadmapData.resources) {
        for (const resourceData of roadmapData.resources) {
          // Check if resource already exists
          const existingResource = await Resource.findOne({ url: resourceData.url });
          
          if (!existingResource) {
            const resource = new Resource({
              title: resourceData.title,
              description: resourceData.description,
              url: resourceData.url,
              type: resourceData.type,
              roadmapNodeId: resourceData.nodeId
            });
            
            await resource.save();
            
            // Add resource to roadmap node
            const nodeIndex = roadmap.nodes.findIndex(node => node.id === resourceData.nodeId);
            if (nodeIndex !== -1) {
              roadmap.nodes[nodeIndex].resources.push(resource._id);
            }
          }
        }
        
        // Save roadmap with updated resources
        await roadmap.save();
      }
    }
    
    await RoadmapScraper.close();
    
    res.status(200).json({
      success: true,
      message: `Successfully scraped roadmaps: ${newCount} new, ${updatedCount} updated`
    });
  } catch (error) {
    logger.error('Error scraping roadmaps:', error);
    
    // Close browser if error occurs
    try {
      await RoadmapScraper.close();
    } catch (closeError) {
      logger.error('Error closing scraper browser:', closeError);
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to scrape roadmaps',
      error: error.message
    });
  }
};

/**
 * Update a specific roadmap
 */
exports.updateRoadmap = async (req, res) => {
  try {
    // Only admin can perform scraping operations
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }
    
    const { roadmapId } = req.params;
    const roadmap = await Roadmap.findById(roadmapId);
    
    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap not found'
      });
    }
    
    await RoadmapScraper.initialize();
    const roadmapData = await RoadmapScraper.scrapeRoadmapDetail(roadmap.url);
    
    // Update roadmap with new data
    roadmap.nodes = roadmapData.nodes;
    roadmap.edges = roadmapData.edges;
    roadmap.lastUpdated = Date.now();
    
    await roadmap.save();
    
    // Process resources if available
    if (roadmapData.resources) {
      let newResourceCount = 0;
      
      for (const resourceData of roadmapData.resources) {
        // Check if resource already exists
        const existingResource = await Resource.findOne({ url: resourceData.url });
        
        if (!existingResource) {
          const resource = new Resource({
            title: resourceData.title,
            description: resourceData.description,
            url: resourceData.url,
            type: resourceData.type,
            roadmapNodeId: resourceData.nodeId
          });
          
          await resource.save();
          
          // Add resource to roadmap node
          const nodeIndex = roadmap.nodes.findIndex(node => node.id === resourceData.nodeId);
          if (nodeIndex !== -1) {
            roadmap.nodes[nodeIndex].resources.push(resource._id);
          }
          
          newResourceCount++;
        }
      }
      
      // Save roadmap with updated resources
      await roadmap.save();
      
      await RoadmapScraper.close();
      
      res.status(200).json({
        success: true,
        message: `Roadmap updated successfully with ${newResourceCount} new resources`
      });
    } else {
      await RoadmapScraper.close();
      
      res.status(200).json({
        success: true,
        message: 'Roadmap updated successfully'
      });
    }
  } catch (error) {
    logger.error('Error updating roadmap:', error);
    
    // Close browser if error occurs
    try {
      await RoadmapScraper.close();
    } catch (closeError) {
      logger.error('Error closing scraper browser:', closeError);
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update roadmap',
      error: error.message
    });
  }
};

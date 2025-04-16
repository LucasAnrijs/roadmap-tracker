const mongoose = require('mongoose');
const config = require('./config/config');
const RoadmapScraper = require('./services/scraper/newRoadmapScraper');
const Roadmap = require('./models/roadmap');
const Resource = require('./models/resource');
const logger = require('./utils/logger');

/**
 * Script to scrape all roadmaps from roadmap.sh and update the database
 * Run with: node scrape-all.js
 */
async function scrapeAllRoadmaps() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.databaseUrl);
    console.log('Connected to database');
    
    // Initialize scraper
    console.log('Initializing scraper...');
    await RoadmapScraper.initialize();
    
    // Scrape roadmap list
    console.log('Scraping roadmap list...');
    const roadmapList = await RoadmapScraper.scrapeRoadmapList();
    console.log(`Found ${roadmapList.length} roadmaps`);
    
    let updatedCount = 0;
    let newCount = 0;
    
    // Process each roadmap
    for (const [index, roadmapInfo] of roadmapList.entries()) {
      if (!roadmapInfo.url) continue;
      
      console.log(`\nProcessing roadmap ${index + 1}/${roadmapList.length}: ${roadmapInfo.title}`);
      console.log(`URL: ${roadmapInfo.url}`);
      
      // Disable authentication check when running from command line
      // Check if roadmap already exists
      let roadmap = await Roadmap.findOne({ url: roadmapInfo.url });
      let roadmapData;
      
      if (roadmap) {
        console.log('Updating existing roadmap...');
        
        // Update existing roadmap
        roadmapData = await RoadmapScraper.scrapeRoadmapDetail(roadmapInfo.url);
        
        roadmap.title = roadmapInfo.title;
        roadmap.description = roadmapInfo.description || '';
        roadmap.category = roadmapInfo.category || 'Uncategorized';
        roadmap.nodes = roadmapData.nodes;
        roadmap.edges = roadmapData.edges;
        roadmap.lastUpdated = Date.now();
        
        await roadmap.save();
        updatedCount++;
      } else {
        console.log('Creating new roadmap entry...');
        
        // Scrape detailed roadmap data for new roadmap
        roadmapData = await RoadmapScraper.scrapeRoadmapDetail(roadmapInfo.url);
        
        // Create new roadmap entry
        roadmap = new Roadmap({
          title: roadmapInfo.title,
          description: roadmapInfo.description || '',
          category: roadmapInfo.category || 'Uncategorized',
          url: roadmapInfo.url,
          nodes: roadmapData.nodes,
          edges: roadmapData.edges
        });
        
        await roadmap.save();
        newCount++;
      }
      
      console.log(`Nodes: ${roadmapData.nodes.length}, Edges: ${roadmapData.edges.length}`);
      
      // Process resources if available
      if (roadmapData.resources && roadmapData.resources.length > 0) {
        console.log(`Processing ${roadmapData.resources.length} resources...`);
        let newResourceCount = 0;
        
        for (const resourceData of roadmapData.resources) {
          // Skip resources without URL
          if (!resourceData.url) continue;
          
          // Skip non-http URLs (likely internal links or anchors)
          if (!resourceData.url.startsWith('http')) continue;
          
          // Check if resource already exists
          const existingResource = await Resource.findOne({ url: resourceData.url });
          
          if (!existingResource) {
            const resource = new Resource({
              title: resourceData.title || 'Untitled Resource',
              description: resourceData.description || '',
              url: resourceData.url,
              type: resourceData.type || 'article',
              roadmapNodeId: resourceData.nodeId
            });
            
            await resource.save();
            
            // Add resource to roadmap node
            const nodeIndex = roadmap.nodes.findIndex(node => node.id === resourceData.nodeId);
            if (nodeIndex !== -1) {
              if (!roadmap.nodes[nodeIndex].resources) {
                roadmap.nodes[nodeIndex].resources = [];
              }
              roadmap.nodes[nodeIndex].resources.push(resource._id);
            }
            
            newResourceCount++;
          }
        }
        
        // Save roadmap with updated resources
        await roadmap.save();
        console.log(`Added ${newResourceCount} new resources`);
      } else {
        console.log('No resources found for this roadmap');
      }
    }
    
    console.log('\nScraping completed!');
    console.log(`Summary: ${newCount} new roadmaps, ${updatedCount} updated roadmaps`);
    
    // Close scraper and database connection
    await RoadmapScraper.close();
    await mongoose.disconnect();
    
    console.log('Done');
  } catch (error) {
    console.error('Error scraping roadmaps:', error);
    
    // Close browser if error occurs
    try {
      await RoadmapScraper.close();
    } catch (closeError) {
      console.error('Error closing scraper browser:', closeError);
    }
    
    // Close database connection
    try {
      await mongoose.disconnect();
    } catch (dbError) {
      console.error('Error disconnecting from database:', dbError);
    }
    
    process.exit(1);
  }
}

// Run the scraper
scrapeAllRoadmaps();

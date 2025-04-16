const mongoose = require('mongoose');
const dotenv = require('dotenv');
const RoadmapScraper = require('./services/scraper/newRoadmapScraper');
const Resource = require('./models/resource');
const logger = require('./utils/logger');

// Load environment variables
dotenv.config();

async function testResourceSaving() {
  try {
    console.log('Testing resource saving...');
    
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/roadmap-tracker');
    console.log('Connected to MongoDB');
    
    // Initialize the scraper
    console.log('Initializing scraper...');
    await RoadmapScraper.initialize();
    
    // Scrape a specific roadmap - frontend
    const url = 'https://roadmap.sh/frontend';
    console.log(`Scraping roadmap: ${url}...`);
    
    const roadmapData = await RoadmapScraper.scrapeRoadmapDetail(url);
    console.log(`Scraped roadmap with ${roadmapData.nodes.length} nodes and ${roadmapData.resources ? roadmapData.resources.length : 0} resources`);
    
    // Try saving resources
    console.log('\nAttempting to save resources...');
    
    if (roadmapData.resources && roadmapData.resources.length > 0) {
      let savedCount = 0;
      let errorCount = 0;
      
      for (const resourceData of roadmapData.resources) {
        try {
          // Log the resource data
          console.log(`\nResource: ${resourceData.title}`);
          console.log(`URL: ${resourceData.url}`);
          console.log(`Type: ${resourceData.type}`);
          console.log(`NodeID: ${resourceData.nodeId}`);
          
          // Check if type is in the enum values
          const validTypes = ['article', 'video', 'course', 'book', 'tool', 'other'];
          if (!validTypes.includes(resourceData.type)) {
            console.log(`WARNING: Invalid resource type '${resourceData.type}', setting to 'article'`);
            resourceData.type = 'article';
          }
          
          // Create and save a new resource
          const resource = new Resource({
            title: resourceData.title || 'Untitled Resource',
            description: resourceData.description || '',
            url: resourceData.url,
            type: resourceData.type,
            roadmapNodeId: resourceData.nodeId,
            sourceType: 'scraped'
          });
          
          await resource.save();
          console.log('--> Saved successfully!');
          savedCount++;
        } catch (error) {
          console.error('--> ERROR saving resource:', error.message);
          errorCount++;
        }
      }
      
      console.log(`\nResults: ${savedCount} resources saved, ${errorCount} errors`);
    } else {
      console.log('No resources found in the roadmap data');
    }
    
    // Close connections
    await RoadmapScraper.close();
    await mongoose.disconnect();
    
    console.log('\nTest completed');
  } catch (error) {
    console.error('Error during test:', error);
    
    // Close connections
    try {
      await RoadmapScraper.close();
    } catch (err) {}
    
    try {
      await mongoose.disconnect();
    } catch (err) {}
  }
}

testResourceSaving();

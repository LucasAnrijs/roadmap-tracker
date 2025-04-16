const RoadmapScraper = require('./services/scraper/newRoadmapScraper');
const logger = require('./utils/logger');

async function testNewScraper() {
  try {
    console.log('Initializing scraper...');
    await RoadmapScraper.initialize();
    
    console.log('Scraping roadmap list...');
    const roadmapList = await RoadmapScraper.scrapeRoadmapList();
    
    console.log(`Found ${roadmapList.length} roadmaps:`);
    roadmapList.forEach((roadmap, index) => {
      console.log(`${index + 1}. ${roadmap.title} (${roadmap.url}) - Category: ${roadmap.category}`);
    });
    
    if (roadmapList.length > 0) {
      // Test scraping a specific roadmap
      const testRoadmap = roadmapList[0];
      console.log(`\nScraping details for: ${testRoadmap.title} (${testRoadmap.url})`);
      
      const roadmapData = await RoadmapScraper.scrapeRoadmapDetail(testRoadmap.url);
      
      console.log(`Nodes: ${roadmapData.nodes.length}`);
      console.log(`Edges: ${roadmapData.edges.length}`);
      console.log(`Topics: ${roadmapData.topics ? roadmapData.topics.length : 'N/A'}`);
      console.log(`Resources: ${roadmapData.resources ? roadmapData.resources.length : 0}`);
      
      // Print some example nodes for verification
      if (roadmapData.nodes.length > 0) {
        console.log('\nSample nodes:');
        roadmapData.nodes.slice(0, 3).forEach((node, index) => {
          console.log(`Node ${index + 1}: ${node.id} - ${node.title} (${node.type})`);
          if (node.description) {
            console.log(`  Description: ${node.description.substring(0, 100)}...`);
          }
        });
      }
      
      // Print some example edges for verification
      if (roadmapData.edges.length > 0) {
        console.log('\nSample edges:');
        roadmapData.edges.slice(0, 3).forEach((edge, index) => {
          console.log(`Edge ${index + 1}: ${edge.source} -> ${edge.target} (${edge.type})`);
        });
      }
      
      // Print some example resources for verification
      if (roadmapData.resources && roadmapData.resources.length > 0) {
        console.log('\nSample resources:');
        roadmapData.resources.slice(0, 3).forEach((resource, index) => {
          console.log(`Resource ${index + 1}: ${resource.title}`);
          console.log(`  URL: ${resource.url}`);
          console.log(`  Type: ${resource.type}`);
          console.log(`  Node ID: ${resource.nodeId}`);
        });
      }
    }
    
    console.log('\nClosing scraper...');
    await RoadmapScraper.close();
    
    console.log('Test completed successfully');
  } catch (error) {
    console.error('Error during test:', error);
    
    // Make sure to close the browser
    try {
      await RoadmapScraper.close();
    } catch (closeError) {
      console.error('Error closing browser:', closeError);
    }
  }
}

// Run the test
testNewScraper();

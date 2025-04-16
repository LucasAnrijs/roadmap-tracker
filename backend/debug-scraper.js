const RoadmapScraper = require('./services/scraper/newRoadmapScraper');

async function debugScraper() {
  try {
    // Step 1: Initialize scraper with more detailed logging
    console.log('Initializing scraper with detailed logging...');
    await RoadmapScraper.initialize();
    
    // Step 2: Try to scrape the roadmap list
    console.log('\nAttempting to scrape roadmap list...');
    try {
      const roadmapList = await RoadmapScraper.scrapeRoadmapList();
      console.log(`Success! Found ${roadmapList.length} roadmaps`);
      
      // Log a few of the roadmaps for verification
      if (roadmapList.length > 0) {
        console.log('\nSample roadmaps:');
        roadmapList.slice(0, 3).forEach((roadmap, index) => {
          console.log(`${index + 1}. ${roadmap.title} (${roadmap.url})`);
        });
      }
    } catch (listError) {
      console.error('ERROR scraping roadmap list:', listError);
    }
    
    // Step 3: Try to scrape a specific roadmap detail
    const testUrl = 'https://roadmap.sh/frontend';
    console.log(`\nAttempting to scrape roadmap detail for ${testUrl}...`);
    try {
      const roadmapData = await RoadmapScraper.scrapeRoadmapDetail(testUrl);
      console.log(`Success! Found ${roadmapData.nodes.length} nodes, ${roadmapData.edges.length} edges`);
      
      if (roadmapData.resources) {
        console.log(`Found ${roadmapData.resources.length} resources`);
      }
    } catch (detailError) {
      console.error('ERROR scraping roadmap detail:', detailError);
    }
    
  } catch (error) {
    console.error('General error during debugging:', error);
  } finally {
    // Always close the browser
    console.log('\nClosing browser...');
    await RoadmapScraper.close();
    console.log('Debug completed');
  }
}

debugScraper();

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const scraperController = require('./controllers/scraperController');

// Load environment variables
dotenv.config();

// Mock request and response objects
const mockReq = {
  // No user object for direct command-line use
};

const mockRes = {
  status: function(code) {
    this.statusCode = code;
    console.log(`Response status: ${code}`);
    return this;
  },
  json: function(data) {
    console.log('Response:', data);
    return this;
  }
};

async function scrapeDirectly() {
  try {
    console.log('Starting direct scrape of all roadmaps...');
    
    // Connect to database
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/roadmap-tracker');
    console.log('Connected to MongoDB');
    
    // Call the controller function directly
    console.log('Running scrapeAllRoadmaps controller...');
    await scraperController.scrapeAllRoadmaps(mockReq, mockRes);
    
    // Disconnect
    console.log('Disconnecting from MongoDB...');
    await mongoose.disconnect();
    
    console.log('Scraping completed!');
  } catch (error) {
    console.error('Error during scraping:', error);
    
    try {
      await mongoose.disconnect();
    } catch (err) {
      // Ignore disconnection errors
    }
    
    process.exit(1);
  }
}

// Run the script
scrapeDirectly();

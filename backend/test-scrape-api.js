const mongoose = require('mongoose');
const dotenv = require('dotenv');
const scraperController = require('./controllers/scraperController');
const logger = require('./utils/logger');

// Load environment variables
dotenv.config();

// Mock middleware and request/response objects
const mockReq = {
  user: { role: 'admin' }
};

const mockRes = {
  status: function(code) {
    this.statusCode = code;
    console.log(`Response status: ${code}`);
    return this;
  },
  json: function(data) {
    console.log('Response data:', data);
    this.data = data;
    return this;
  }
};

async function testScrapeEndpoint() {
  try {
    console.log('Testing scrape API endpoint...');
    
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/roadmap-tracker');
    console.log('Connected to MongoDB');
    
    // Attempt to call the scrapeAllRoadmaps controller function
    console.log('\nAttempting to call scrapeAllRoadmaps controller...');
    
    await scraperController.scrapeAllRoadmaps(mockReq, mockRes);
    
    // Final cleanup
    console.log('\nDisconnecting from MongoDB...');
    await mongoose.disconnect();
    console.log('Test completed');
  } catch (error) {
    console.error('Error during test:', error);
    
    // Make sure to close the database connection
    try {
      await mongoose.disconnect();
    } catch (disconnectError) {
      console.error('Error disconnecting from MongoDB:', disconnectError);
    }
  }
}

testScrapeEndpoint();

const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const axios = require('axios');
const logger = require('../../utils/logger');

/**
 * Roadmap Scraper Service
 * Responsible for scraping roadmap data from roadmap.sh
 */
class RoadmapScraper {
  constructor() {
    this.browser = null;
    this.baseUrl = 'https://roadmap.sh';
  }

  /**
   * Initialize the browser
   */
  async initialize() {
    try {
      this.browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1920, height: 1080 }
      });
      logger.info('Browser initialized for scraping');
    } catch (error) {
      logger.error('Failed to initialize browser:', error);
      throw error;
    }
  }

  /**
   * Scrape the list of available roadmaps
   */
  async scrapeRoadmapList() {
    logger.info('Scraping roadmap list');
    try {
      const page = await this.browser.newPage();
      await page.goto(`${this.baseUrl}/roadmaps`, { 
        waitUntil: 'networkidle2',
        timeout: 60000
      });
      
      // Extract all available roadmaps
      const roadmaps = await page.evaluate(() => {
        const roadmapCards = document.querySelectorAll('.roadmap-card');
        return Array.from(roadmapCards).map(card => {
          const link = card.querySelector('a');
          return {
            title: card.querySelector('h3')?.textContent.trim(),
            url: link?.href,
            description: card.querySelector('p')?.textContent.trim()
          };
        }).filter(item => item.url && item.title);
      });
      
      await page.close();
      logger.info(`Found ${roadmaps.length} roadmaps`);
      return roadmaps;
    } catch (error) {
      logger.error('Error scraping roadmap list:', error);
      throw error;
    }
  }

  /**
   * Scrape detailed roadmap data
   */
  async scrapeRoadmapDetail(url) {
    logger.info(`Scraping roadmap detail for: ${url}`);
    try {
      const page = await this.browser.newPage();
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 60000
      });
      
      // Extract roadmap structure
      const roadmapData = await page.evaluate(() => {
        // Helper to generate unique IDs
        const generateId = (text) => {
          return text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        };
        
        // Find the roadmap container
        const roadmapContainer = document.querySelector('.roadmap-container');
        if (!roadmapContainer) return { nodes: [], edges: [] };
        
        // Extract nodes (topics, skills, etc.)
        const nodes = [];
        const edges = [];
        
        // Process group elements (topics)
        const groups = roadmapContainer.querySelectorAll('g.roadmap-group');
        groups.forEach(group => {
          const titleElement = group.querySelector('text.group-title');
          if (!titleElement) return;
          
          const title = titleElement.textContent.trim();
          const id = generateId(title);
          const groupRect = group.querySelector('rect');
          
          // Get position from transform attribute
          const transform = group.getAttribute('transform');
          let x = 0, y = 0;
          if (transform) {
            const match = transform.match(/translate\(([^,]+),([^)]+)\)/);
            if (match) {
              x = parseFloat(match[1]);
              y = parseFloat(match[2]);
            }
          }
          
          // Add group as node
          nodes.push({
            id,
            title,
            description: '',
            type: 'topic',
            parentId: null,
            position: { x, y },
            resources: []
          });
          
          // Process items within the group
          const items = group.querySelectorAll('.group-item');
          items.forEach(item => {
            const itemTitle = item.querySelector('.item-title')?.textContent.trim();
            if (!itemTitle) return;
            
            const itemId = `${id}-${generateId(itemTitle)}`;
            
            // Get item position
            let itemX = x, itemY = y;
            const itemTransform = item.getAttribute('transform');
            if (itemTransform) {
              const match = itemTransform.match(/translate\(([^,]+),([^)]+)\)/);
              if (match) {
                itemX += parseFloat(match[1]);
                itemY += parseFloat(match[2]);
              }
            }
            
            // Add item as node
            nodes.push({
              id: itemId,
              title: itemTitle,
              description: '',
              type: 'skill',
              parentId: id,
              position: { x: itemX, y: itemY },
              resources: []
            });
            
            // Add edge from group to item
            edges.push({
              source: id,
              target: itemId,
              type: 'default'
            });
          });
        });
        
        // Process connecting lines to establish edges
        const paths = roadmapContainer.querySelectorAll('path.connection');
        paths.forEach(path => {
          const sourceId = path.getAttribute('data-source');
          const targetId = path.getAttribute('data-target');
          
          if (sourceId && targetId) {
            edges.push({
              source: sourceId,
              target: targetId,
              type: 'connection'
            });
          }
        });
        
        return { nodes, edges };
      });
      
      // Extract resources
      const resources = await this.scrapeResources(page, roadmapData.nodes);
      
      await page.close();
      logger.info(`Scraped roadmap with ${roadmapData.nodes.length} nodes and ${roadmapData.edges.length} edges`);
      
      return {
        ...roadmapData,
        resources
      };
    } catch (error) {
      logger.error(`Error scraping roadmap detail for ${url}:`, error);
      throw error;
    }
  }

  /**
   * Scrape resources associated with roadmap nodes
   */
  async scrapeResources(page, nodes) {
    try {
      // Click on each node to reveal resources
      const resources = [];
      
      for (const node of nodes) {
        try {
          // Click on node to open details panel
          await page.evaluate((nodeId) => {
            const nodeElement = document.querySelector(`#${nodeId}`);
            if (nodeElement) nodeElement.click();
          }, node.id);
          
          // Wait for resources panel to load
          await page.waitForSelector('.resources-panel', { timeout: 5000 }).catch(() => {});
          
          // Extract resources from panel
          const nodeResources = await page.evaluate((nodeId) => {
            const resourcesList = document.querySelectorAll('.resources-panel .resource-item');
            return Array.from(resourcesList).map(item => {
              const link = item.querySelector('a');
              return {
                title: item.querySelector('.resource-title')?.textContent.trim(),
                description: item.querySelector('.resource-description')?.textContent.trim(),
                url: link?.href,
                type: item.classList.contains('video') ? 'video' : 
                      item.classList.contains('article') ? 'article' : 
                      item.classList.contains('course') ? 'course' : 'other',
                nodeId
              };
            }).filter(res => res.url && res.title);
          }, node.id);
          
          resources.push(...nodeResources);
          
          // Close panel
          await page.evaluate(() => {
            const closeButton = document.querySelector('.resources-panel .close-button');
            if (closeButton) closeButton.click();
          });
          
          // Wait a bit to avoid rate limiting
          await page.waitForTimeout(500);
        } catch (nodeError) {
          logger.warn(`Error processing resources for node ${node.id}:`, nodeError);
          continue;
        }
      }
      
      logger.info(`Scraped ${resources.length} resources`);
      return resources;
    } catch (error) {
      logger.error('Error scraping resources:', error);
      return [];
    }
  }

  /**
   * Close the browser
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      logger.info('Browser closed');
    }
  }
}

module.exports = new RoadmapScraper();

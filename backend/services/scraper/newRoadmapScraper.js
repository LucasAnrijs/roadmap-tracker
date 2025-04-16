const puppeteer = require('puppeteer');
const logger = require('../../utils/logger');

/**
 * New Roadmap Scraper Service
 * Redesigned to handle the updated roadmap.sh website
 */
class NewRoadmapScraper {
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
   * Scrape the list of available roadmaps from the roadmaps page
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
        // The roadmaps are now in grid containers with role-based and skill-based sections
        const allRoadmapLinks = document.querySelectorAll('.grid a[href*="/"]');
        
        // Process each roadmap link
        return Array.from(allRoadmapLinks).map(link => {
          // Get the relative URL
          const url = link.getAttribute('href');
          
          // Check if it's a valid roadmap link (not pointing to external sites or non-roadmap pages)
          if (!url || url.startsWith('http') || 
              url === '/roadmaps' || 
              url === '/best-practices' || 
              url === '/guides' || 
              url === '/videos') {
            return null;
          }
          
          // Get the title from the link text
          const title = link.textContent.trim();
          
          // Find the section heading to determine category
          let category = 'Uncategorized';
          const sectionHeading = link.closest('.grid').previousElementSibling;
          if (sectionHeading && sectionHeading.textContent) {
            category = sectionHeading.textContent.trim();
          }
          
          return {
            title: title,
            url: url.startsWith('/') ? `https://roadmap.sh${url}` : url,
            description: '', // No description available in the current layout
            category: category
          };
        }).filter(item => item && item.url && item.title);
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
   * Scrape detailed roadmap content
   * Now handles text-based roadmaps (the new format)
   */
  async scrapeRoadmapDetail(url) {
    logger.info(`Scraping roadmap detail for: ${url}`);
    try {
      const page = await this.browser.newPage();
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 60000
      });
      
      // Extract roadmap structure based on the new text-based format
      const roadmapData = await page.evaluate(() => {
        // Helper to generate unique IDs
        const generateId = (text) => {
          return text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        };
        
        // Extract the main content sections
        const contentSections = document.querySelectorAll('.container h1, .container h2, .container h3');
        if (!contentSections.length) return { nodes: [], edges: [], topics: [] };
        
        const nodes = [];
        const edges = [];
        const topics = [];
        let lastParentId = null;
        let yPosition = 0;
        
        // Process each heading element
        contentSections.forEach((section, index) => {
          const headingLevel = parseInt(section.tagName.charAt(1));
          const title = section.textContent.trim();
          const id = generateId(title);
          
          // Get content following this heading until the next heading
          let content = '';
          let nextElement = section.nextElementSibling;
          while (nextElement && !['H1', 'H2', 'H3'].includes(nextElement.tagName)) {
            if (nextElement.textContent) {
              content += nextElement.textContent.trim() + ' ';
            }
            nextElement = nextElement.nextElementSibling;
          }
          
          // Create node
          const node = {
            id,
            title,
            description: content.trim(),
            type: headingLevel === 1 ? 'roadmap' : headingLevel === 2 ? 'topic' : 'skill',
            parentId: headingLevel === 1 ? null : headingLevel === 2 ? null : lastParentId,
            position: { x: (headingLevel - 1) * 200, y: yPosition },
            resources: []
          };
          
          // Top-level (h1) elements are roadmap title
          // Second level (h2) elements are main topics
          // Third level (h3) elements are skills
          if (headingLevel === 1) {
            // Roadmap title
            topics.push({
              id,
              title,
              description: content.trim()
            });
          } else if (headingLevel === 2) {
            // This is a topic, record it as the last parent
            lastParentId = id;
            
            // Add to the topics array as well
            topics.push({
              id,
              title,
              description: content.trim()
            });
          } else if (headingLevel === 3 && lastParentId) {
            // If this is a skill and we have a parent topic, create an edge
            edges.push({
              source: lastParentId,
              target: id,
              type: 'default'
            });
          }
          
          nodes.push(node);
          yPosition += 100; // Increment position for visual spacing
        });
        
        return {
          nodes,
          edges,
          topics,
          isTextBased: true
        };
      });
      
      // Extract resources if any are available
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
   * In the new format, resources might be inline links
   */
  async scrapeResources(page, nodes) {
    try {
      // The new format doesn't have dedicated resource panels
      // Try to extract inline links from the page
      const resources = await page.evaluate((nodeIds) => {
        const resourceList = [];
        
        // Process each node ID
        nodeIds.forEach(nodeId => {
          // Look for links within or near each heading
          const section = document.getElementById(nodeId) || 
                         document.querySelector(`[id="${nodeId}"]`) ||
                         document.querySelector(`h1, h2, h3, h4`);
          
          if (!section) return;
          
          // Function to extract resources from an element and its next siblings
          const extractResourcesFromElement = (element, depth = 0, maxDepth = 5) => {
            if (!element || depth > maxDepth) return;
            
            // If it's a link, add it as a resource
            if (element.tagName === 'A' && element.href) {
              resourceList.push({
                title: element.textContent.trim() || 'Link',
                description: '',
                url: element.href,
                type: element.href.includes('youtube.com') ? 'video' : 'article',
                nodeId
              });
            }
            
            // Check link elements within
            const links = element.querySelectorAll('a');
            links.forEach(link => {
              if (link.href) {
                resourceList.push({
                  title: link.textContent.trim() || 'Link',
                  description: '',
                  url: link.href,
                  type: link.href.includes('youtube.com') ? 'video' : 'article',
                  nodeId
                });
              }
            });
            
            // Process next sibling if exists
            if (element.nextElementSibling) {
              extractResourcesFromElement(element.nextElementSibling, depth + 1, maxDepth);
            }
          };
          
          // Start extraction from the section
          extractResourcesFromElement(section.nextElementSibling);
        });
        
        return resourceList;
      }, nodes.map(n => n.id));
      
      logger.info(`Scraped ${resources.length} resources`);
      return resources;
    } catch (error) {
      logger.error('Error scraping resources:', error);
      return [];
    }
  }

  /**
   * Scrape detailed content for a specific node
   * Used when a user selects a node to get more in-depth resources and learning paths
   */
  async scrapeNodeDetail(roadmapUrl, nodeId) {
    logger.info(`Scraping node detail for roadmap: ${roadmapUrl}, node: ${nodeId}`);
    try {
      // Log the starting point for debugging
      logger.info(`Starting node detail scrape for: ${nodeId}`);
      const page = await this.browser.newPage();
      
      // First try to check if there's a dedicated page for this node
      // Many roadmap topics have their own detailed pages
      const url = new URL(roadmapUrl);
      const basePathname = url.pathname.replace(/\/$/, ''); // Remove trailing slash if present
      
      // Extract the roadmap name from the URL (last part of the pathname)
      const roadmapName = basePathname.split('/').pop();
      
      // Construct the URL correctly - don't duplicate the roadmap name
      // If nodeId is the same as roadmapName, don't append it again
      let possibleNodeUrl;
      if (nodeId === roadmapName) {
        // In case node ID is the same as roadmap name, just use the roadmap URL
        possibleNodeUrl = roadmapUrl;
        logger.info(`Node ID same as roadmap name, using base URL: ${possibleNodeUrl}`);
      } else {
        // Otherwise, construct URL with roadmap base path + node ID
        possibleNodeUrl = `${url.origin}${basePathname}/${nodeId}`;
        logger.info(`Constructed node detail URL: ${possibleNodeUrl}`);
      }
      
      logger.info(`Checking for dedicated node page at: ${possibleNodeUrl}`);
      
      // Normalize the node ID to check against roadmap.sh URL patterns
      // roadmap.sh often uses kebab-case for URLs
      const normalizedNodeId = nodeId.toLowerCase()
        .replace(/\s+/g, '-')       // Replace spaces with hyphens
        .replace(/[^a-z0-9-]/g, '') // Remove special characters
        .replace(/-+/g, '-')        // Replace multiple hyphens with single hyphen
        .replace(/^-|-$/g, '');     // Remove leading/trailing hyphens
      
      logger.info(`Original NodeID: ${nodeId}, Normalized NodeID: ${normalizedNodeId}`);
      
      // Also create a variation with the roadmap name prepended if it's not already there
      // This helps with cases where the node might have a path like /roadmap-name/node-name
      const alternateNodeUrl = normalizedNodeId.includes(roadmapName.toLowerCase()) 
        ? `${url.origin}${basePathname}/${normalizedNodeId}`
        : `${url.origin}${basePathname}/${roadmapName.toLowerCase()}-${normalizedNodeId}`;
        
      logger.info(`Alternate node URL: ${alternateNodeUrl}`);
      
      // Try to navigate to a possible dedicated page
      try {
        logger.info(`Attempting to access node URL: ${possibleNodeUrl}`);
        await page.goto(possibleNodeUrl, { 
          waitUntil: 'networkidle2',
          timeout: 20000 // Short timeout just to check if page exists
        });
        
        // If page loaded successfully, extract content from it
        const dedicatedPageContent = await page.evaluate(() => {
          const mainHeading = document.querySelector('h1');
          if (!mainHeading) return { found: false };
          
          // Extract resources
          const resources = [];
          const links = document.querySelectorAll('a[href]');
          
          links.forEach(link => {
            if (link.href && !link.href.includes('roadmap.sh') && 
                !link.href.includes('#') && link.textContent.trim()) {
              
              resources.push({
                title: link.textContent.trim(),
                url: link.href,
                type: link.href.includes('youtube.com') ? 'video' : 'article',
                description: '',
              });
            }
          });
          
          // Extract content
          const mainContent = document.querySelector('main') || document.body;
          
          return {
            found: true,
            title: mainHeading.textContent.trim(),
            contentHTML: mainContent.innerHTML,
            resources,
            isDedicatedPage: true
          };
        });
        
        if (dedicatedPageContent.found) {
          logger.info(`Found dedicated page for node ${nodeId} with ${dedicatedPageContent.resources.length} resources`);
          
          // Add nodeId to all resources
          dedicatedPageContent.resources = dedicatedPageContent.resources.map(r => ({
            ...r,
            nodeId
          }));
          
          // Add additional fields needed for the response
          dedicatedPageContent.nodeId = nodeId;
          dedicatedPageContent.learningPaths = [];
          dedicatedPageContent.detailPageUrl = possibleNodeUrl;
          
          await page.close();
          return dedicatedPageContent;
        }
      } catch (dedicatedPageError) {
        logger.info(`No dedicated page found at primary URL for node ${nodeId}, trying alternate URL`);
        
        // Try the alternate URL as a fallback
        try {
          logger.info(`Attempting to access alternate node URL: ${alternateNodeUrl}`);
          await page.goto(alternateNodeUrl, { 
            waitUntil: 'networkidle2',
            timeout: 20000 
          });
          
          // If we get here, the page loaded successfully - extract content same as before
          const alternatePageContent = await page.evaluate(() => {
            const mainHeading = document.querySelector('h1');
            if (!mainHeading) return { found: false };
            
            // Extract resources
            const resources = [];
            const links = document.querySelectorAll('a[href]');
            
            links.forEach(link => {
              if (link.href && !link.href.includes('roadmap.sh') && 
                  !link.href.includes('#') && link.textContent.trim()) {
                
                resources.push({
                  title: link.textContent.trim(),
                  url: link.href,
                  type: link.href.includes('youtube.com') ? 'video' : 'article',
                  description: '',
                });
              }
            });
            
            // Extract content
            const mainContent = document.querySelector('main') || document.body;
            
            return {
              found: true,
              title: mainHeading.textContent.trim(),
              contentHTML: mainContent.innerHTML,
              resources,
              isDedicatedPage: true
            };
          });
          
          if (alternatePageContent.found) {
            logger.info(`Found alternate dedicated page for node ${nodeId} with ${alternatePageContent.resources.length} resources`);
            
            // Add nodeId to all resources
            alternatePageContent.resources = alternatePageContent.resources.map(r => ({
              ...r,
              nodeId
            }));
            
            // Add additional fields needed for the response
            alternatePageContent.nodeId = nodeId;
            alternatePageContent.learningPaths = [];
            alternatePageContent.detailPageUrl = alternateNodeUrl;
            
            await page.close();
            return alternatePageContent;
          }
        } catch (alternateError) {
          logger.info(`No dedicated page found at alternate URL for node ${nodeId}, falling back to main roadmap page`);
        }
        
        // Continue with normal scraping if dedicated page doesn't exist at either URL
      }
      
      // Fall back to using the main roadmap page
      await page.goto(roadmapUrl, { 
        waitUntil: 'networkidle2',
        timeout: 60000
      });
      
      // Log the page URL for debugging
      logger.info(`Page URL: ${await page.url()}`);
      
      // Extract node specific content
      const nodeData = await page.evaluate((nodeId) => {
        console.log(`Looking for node with ID: ${nodeId}`);
        
        // Find the specific node section by ID
        const nodeSection = document.getElementById(nodeId) || 
                          document.querySelector(`[id="${nodeId}"]`) ||
                          document.querySelector(`h2[data-id="${nodeId}"]`) ||
                          document.querySelector(`h3[data-id="${nodeId}"]`);
        
        // Log available heading elements for debugging
        const allHeadings = Array.from(document.querySelectorAll('h1, h2, h3'));
        console.log('Available headings on the page:', allHeadings.map(h => ({
          tagName: h.tagName,
          id: h.id || 'no-id',
          text: h.textContent.trim().substring(0, 30),
          dataId: h.getAttribute('data-id') || 'no-data-id'
        })));
        
        if (!nodeSection) {
          return { 
            found: false,
            error: 'Node section not found',
            searchedForId: nodeId,
            availableIds: Array.from(document.querySelectorAll('[id]')).map(el => el.id)
          };
        }
        
        // Get node title
        const nodeTitle = nodeSection.textContent.trim();
        
        // Find resources section - links within and after this section until the next heading
        const resources = [];
        
        // Function to collect content within node section
        const collectContentAndResources = (element, depth = 0, maxDepth = 15) => {
          if (!element || depth > maxDepth || 
              (depth > 0 && ['H1', 'H2', 'H3'].includes(element.tagName))) {
            return { content: '', reachedNextHeading: true };
          }
          
          let contentText = '';
          let isNextHeading = false;
          
          // Process the current element
          if (element.tagName === 'A' && element.href) {
            // Found a link - add to resources
            resources.push({
              title: element.textContent.trim() || 'Resource link',
              url: element.href,
              type: element.href.includes('youtube.com') ? 'video' : 'article',
              description: '',
              nodeId: nodeId
            });
            contentText += element.outerHTML;
          } else if (element.tagName === 'UL' || element.tagName === 'OL') {
            // Process list items specially
            const listItems = element.querySelectorAll('li');
            listItems.forEach(li => {
              const links = li.querySelectorAll('a');
              if (links.length > 0) {
                links.forEach(link => {
                  if (link.href) {
                    resources.push({
                      title: link.textContent.trim() || 'List resource',
                      url: link.href,
                      type: link.href.includes('youtube.com') ? 'video' : 'article',
                      description: li.textContent.replace(link.textContent, '').trim(),
                      nodeId: nodeId
                    });
                  }
                });
              }
              contentText += li.outerHTML;
            });
          } else {
            // Regular element - get its text content
            contentText += element.outerHTML;
          }
          
          // Process next sibling recursively
          if (element.nextElementSibling) {
            const nextResult = collectContentAndResources(element.nextElementSibling, depth + 1, maxDepth);
            contentText += nextResult.content;
            isNextHeading = nextResult.reachedNextHeading;
          }
          
          return { content: contentText, reachedNextHeading: isNextHeading };
        };
        
        // Start collecting content from the element after the heading
        let contentHTML = '';
        if (nodeSection.nextElementSibling) {
          const contentResult = collectContentAndResources(nodeSection.nextElementSibling);
          contentHTML = contentResult.content;
        }
        
        // Check if this node has any associated detail page
        // Some roadmap nodes might link to a detailed guide page
        let detailPageUrl = null;
        const possibleDetailLinks = nodeSection.querySelectorAll('a');
        possibleDetailLinks.forEach(link => {
          if (link.href && link.href.includes('/guides/') || 
              link.href.includes('/videos/') || 
              link.href.includes('/best-practices/')) {
            detailPageUrl = link.href;
          }
        });
        
        // Create learning paths based on the content structure
        // Learning paths are sequences of topics to follow
        const learningPaths = [];
        
        // Look for ordered lists which might represent learning paths
        const orderedLists = document.querySelectorAll(`#${nodeId} + * ol, #${nodeId} + * ul`);
        orderedLists.forEach((list, index) => {
          const items = list.querySelectorAll('li');
          if (items.length >= 3) { // Only consider substantial lists
            const pathItems = Array.from(items).map((item, stepIndex) => {
              // Extract any links in the list item
              const links = item.querySelectorAll('a');
              const resources = Array.from(links).map(link => ({
                title: link.textContent.trim(),
                url: link.href,
                type: link.href.includes('youtube.com') ? 'video' : 'article'
              }));
              
              return {
                step: stepIndex + 1,
                title: item.textContent.trim(),
                description: '',
                resources: resources
              };
            });
            
            learningPaths.push({
              id: `path-${nodeId}-${index}`,
              title: `${nodeTitle} - Learning Path ${index + 1}`,
              description: 'Follow these steps to master this topic',
              steps: pathItems
            });
          }
        });
        
        return {
          found: true,
          nodeId,
          title: nodeTitle,
          contentHTML,
          resources,
          learningPaths,
          detailPageUrl
        };
      }, nodeId);
      
      // If a detail page URL was found, scrape that page too for additional resources
      if (nodeData.found && nodeData.detailPageUrl) {
        try {
          await page.goto(nodeData.detailPageUrl, { 
            waitUntil: 'networkidle2',
            timeout: 60000
          });
          
          // Extract additional resources from the detail page
          const detailPageResources = await page.evaluate((nodeId) => {
            const resources = [];
            
            // Find all links in the main content area
            const contentArea = document.querySelector('main') || document.body;
            const links = contentArea.querySelectorAll('a[href]');
            
            links.forEach(link => {
              if (link.href && !link.href.includes('roadmap.sh')) {
                // Extract description from parent paragraph if available
                let description = '';
                if (link.parentElement && link.parentElement.tagName === 'P') {
                  description = link.parentElement.textContent.replace(link.textContent, '').trim();
                }
                
                resources.push({
                  title: link.textContent.trim() || 'Detail resource',
                  url: link.href,
                  type: link.href.includes('youtube.com') ? 'video' : 'article',
                  description: description,
                  nodeId: nodeId,
                  isFromDetailPage: true
                });
              }
            });
            
            return resources;
          }, nodeId);
          
          // Add these resources to the node data
          nodeData.resources = [...nodeData.resources, ...detailPageResources];
        } catch (detailError) {
          logger.warn(`Error scraping detail page for node ${nodeId}:`, detailError);
          // Continue with the resources we have already
        }
      }
      
      await page.close();
      
      // If node not found, try a fallback approach to find resources
      if (!nodeData.found) {
        logger.warn(`Node section not found for ${nodeId} in roadmap ${roadmapUrl}, trying fallback approach`);
        
        try {
          // Re-open page for fallback approach
          const fallbackPage = await this.browser.newPage();
          await fallbackPage.goto(roadmapUrl, { 
            waitUntil: 'networkidle2',
            timeout: 60000
          });
          
          // Try to find the node by title text instead of ID - pass both original nodeId and normalized version
          const fallbackData = await fallbackPage.evaluate(async (params) => {
            const { nodeId, normalizedNodeId } = params;
            // Find headings that might contain the node title
            const allHeadings = Array.from(document.querySelectorAll('h1, h2, h3, h4'));
            
            console.log(`Looking for node title containing: ${nodeId} or ${normalizedNodeId}`);
            console.log('Available headings:', allHeadings.map(h => h.textContent.trim()).join(', '));
            
            // Find heading that contains the title text (case insensitive)
            // Try multiple approaches to find a match
            let matchingHeading = allHeadings.find(heading => 
              heading.textContent.trim().toLowerCase() === nodeId.toLowerCase()
            );
            
            // If no exact match, try with normalized version
            if (!matchingHeading) {
              matchingHeading = allHeadings.find(heading => 
                heading.textContent.trim().toLowerCase() === normalizedNodeId.toLowerCase()
              );
            }
            
            // If still no match, try partial match
            if (!matchingHeading) {
              matchingHeading = allHeadings.find(heading => 
                heading.textContent.trim().toLowerCase().includes(nodeId.toLowerCase())
              );
            }
            
            // Last resort - try with normalized partial match
            if (!matchingHeading) {
              matchingHeading = allHeadings.find(heading => 
                heading.textContent.trim().toLowerCase().includes(normalizedNodeId.toLowerCase())
              );
            }
            
            if (!matchingHeading) {
              return {
                found: false,
                error: 'No matching heading found with fallback search'
              };
            }
            
            // Extract resources from this section
            const resources = [];
            let currentElement = matchingHeading.nextElementSibling;
            let maxElements = 20; // Safety limit
            
            while (currentElement && maxElements > 0) {
              // Stop if we hit another heading of same or higher level
              if (currentElement.tagName.match(/^H[1-3]$/)) {
                break;
              }
              
              // Find links in this element
              const links = currentElement.querySelectorAll('a[href]');
              links.forEach(link => {
                if (link.href) {
                  resources.push({
                    title: link.textContent.trim() || 'Resource link',
                    url: link.href,
                    type: link.href.includes('youtube.com') ? 'video' : 'article',
                    description: '',
                    nodeId: 'fallback-search'
                  });
                }
              });
              
              currentElement = currentElement.nextElementSibling;
              maxElements--;
            }
            
            return {
              found: true,
              title: matchingHeading.textContent.trim(),
              resources,
              learningPaths: [],
              contentHTML: ''
            };
          }, { 
            nodeId: nodeData.searchedForId || nodeId, 
            normalizedNodeId: normalizedNodeId 
          });
          
          await fallbackPage.close();
          
          if (fallbackData.found) {
            logger.info(`Found ${fallbackData.resources.length} resources with fallback search`);
            return fallbackData;
          }
        } catch (fallbackError) {
          logger.error('Error in fallback scraping approach:', fallbackError);
        }
        
        // If all attempts failed, return empty result
        return {
          nodeId,
          found: false,
          resources: [],
          learningPaths: [],
          error: 'Node content not found using any method'
        };
      }
      
      logger.info(`Scraped node detail for ${nodeId} with ${nodeData.resources.length} resources and ${nodeData.learningPaths.length} learning paths`);
      return nodeData;
    } catch (error) {
      logger.error(`Error scraping node detail for ${nodeId}:`, error);
      throw error;
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

module.exports = new NewRoadmapScraper();

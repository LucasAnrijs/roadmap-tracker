const puppeteer = require('puppeteer');

async function testRoadmapDetail() {
  console.log('Testing roadmap detail scraping...');
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1920, height: 1080 }
  });

  try {
    const page = await browser.newPage();
    
    // Try to load a specific roadmap page
    const url = 'https://roadmap.sh/react';
    console.log(`Loading ${url}`);
    
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    
    // Check if page loaded properly
    const title = await page.title();
    console.log(`Page title: ${title}`);
    
    // Check for SVG content
    const hasSvgContent = await page.evaluate(() => {
      const svgElements = document.querySelectorAll('svg');
      return {
        totalSvgElements: svgElements.length,
        svgClassNames: Array.from(svgElements).map(svg => svg.className?.baseVal || 'no-class'),
        hasSvgRoadmap: !!document.querySelector('svg.roadmap-svg, .roadmap-container svg, .roadmap-wrapper svg')
      };
    });
    
    console.log('SVG Content Analysis:', hasSvgContent);
    
    // Analyze page structure
    const pageStructure = await page.evaluate(() => {
      function describeElement(element) {
        if (!element) return 'null';
        return {
          tagName: element.tagName.toLowerCase(),
          id: element.id || null,
          className: element.className || null,
          childrenCount: element.children.length
        };
      }
      
      // Try to find main roadmap containers
      const possibleContainers = [
        '.roadmap-container', 
        '.roadmap-wrapper', 
        '.roadmap-content',
        'svg.roadmap-svg',
        '.container svg'
      ];
      
      const containers = {};
      possibleContainers.forEach(selector => {
        const element = document.querySelector(selector);
        containers[selector] = describeElement(element);
      });
      
      // Check for headings and text content for text-based roadmaps
      const textContent = {
        h1Count: document.querySelectorAll('h1').length,
        h2Count: document.querySelectorAll('h2').length,
        h3Count: document.querySelectorAll('h3').length,
        mainContent: describeElement(document.querySelector('main')),
        container: describeElement(document.querySelector('.container'))
      };
      
      return {
        containers,
        textContent,
        html: document.documentElement.innerHTML.substring(0, 5000) // First 5000 chars of HTML
      };
    });
    
    console.log('Page Structure Analysis:');
    console.log('Containers:', JSON.stringify(pageStructure.containers, null, 2));
    console.log('Text Content:', JSON.stringify(pageStructure.textContent, null, 2));
    
    // Try to find roadmap SVG structure
    const svgStructure = await page.evaluate(() => {
      // Find the roadmap container
      const svg = document.querySelector('svg.roadmap-svg') || document.querySelector('.roadmap-container svg') || document.querySelector('.roadmap-wrapper svg');
      
      if (!svg) {
        return { found: false };
      }
      
      // Analyze groups
      const groups = svg.querySelectorAll('g');
      const groupTypes = {};
      
      groups.forEach(group => {
        const className = group.className?.baseVal || 'no-class';
        if (!groupTypes[className]) {
          groupTypes[className] = 0;
        }
        groupTypes[className]++;
      });
      
      // Check for topic/group titles
      const titleElements = svg.querySelectorAll('text');
      const titles = Array.from(titleElements).slice(0, 5).map(text => ({
        content: text.textContent.trim(),
        class: text.className?.baseVal || 'no-class'
      }));
      
      // Check for connections/paths
      const connections = svg.querySelectorAll('path, line');
      const connectionTypes = {};
      
      connections.forEach(conn => {
        const className = conn.className?.baseVal || 'no-class';
        if (!connectionTypes[className]) {
          connectionTypes[className] = 0;
        }
        connectionTypes[className]++;
      });
      
      return {
        found: true,
        groupTypes,
        titles,
        connectionTypes,
        // Sample one group to analyze its structure
        sampleGroup: (() => {
          const group = svg.querySelector('g[class*="group"], g[class*="topic"]');
          if (!group) return null;
          
          return {
            className: group.className?.baseVal || 'no-class',
            transform: group.getAttribute('transform'),
            childElements: Array.from(group.children).slice(0, 5).map(child => ({
              tagName: child.tagName.toLowerCase(),
              className: child.className?.baseVal || 'no-class',
              text: child.tagName.toLowerCase() === 'text' ? child.textContent.trim() : null
            }))
          };
        })()
      };
    });
    
    console.log('SVG Structure Analysis:', JSON.stringify(svgStructure, null, 2));
    
    // Test resource panel functionality if SVG exists
    if (svgStructure.found) {
      console.log('\nTesting resource panel functionality...');
      
      const resourcesTest = await page.evaluate(async () => {
        // Find a clickable element (topic, group, or skill)
        const clickableElement = document.querySelector('g[class*="group"], g[class*="topic"], g[class*="item"]');
        
        if (!clickableElement) {
          return { found: false, message: 'No clickable elements found' };
        }
        
        // Simulate click
        clickableElement.dispatchEvent(new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window
        }));
        
        // Add a delay to let resource panel appear if it exists
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if a resource panel appeared
        const resourcePanel = document.querySelector('.resources-panel, .resource-panel, .panel, .sidebar');
        
        if (!resourcePanel) {
          return { 
            found: false, 
            message: 'No resource panel found after click',
            clickedElement: {
              tagName: clickableElement.tagName.toLowerCase(),
              className: clickableElement.className?.baseVal || 'no-class'
            }
          };
        }
        
        // Check resource items
        const resourceItems = resourcePanel.querySelectorAll('a, .resource-item, .resource');
        
        return {
          found: true,
          panelClass: resourcePanel.className,
          resourceCount: resourceItems.length,
          resourceSample: Array.from(resourceItems).slice(0, 3).map(item => ({
            text: item.textContent.trim(),
            href: item.href || null,
            className: item.className
          }))
        };
      });
      
      console.log('Resource Panel Test:', JSON.stringify(resourcesTest, null, 2));
    }
    
  } catch (error) {
    console.error('Error during testing:', error);
  } finally {
    await browser.close();
    console.log('Test completed');
  }
}

testRoadmapDetail();

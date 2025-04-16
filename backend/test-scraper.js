const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function checkRoadmapSite() {
  // Make sure we have a place to store debug info
  const debugDir = './logs';
  if (!fs.existsSync(debugDir)){
    fs.mkdirSync(debugDir);
  }
  try {
    console.log('Fetching roadmap.sh/roadmaps...');
    const response = await axios.get('https://roadmap.sh/roadmaps');
    
    // Check status
    console.log(`Status: ${response.status}`);
    
    // Save full HTML for inspection
    fs.writeFileSync('./logs/roadmap-page.html', response.data);
    console.log('Full HTML saved to ./logs/roadmap-page.html');
    console.log(`Content type: ${response.headers['content-type']}`);
    
    // Parse HTML
    const $ = cheerio.load(response.data);
    
    // Log page title
    console.log(`Page title: ${$('title').text()}`);
    
    // Try to find roadmap cards based on current scraper logic
    const roadmapCards = $('.roadmap-card');
    console.log(`Found ${roadmapCards.length} roadmap cards using '.roadmap-card' selector`);
    
    // Look specifically for the roadmap content area
    console.log('\nSearching for roadmap content area:');
    const mainPage = $('body');
    const roadmapSections = mainPage.find('section');
    console.log(`Found ${roadmapSections.length} sections on the page`);
    
    // Check each section
    roadmapSections.each((i, section) => {
      const $section = $(section);
      const headings = $section.find('h1, h2, h3');
      const roadmapLinks = $section.find('a[href*="/roadmap"]');
      
      console.log(`\nSection #${i+1}:`);
      console.log(`  Class: "${$section.attr('class') || 'no-class'}"`);
      console.log(`  Headings: ${headings.length}, First heading: "${headings.first().text().trim()}"`);
      console.log(`  Roadmap links: ${roadmapLinks.length}`);
      
      // If this section has roadmap links, inspect more deeply
      if (roadmapLinks.length > 0) {
        console.log('  This section contains roadmap links!');
        const firstLink = roadmapLinks.first();
        console.log(`  First link: ${firstLink.text().trim()} -> ${firstLink.attr('href')}`);
        
        // Look at the structure around this link
        const linkParent = firstLink.parent();
        console.log(`  Link parent: <${linkParent.prop('tagName')}> class="${linkParent.attr('class') || 'no-class'}"`);
        
        // Check for any divs that might be cards
        const cards = $section.find('div').filter(function() {
          const $this = $(this);
          // Check if this div contains a roadmap link directly
          return $this.find('> a[href*="/roadmap"]').length > 0 || 
                 // Or if it's a standalone child with a heading and link
                 ($this.find('h1, h2, h3, h4').length > 0 && $this.find('a[href*="/roadmap"]').length > 0);
        });
        
        console.log(`  Potential roadmap cards found: ${cards.length}`);
        
        if (cards.length > 0) {
          // Found potential roadmap cards - examine the first one
          const firstCard = cards.first();
          console.log(`  First card class: "${firstCard.attr('class') || 'no-class'}"`);
          console.log(`  First card HTML: "${firstCard.html().substring(0, 200)}..."`);
          
          // Save an example card for reference
          fs.writeFileSync('./logs/example-card.html', firstCard.html());
          console.log('  Example card HTML saved to ./logs/example-card.html');
        }
      }
    });
    
    // Let's look for other potential roadmap container classes
    const potentialSelectors = [
      '.card', 
      '.roadmap', 
      '.guide-card', 
      '.roadmap-box', 
      '.card-container',
      '.grid-item',
      '.guide',
      '.block',
      '.item',
      '.roadmap-item',
      '.topic-card'
    ];
    
    for (const selector of potentialSelectors) {
      const elements = $(selector);
      console.log(`Found ${elements.length} elements using '${selector}' selector`);
      
      // If we found elements, log the first one
      if (elements.length > 0) {
        console.log(`First element with '${selector}' has text: ${elements.first().text().trim().substring(0, 50)}...`);
      }
    }
    
    // Try to find any links that might be roadmaps
    const links = $('a');
    console.log(`\nTotal links on page: ${links.length}`);
    
    // Find links that contain "roadmap" in their href
    const roadmapLinks = links.filter((i, el) => {
      const href = $(el).attr('href');
      return href && href.includes('/roadmap');
    });
    
    console.log(`Found ${roadmapLinks.length} links containing '/roadmap' in href`);
    
    // Log the first 5 roadmap links
    console.log('\nFirst 5 roadmap links:');
    roadmapLinks.slice(0, 5).each((i, el) => {
      console.log(`${i + 1}. ${$(el).text().trim()} -> ${$(el).attr('href')}`);
    });
    
    // Extract and log detailed info about roadmap link parents
    console.log('\nAnalyzing roadmap link parent elements:');
    roadmapLinks.slice(0, 10).each((i, el) => {
      const $el = $(el);
      const $parent = $el.parent();
      const $grandparent = $parent.parent();
      const $greatGrandparent = $grandparent.parent();
      
      console.log(`\nRoadmap Link #${i + 1}: ${$el.text().trim()} -> ${$el.attr('href')}`);
      console.log(`  Parent: <${$parent.prop('tagName')}> class="${$parent.attr('class') || 'no-class'}"`);
      console.log(`  Parent text: "${$parent.text().trim().substring(0, 50)}..."`);
      console.log(`  Grandparent: <${$grandparent.prop('tagName')}> class="${$grandparent.attr('class') || 'no-class'}"`);
      console.log(`  Great-grandparent: <${$greatGrandparent.prop('tagName')}> class="${$greatGrandparent.attr('class') || 'no-class'}"`);
      
      // If this is a list item, check if it's part of a roadmap list
      if ($parent.prop('tagName') === 'LI' || $grandparent.prop('tagName') === 'LI') {
        const $list = $parent.prop('tagName') === 'LI' ? $parent.parent() : $grandparent.parent();
        console.log(`  List: <${$list.prop('tagName')}> class="${$list.attr('class') || 'no-class'}"`);
        console.log(`  List has ${$list.children().length} items`);
      }
    });
    
    // Examine the page structure to find what contains the roadmap list
    console.log('\nExamining main content area...');
    const mainContent = $('main');
    if (mainContent.length) {
      console.log('Found <main> element');
      console.log(`Main element has ${mainContent.children().length} direct children`);
      
      // Look at the direct children of main
      mainContent.children().each((i, el) => {
        if (i < 5) { // Only check the first 5 children to avoid too much output
          console.log(`Child #${i+1} is a <${el.tagName.toLowerCase()}> with class "${$(el).attr('class') || 'no-class'}"`);
          
          // Check if this element has links that might be roadmaps
          const childLinks = $(el).find('a[href*="/roadmap"]');
          if (childLinks.length > 0) {
            console.log(`  This element contains ${childLinks.length} roadmap links`);
          }
        }
      });
    }
    
    // Look for specific roadmap content
    console.log('\nLooking for roadmap content:');
    
    // Try to find elements containing "roadmap" in their text
    const roadmapTextElements = $('*').filter(function() {
      const text = $(this).text().toLowerCase();
      return text.includes('roadmap') && $(this).find('*').length < 10; // To filter out large containers
    });
    
    console.log(`Found ${roadmapTextElements.length} elements with 'roadmap' in text`);
    roadmapTextElements.slice(0, 5).each((i, el) => {
      console.log(`  Element #${i+1}: <${el.tagName.toLowerCase()}> class="${$(el).attr('class') || 'no-class'}" text: "${$(el).text().trim().substring(0, 50)}..."`);
    });
    
    // Try to find the main roadmap list or grid
    console.log('\nSearching for roadmap grid/list:');
    
    // Look for grid or list containers
    const gridContainers = ['.grid', '.list', '.container', '.grid-container', '.roadmaps-container', '.cards-container', '.content-container', '.roadmaps-grid', '.guide-list', '.items'];
    for (const selector of gridContainers) {
      const container = $(selector);
      if (container.length > 0) {
        console.log(`\nFound ${container.length} '${selector}' containers`);
        console.log(`First '${selector}' has ${container.first().children().length} children`);
        
        // Check for roadmap links inside
        const containerRoadmapLinks = container.first().find('a[href*="/roadmap"]');
        if (containerRoadmapLinks.length > 0) {
          console.log(`  Contains ${containerRoadmapLinks.length} roadmap links`);
          
          // Log the container's HTML structure to see what we're working with
          const containerHtml = container.first().html().substring(0, 500);
          console.log(`  HTML structure (truncated): ${containerHtml}...`);
          
          // Extract the first roadmap item as a potential target
          const firstRoadmapItem = container.first().find('a[href*="/roadmap"]').first();
          if (firstRoadmapItem.length) {
            console.log('\n  First roadmap link found:');
            console.log(`    Text: ${firstRoadmapItem.text().trim()}`);
            console.log(`    Href: ${firstRoadmapItem.attr('href')}`);
            
            // Check parent elements for structure
            const parent = firstRoadmapItem.parent();
            const grandparent = parent.parent();
            
            console.log(`    Parent: <${parent.prop('tagName')}> class="${parent.attr('class') || 'no-class'}"`);
            console.log(`    Grandparent: <${grandparent.prop('tagName')}> class="${grandparent.attr('class') || 'no-class'}"`);
            
            // Try to identify if this is in a card or list item
            const potentialCardElement = firstRoadmapItem.closest('div');
            console.log(`    Closest div has class: "${potentialCardElement.attr('class') || 'no-class'}"`);
          }
        }
      }
    }
    
  } catch (error) {
    console.error('Error fetching roadmap.sh:', error.message);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Headers: ${JSON.stringify(error.response.headers)}`);
    }
  }
}

// Run the function
checkRoadmapSite();

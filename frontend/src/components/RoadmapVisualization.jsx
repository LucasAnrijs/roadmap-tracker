import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { RoadmapPresenter } from '../presenters/RoadmapPresenter';

/**
 * RoadmapVisualization Component
 * 
 * Renders an interactive visualization of a learning roadmap using D3.js
 */
const RoadmapVisualization = ({ roadmapData, userProgress, onNodeClick }) => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  
  // Create visualization when data changes
  useEffect(() => {
    if (!roadmapData || !roadmapData.nodes || !svgRef.current) return;
    
    // Format data for visualization
    const formattedData = RoadmapPresenter.formatForVisualization(roadmapData, userProgress);
    
    // Clear previous visualization
    d3.select(svgRef.current).selectAll('*').remove();
    
    // Set up the SVG container
    const svg = d3.select(svgRef.current);
    const width = containerRef.current.clientWidth;
    const height = 600; // Fixed height or could be dynamic
    
    // Add zoom functionality
    const zoom = d3.zoom()
      .scaleExtent([0.1, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    
    svg.call(zoom);
    
    // Create a group for all elements
    const g = svg.append('g');
    
    // Create a force simulation
    const simulation = d3.forceSimulation(formattedData.nodes)
      .force('link', d3.forceLink(formattedData.links).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => d.radius * 1.2));
    
    // Draw links
    const links = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(formattedData.links)
      .enter()
      .append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 1);
    
    // Create node groups
    const nodeGroups = g.append('g')
      .attr('class', 'nodes')
      .selectAll('.node')
      .data(formattedData.nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended))
      .on('click', (event, d) => {
        setSelectedNode(d);
        if (onNodeClick) onNodeClick(d);
        event.stopPropagation();
      });
    
    // Add circles to node groups
    nodeGroups.append('circle')
      .attr('r', d => d.radius)
      .attr('fill', d => d.color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5);
    
    // Add completion indicator (checkmark)
    nodeGroups.filter(d => d.isCompleted)
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('fill', 'white')
      .attr('font-size', d => d.radius * 0.8)
      .attr('font-weight', 'bold')
      .text('✓');
    
    // Add labels to node groups
    const labels = nodeGroups.append('text')
      .attr('dx', d => d.radius + 5)
      .attr('dy', 4)
      .attr('font-size', 12)
      .text(d => d.label)
      .each(function(d) {
        // Wrap text if too long
        const self = d3.select(this);
        const text = self.text();
        if (text.length > 20) {
          self.text(text.substring(0, 17) + '...');
        }
      });
    
    // Add title for mouseover
    nodeGroups.append('title')
      .text(d => d.label);
    
    // Update positions on simulation tick
    simulation.on('tick', () => {
      links
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
      
      nodeGroups.attr('transform', d => `translate(${d.x},${d.y})`);
    });
    
    // Drag functions
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    
    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }
    
    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
    
    // Click outside to deselect node
    svg.on('click', () => {
      setSelectedNode(null);
      if (onNodeClick) onNodeClick(null);
    });
    
    // Initial zoom to fit all content
    const initialScale = 0.8;
    svg.call(zoom.transform, d3.zoomIdentity
      .translate(width / 2, height / 2)
      .scale(initialScale)
      .translate(-width / 2, -height / 2));
    
    // Cleanup function
    return () => {
      simulation.stop();
    };
  }, [roadmapData, userProgress, onNodeClick]);
  
  return (
    <div className="roadmap-visualization" ref={containerRef} style={{ width: '100%', height: '600px' }}>
      <svg ref={svgRef} width="100%" height="100%" />
      
      {selectedNode && (
        <div className="node-details" 
          style={{ 
            position: 'absolute', 
            bottom: '20px', 
            right: '20px',
            background: 'white',
            padding: '15px',
            borderRadius: '5px',
            boxShadow: '0 0 10px rgba(0,0,0,0.1)',
            maxWidth: '300px'
          }}>
          <h3>{selectedNode.label}</h3>
          {selectedNode.description && <p>{selectedNode.description}</p>}
          <p>Type: {selectedNode.type}</p>
          <p>Status: {selectedNode.isCompleted ? 'Completed' : 'Pending'}</p>
          
          {selectedNode.resources && selectedNode.resources.length > 0 && (
            <>
              <h4>Resources</h4>
              <ul>
                {selectedNode.resources.map((resource, index) => (
                  <li key={index}>{resource.title}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default RoadmapVisualization;

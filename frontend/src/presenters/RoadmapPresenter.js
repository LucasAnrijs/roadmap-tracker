/**
 * RoadmapPresenter
 * 
 * Transforms backend roadmap data into formats suitable for frontend visualization
 */
export class RoadmapPresenter {
  /**
   * Format roadmap data for D3 visualization
   * @param {Object} roadmapData - Raw roadmap data from API
   * @param {Object} userProgress - User's progress data (optional)
   * @returns {Object} - Formatted data for D3
   */
  static formatForVisualization(roadmapData, userProgress = null) {
    if (!roadmapData || !roadmapData.nodes) {
      return { nodes: [], links: [] };
    }
    
    // Transform nodes for visualization
    const nodes = roadmapData.nodes.map(node => {
      // Check if node is completed
      const isCompleted = userProgress?.completedNodes?.some(
        progress => progress.nodeId === node.id
      );
      
      // Determine node size based on type
      const radius = node.type === 'topic' ? 30 : 20;
      
      // Determine node color based on type and completion status
      let color = this.getNodeColor(node.type);
      if (isCompleted) {
        color = '#27ae60'; // Green for completed nodes
      }
      
      return {
        id: node.id,
        label: node.title,
        description: node.description,
        type: node.type,
        parentId: node.parentId,
        position: node.position || { x: 0, y: 0 },
        resources: node.resources,
        // Visual properties
        radius,
        color,
        isCompleted: !!isCompleted
      };
    });
    
    // Transform edges for visualization
    const links = roadmapData.edges.map(edge => ({
      source: edge.source,
      target: edge.target,
      type: edge.type
    }));
    
    return { nodes, links };
  }
  
  /**
   * Get color for node based on its type
   * @param {string} type - Node type ('topic', 'subtopic', 'skill')
   * @returns {string} - Color code
   */
  static getNodeColor(type) {
    const colors = {
      topic: '#3498db',     // Blue
      subtopic: '#2ecc71',  // Green
      skill: '#e74c3c'      // Red
    };
    return colors[type] || '#95a5a6'; // Default gray
  }
  
  /**
   * Format roadmap list for display
   * @param {Array} roadmaps - List of roadmaps from API
   * @returns {Array} - Formatted roadmap list
   */
  static formatRoadmapList(roadmaps) {
    if (!roadmaps || !Array.isArray(roadmaps)) {
      return [];
    }
    
    return roadmaps.map(roadmap => ({
      id: roadmap._id,
      title: roadmap.title,
      description: roadmap.description,
      category: roadmap.category,
      nodeCount: roadmap.nodes?.length || 0,
      lastUpdated: new Date(roadmap.lastUpdated).toLocaleDateString()
    }));
  }
  
  /**
   * Format user progress data for display
   * @param {Object} progress - User progress data
   * @returns {Object} - Formatted progress data
   */
  static formatProgressData(progress) {
    if (!progress) {
      return null;
    }
    
    return {
      roadmapId: progress.roadmapId,
      completedNodes: progress.completedNodes || [],
      currentNode: progress.currentNode,
      startedAt: new Date(progress.startedAt).toLocaleDateString(),
      lastActivity: new Date(progress.lastActivity).toLocaleDateString(),
      completionPercentage: progress.completionPercentage || 0
    };
  }
}

export default RoadmapPresenter;

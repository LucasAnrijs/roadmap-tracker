import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRoadmapById } from '../store/slices/roadmapSlice';
import { fetchRoadmapProgress, updateNodeProgress } from '../store/slices/progressSlice';
import { addNotification } from '../store/slices/uiSlice';
import RoadmapVisualization from '../components/RoadmapVisualization';

/**
 * RoadmapDetail page
 * 
 * Displays a detailed view of a roadmap with interactive visualization
 */
const RoadmapDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { currentRoadmap, isLoading: roadmapLoading } = useSelector(state => state.roadmaps);
  const { currentProgress, isLoading: progressLoading } = useSelector(state => state.progress);
  
  const [selectedNode, setSelectedNode] = useState(null);
  const [isResourcePanelOpen, setIsResourcePanelOpen] = useState(false);
  
  // Fetch roadmap and progress data
  useEffect(() => {
    if (id) {
      dispatch(fetchRoadmapById(id));
      dispatch(fetchRoadmapProgress(id));
    }
  }, [dispatch, id]);
  
  // Loading state
  const isLoading = roadmapLoading || progressLoading;
  
  // Handle node click in visualization
  const handleNodeClick = (node) => {
    setSelectedNode(node);
    setIsResourcePanelOpen(!!node);
  };
  
  // Toggle node completion status
  const handleToggleNodeCompletion = (nodeId, isCompleted) => {
    if (!id) return;
    
    dispatch(updateNodeProgress({
      roadmapId: id,
      nodeId,
      completed: !isCompleted
    }))
      .unwrap()
      .then(() => {
        dispatch(addNotification({
          message: !isCompleted ? 'Node marked as completed!' : 'Node marked as incomplete.',
          type: !isCompleted ? 'success' : 'info'
        }));
      })
      .catch((error) => {
        dispatch(addNotification({
          message: `Error updating progress: ${error}`,
          type: 'error'
        }));
      });
  };
  
  // Check if a node is completed
  const isNodeCompleted = (nodeId) => {
    if (!currentProgress) return false;
    return currentProgress.completedNodes.some(node => node.nodeId === nodeId);
  };
  
  // Go back to roadmaps list
  const handleBackClick = () => {
    navigate('/roadmaps');
  };
  
  return (
    <div className="space-y-6">
      {/* Page header with back button */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={handleBackClick}
            className="inline-flex items-center text-gray-500 hover:text-gray-700"
          >
            <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Roadmaps
          </button>
          {!isLoading && currentRoadmap && (
            <h1 className="mt-2 text-2xl font-bold text-gray-900">{currentRoadmap.title}</h1>
          )}
        </div>
        
        {/* Progress information */}
        {!isLoading && currentProgress && (
          <div className="text-right">
            <div className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-blue-100 text-blue-800">
              <span>{currentProgress.completionPercentage}% Complete</span>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {currentProgress.completedNodes.length} of {currentRoadmap?.nodes?.length || 0} completed
            </p>
          </div>
        )}
      </div>
      
      {isLoading ? (
        // Loading state
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : currentRoadmap ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Roadmap visualization (takes 2/3 of the space on large screens) */}
          <div className="bg-white rounded-lg shadow overflow-hidden lg:col-span-2">
            <div className="p-2 h-[600px]">
              <RoadmapVisualization
                roadmapData={currentRoadmap}
                userProgress={currentProgress}
                onNodeClick={handleNodeClick}
              />
            </div>
          </div>
          
          {/* Info panel (1/3 of the space) */}
          <div className="lg:col-span-1 space-y-6">
            {/* Roadmap information */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-gray-900">About this Roadmap</h2>
                <p className="mt-2 text-sm text-gray-500">
                  {currentRoadmap.description || 'No description available.'}
                </p>
                
                <div className="mt-4 text-sm">
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium text-gray-500">Category:</span>
                    <span className="text-gray-900">{currentRoadmap.category || 'Uncategorized'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium text-gray-500">Topics:</span>
                    <span className="text-gray-900">{currentRoadmap.nodes?.length || 0}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium text-gray-500">Last Updated:</span>
                    <span className="text-gray-900">
                      {new Date(currentRoadmap.lastUpdated).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Selected node information */}
            {selectedNode ? (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium text-gray-900">{selectedNode.label}</h2>
                    <div>
                      <button
                        onClick={() => handleToggleNodeCompletion(
                          selectedNode.id,
                          isNodeCompleted(selectedNode.id)
                        )}
                        className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md ${
                          isNodeCompleted(selectedNode.id)
                            ? 'text-white bg-green-600 hover:bg-green-700'
                            : 'text-white bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        {isNodeCompleted(selectedNode.id) ? (
                          <>
                            <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            Completed
                          </>
                        ) : (
                          'Mark as Completed'
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {selectedNode.description && (
                    <p className="mt-2 text-sm text-gray-500">{selectedNode.description}</p>
                  )}
                  
                  {/* Resources section */}
                  {selectedNode.resources && selectedNode.resources.length > 0 ? (
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-gray-900">Resources</h3>
                      <ul className="mt-2 divide-y divide-gray-200">
                        {selectedNode.resources.map((resource, index) => (
                          <li key={index} className="py-2">
                            <div className="flex items-start">
                              <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                                  />
                                </svg>
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900">{resource.title}</p>
                                {resource.description && (
                                  <p className="text-sm text-gray-500">{resource.description}</p>
                                )}
                                <a 
                                  href={resource.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="mt-1 inline-flex items-center text-xs font-medium text-blue-600 hover:text-blue-500"
                                >
                                  View Resource
                                  <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </a>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="mt-4 text-sm text-gray-500">
                      <p>No resources available for this topic.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-4 py-5 sm:p-6 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Select a topic</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Click on a node in the roadmap to view details and resources.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        // Roadmap not found
        <div className="text-center py-10">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Roadmap not found</h3>
          <p className="mt-1 text-sm text-gray-500">
            The roadmap you're looking for does not exist or has been removed.
          </p>
          <div className="mt-6">
            <button
              onClick={handleBackClick}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Go to Roadmaps
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoadmapDetail;

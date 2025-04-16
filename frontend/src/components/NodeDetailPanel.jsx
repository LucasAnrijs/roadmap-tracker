import React, { useState } from 'react';
import { useSelector } from 'react-redux';

/**
 * NodeDetailPanel Component
 * 
 * Displays detailed information for a selected node, including 
 * resources, learning paths, and scraped content
 */
const NodeDetailPanel = ({ selectedNode, onClose }) => {
  const { currentNodeDetail, isLoadingNodeDetail } = useSelector(state => state.roadmaps);
  const [showDebug, setShowDebug] = useState(false);
  
  // Display loading state
  if (isLoadingNodeDetail) {
    return (
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Loading Node Details...</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  // If no node detail available, show basic node info
  if (!currentNodeDetail || !currentNodeDetail.nodeDetail) {
    return (
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">{selectedNode?.label || 'Node Details'}</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">
          <div className="flex flex-col items-center">
            <svg className="h-12 w-12 text-yellow-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-700 font-medium">No detailed information available for this topic yet.</p>
            <p className="text-gray-500 mt-2 text-center">The system tried to find more detailed content for this node but none was found. This may be because this node doesn't have a detailed page on roadmap.sh.</p>
            
            {/* Debug button */}
            <button 
              onClick={() => setShowDebug(!showDebug)}
              className="mt-4 px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              {showDebug ? 'Hide Debug Info' : 'Show Debug Info'}
            </button>
            
            {/* Debug information section */}
            {showDebug && (
              <div className="mt-4 p-3 bg-gray-100 rounded w-full text-xs text-left overflow-auto max-h-60">
                <h4 className="font-medium mb-2">Debug Information:</h4>
                <div className="mt-2">
                  <h4 className="font-medium mb-1">Selected Node ID:</h4>
                  <code className="bg-gray-200 px-1 rounded">{selectedNode?.id}</code>
                </div>
                <div className="mt-2">
                  <h4 className="font-medium mb-1">Response Data:</h4>
                  <pre className="whitespace-pre-wrap">
                    {JSON.stringify(currentNodeDetail, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
          
          {selectedNode?.description && (
            <div className="mt-6 border-t pt-4">
              <h3 className="text-sm font-medium text-gray-900">Description</h3>
              <p className="mt-1 text-sm text-gray-600">{selectedNode.description}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const { nodeDetail } = currentNodeDetail;
  
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden max-h-[80vh] flex flex-col">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">{nodeDetail.title}</h2>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500"
        >
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="p-6 overflow-y-auto">
        {/* Resources section */}
        {nodeDetail.resources && nodeDetail.resources.length > 0 && (
          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-900 mb-2">Resources</h3>
            <ul className="space-y-3">
              {nodeDetail.resources.map((resource, index) => (
                <li key={index} className="bg-gray-50 p-3 rounded-md">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 pt-1">
                      {resource.type === 'video' ? (
                        <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )}
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-900">{resource.title}</p>
                      {resource.description && (
                        <p className="mt-1 text-xs text-gray-500">{resource.description}</p>
                      )}
                      <a 
                        href={resource.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center text-xs font-medium text-blue-600 hover:text-blue-500"
                      >
                        View Resource
                        <svg className="ml-1 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Learning Paths section */}
        {nodeDetail.learningPaths && nodeDetail.learningPaths.length > 0 && (
          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-900 mb-2">Learning Paths</h3>
            <div className="space-y-4">
              {nodeDetail.learningPaths.map((path, pathIndex) => (
                <div key={pathIndex} className="border border-gray-200 rounded-md overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900">{path.title}</h4>
                    {path.description && (
                      <p className="mt-1 text-xs text-gray-500">{path.description}</p>
                    )}
                  </div>
                  <ul className="divide-y divide-gray-200">
                    {path.steps.map((step, stepIndex) => (
                      <li key={stepIndex} className="px-4 py-3">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 bg-blue-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs font-medium">
                            {step.step}
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{step.title}</p>
                            {step.description && (
                              <p className="mt-1 text-xs text-gray-500">{step.description}</p>
                            )}
                            {step.resources && step.resources.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {step.resources.map((resource, resourceIndex) => (
                                  <a 
                                    key={resourceIndex}
                                    href={resource.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="block text-xs text-blue-600 hover:text-blue-500"
                                  >
                                    {resource.title}
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Content HTML section (if available) */}
        {nodeDetail.contentHTML && (
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-2">Content</h3>
            <div 
              className="prose prose-sm max-w-none text-gray-600"
              dangerouslySetInnerHTML={{ __html: nodeDetail.contentHTML }}
            />
          </div>
        )}

        {/* Detail page link (if available) */}
        {nodeDetail.detailPageUrl && (
          <div className="mt-6 text-center">
            <a 
              href={nodeDetail.detailPageUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              View Detailed Guide
              <svg className="ml-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        )}
        
        {/* Debug section */}
        <div className="mt-8 text-center">
          <button 
            onClick={() => setShowDebug(!showDebug)}
            className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            {showDebug ? 'Hide Debug Info' : 'Show Technical Info'}
          </button>
          
          {showDebug && (
            <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-left overflow-auto max-h-60">
              <h4 className="font-medium mb-2">Node Information:</h4>
              <div className="grid grid-cols-2 gap-1">
                <div>Node ID:</div>
                <code className="bg-gray-200 px-1 rounded">{nodeDetail.nodeId}</code>
                <div>Found:</div>
                <code className="bg-gray-200 px-1 rounded">{nodeDetail.found ? 'Yes' : 'No'}</code>
                <div>Resources Count:</div>
                <code className="bg-gray-200 px-1 rounded">{nodeDetail.resources?.length || 0}</code>
              </div>
              
              <details className="mt-2">
                <summary className="cursor-pointer font-medium">Full Data</summary>
                <pre className="whitespace-pre-wrap mt-2 text-[10px]">
                  {JSON.stringify(currentNodeDetail, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NodeDetailPanel;

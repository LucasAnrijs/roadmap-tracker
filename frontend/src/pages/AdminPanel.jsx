import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRoadmaps, scrapeAllRoadmaps, updateRoadmapData } from '../store/slices/roadmapSlice';
import { addNotification } from '../store/slices/uiSlice';
import { Link } from 'react-router-dom';

/**
 * Admin Panel
 * 
 * Interface for admins to manage roadmaps and perform scraping operations
 */
const AdminPanel = () => {
  const dispatch = useDispatch();
  const { roadmaps, isLoading } = useSelector(state => state.roadmaps);
  const { user } = useSelector(state => state.auth);
  
  const [selectedRoadmapId, setSelectedRoadmapId] = useState('');
  const [scrapeStatus, setScrapeStatus] = useState({
    isRunning: false,
    message: ''
  });
  
  // Fetch roadmaps on mount
  useEffect(() => {
    dispatch(fetchRoadmaps());
  }, [dispatch]);
  
  // Check if user is admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="text-center py-10">
        <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
        <p className="mt-1 text-sm text-gray-500">
          You don't have permission to access the admin panel.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Go Back Home
          </Link>
        </div>
      </div>
    );
  }
  
  // Handle scrape all roadmaps
  const handleScrapeAll = () => {
    setScrapeStatus({
      isRunning: true,
      message: 'Scraping all roadmaps...'
    });
    
    dispatch(scrapeAllRoadmaps())
      .unwrap()
      .then((response) => {
        setScrapeStatus({
          isRunning: false,
          message: response.message || 'Scrape completed successfully'
        });
        
        dispatch(addNotification({
          message: 'All roadmaps scraped successfully',
          type: 'success'
        }));
        
        // Refresh roadmaps list
        dispatch(fetchRoadmaps());
      })
      .catch((error) => {
        setScrapeStatus({
          isRunning: false,
          message: `Error: ${error}`
        });
        
        dispatch(addNotification({
          message: `Failed to scrape roadmaps: ${error}`,
          type: 'error'
        }));
      });
  };
  
  // Handle update single roadmap
  const handleUpdateRoadmap = () => {
    if (!selectedRoadmapId) {
      dispatch(addNotification({
        message: 'Please select a roadmap to update',
        type: 'warning'
      }));
      return;
    }
    
    setScrapeStatus({
      isRunning: true,
      message: 'Updating roadmap...'
    });
    
    dispatch(updateRoadmapData(selectedRoadmapId))
      .unwrap()
      .then((response) => {
        setScrapeStatus({
          isRunning: false,
          message: response.message || 'Roadmap updated successfully'
        });
        
        dispatch(addNotification({
          message: 'Roadmap updated successfully',
          type: 'success'
        }));
        
        // Refresh roadmaps list
        dispatch(fetchRoadmaps());
      })
      .catch((error) => {
        setScrapeStatus({
          isRunning: false,
          message: `Error: ${error}`
        });
        
        dispatch(addNotification({
          message: `Failed to update roadmap: ${error}`,
          type: 'error'
        }));
      });
  };
  
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage roadmaps and scraping operations
        </p>
      </div>
      
      {/* Scraping controls */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Scraping Controls</h3>
          <p className="mt-1 text-sm text-gray-500">
            Update roadmap data from roadmap.sh
          </p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <h4 className="text-sm font-medium text-gray-700">Scrape All Roadmaps</h4>
              <p className="mt-1 text-sm text-gray-500">
                Fetch all available roadmaps from roadmap.sh and update the database
              </p>
              <button
                onClick={handleScrapeAll}
                disabled={scrapeStatus.isRunning}
                className={`mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                  scrapeStatus.isRunning ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
              >
                {scrapeStatus.isRunning ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  'Scrape All Roadmaps'
                )}
              </button>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700">Update Specific Roadmap</h4>
              <p className="mt-1 text-sm text-gray-500">
                Refresh a single roadmap's content
              </p>
              <div className="mt-4 flex space-x-3">
                <select
                  id="roadmap-select"
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={selectedRoadmapId}
                  onChange={(e) => setSelectedRoadmapId(e.target.value)}
                  disabled={scrapeStatus.isRunning}
                >
                  <option value="">Select a roadmap</option>
                  {roadmaps.map((roadmap) => (
                    <option key={roadmap._id} value={roadmap._id}>
                      {roadmap.title}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleUpdateRoadmap}
                  disabled={scrapeStatus.isRunning || !selectedRoadmapId}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                    scrapeStatus.isRunning || !selectedRoadmapId
                      ? 'bg-blue-400'
                      : 'bg-blue-600 hover:bg-blue-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                >
                  {scrapeStatus.isRunning ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    'Update Roadmap'
                  )}
                </button>
              </div>
            </div>
          </div>
          
          {/* Status message */}
          {scrapeStatus.message && (
            <div className={`mt-4 p-4 rounded-md ${
              scrapeStatus.message.includes('Error')
                ? 'bg-red-50 text-red-800'
                : 'bg-green-50 text-green-800'
            }`}>
              <p>{scrapeStatus.message}</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Roadmaps list */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">Manage Roadmaps</h3>
            <p className="mt-1 text-sm text-gray-500">
              View and manage existing roadmaps
            </p>
          </div>
          <Link
            to="/roadmaps"
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            View Frontend
          </Link>
        </div>
        <div className="border-t border-gray-200">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : roadmaps.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Topics
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Updated
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {roadmaps.map((roadmap) => (
                    <tr key={roadmap._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{roadmap.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{roadmap.category || 'Uncategorized'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{roadmap.nodes?.length || 0}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(roadmap.lastUpdated).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          to={`/roadmaps/${roadmap._id}`}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => {
                            setSelectedRoadmapId(roadmap._id);
                            handleUpdateRoadmap();
                          }}
                          disabled={scrapeStatus.isRunning}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Update
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No roadmaps</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by scraping roadmaps from roadmap.sh
              </p>
              <div className="mt-6">
                <button
                  onClick={handleScrapeAll}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  Scrape Roadmaps
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;

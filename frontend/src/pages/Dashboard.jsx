import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchUserProgress } from '../store/slices/progressSlice';
import { fetchRoadmaps } from '../store/slices/roadmapSlice';

/**
 * Dashboard page
 * 
 * Displays user progress overview and recommended roadmaps
 */
const Dashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { userProgress, isLoading: progressLoading } = useSelector(state => state.progress);
  const { roadmaps, isLoading: roadmapsLoading } = useSelector(state => state.roadmaps);
  
  // Fetch user progress and roadmaps on mount
  useEffect(() => {
    dispatch(fetchUserProgress());
    dispatch(fetchRoadmaps());
  }, [dispatch]);
  
  // Loading state
  const isLoading = progressLoading || roadmapsLoading;
  
  // Get in-progress roadmaps
  const inProgressRoadmaps = userProgress.filter(progress => 
    progress.completionPercentage > 0 && progress.completionPercentage < 100
  );
  
  // Get completed roadmaps
  const completedRoadmaps = userProgress.filter(progress => 
    progress.completionPercentage === 100
  );
  
  // Get recommended roadmaps (not started yet)
  const recommendedRoadmaps = roadmaps
    .filter(roadmap => 
      !userProgress.some(progress => 
        progress.roadmap && progress.roadmap._id === roadmap._id
      )
    )
    .slice(0, 3); // Only show top 3
  
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back, {user?.username}! Track your learning progress.
        </p>
      </div>
      
      {isLoading ? (
        // Loading state
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Progress overview */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900">Your Progress</h2>
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-md p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {userProgress.length}
                  </div>
                  <div className="text-sm text-blue-500">Total Roadmaps</div>
                </div>
                <div className="bg-yellow-50 rounded-md p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {inProgressRoadmaps.length}
                  </div>
                  <div className="text-sm text-yellow-500">In Progress</div>
                </div>
                <div className="bg-green-50 rounded-md p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {completedRoadmaps.length}
                  </div>
                  <div className="text-sm text-green-500">Completed</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Recent activity - placeholder for now */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
              <div className="mt-4">
                {userProgress.length > 0 ? (
                  <div className="space-y-4">
                    {userProgress.slice(0, 3).map(progress => (
                      <div key={progress._id} className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" 
                              />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            {progress.roadmap?.title || 'Roadmap'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Last activity: {new Date(progress.lastActivity).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="ml-auto">
                          <div className="relative w-16 h-2 bg-gray-200 rounded-full">
                            <div 
                              className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
                              style={{ width: `${progress.completionPercentage}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-right text-gray-500 mt-1">
                            {progress.completionPercentage}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <p>No activity yet. Start a roadmap!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Recommended roadmaps */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900">Recommended Roadmaps</h2>
          <div className="mt-4">
            {recommendedRoadmaps.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recommendedRoadmaps.map(roadmap => (
                  <div key={roadmap._id} className="border rounded-md overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-4">
                      <h3 className="text-md font-medium text-gray-900">{roadmap.title}</h3>
                      <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                        {roadmap.description || 'No description available.'}
                      </p>
                      <div className="mt-4">
                        <Link
                          to={`/roadmaps/${roadmap._id}`}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                          View Roadmap
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <p>No recommended roadmaps available.</p>
              </div>
            )}
          </div>
          <div className="mt-4 text-center">
            <Link
              to="/roadmaps"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              View All Roadmaps
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

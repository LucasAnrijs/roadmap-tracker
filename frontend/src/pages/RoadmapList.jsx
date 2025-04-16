import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchRoadmaps } from '../store/slices/roadmapSlice';
import { fetchUserProgress } from '../store/slices/progressSlice';
import { RoadmapPresenter } from '../presenters/RoadmapPresenter';

/**
 * RoadmapList page
 * 
 * Displays all available roadmaps with filtering and sorting options
 */
const RoadmapList = () => {
  const dispatch = useDispatch();
  const { roadmaps, isLoading: roadmapsLoading } = useSelector(state => state.roadmaps);
  const { userProgress, isLoading: progressLoading } = useSelector(state => state.progress);
  const { user } = useSelector(state => state.auth);
  
  // Local state for filtering and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('title');
  
  // Fetch roadmaps and user progress on mount
  useEffect(() => {
    dispatch(fetchRoadmaps());
    dispatch(fetchUserProgress());
  }, [dispatch]);
  
  // Loading state
  const isLoading = roadmapsLoading || progressLoading;
  
  // Get all unique categories
  const categories = roadmaps
    ? ['all', ...new Set(roadmaps.filter(r => r.category).map(r => r.category))]
    : ['all'];
  
  // Filter and sort roadmaps
  const filteredRoadmaps = roadmaps
    ? roadmaps
        .filter(roadmap => 
          // Search filter
          roadmap.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
          // Category filter
          (categoryFilter === 'all' || roadmap.category === categoryFilter)
        )
        .sort((a, b) => {
          // Sort by selected criteria
          if (sortBy === 'title') {
            return a.title.localeCompare(b.title);
          } else if (sortBy === 'updated') {
            return new Date(b.lastUpdated) - new Date(a.lastUpdated);
          } else if (sortBy === 'nodes') {
            return (b.nodes?.length || 0) - (a.nodes?.length || 0);
          }
          return 0;
        })
    : [];
  
  // Get progress status for a roadmap
  const getRoadmapProgress = (roadmapId) => {
    const progress = userProgress.find(p => p.roadmap?._id === roadmapId);
    return progress ? progress.completionPercentage : 0;
  };
  
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Learning Roadmaps</h1>
        <p className="mt-1 text-sm text-gray-500">
          Browse available roadmaps and track your learning journey
        </p>
      </div>
      
      {/* Filters and search */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Search */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700">
              Search
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <input
                type="text"
                id="search"
                className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="Search roadmaps..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Category filter */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              id="category"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>
          
          {/* Sort options */}
          <div>
            <label htmlFor="sort" className="block text-sm font-medium text-gray-700">
              Sort By
            </label>
            <select
              id="sort"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="title">Title (A-Z)</option>
              <option value="updated">Last Updated</option>
              <option value="nodes">Topic Count</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Roadmap list */}
      <div>
        {isLoading ? (
          // Loading state
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredRoadmaps.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredRoadmaps.map(roadmap => {
              const progressPercentage = getRoadmapProgress(roadmap._id);
              
              return (
                <div key={roadmap._id} className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
                  <div className="p-5">
                    {roadmap.category && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {roadmap.category}
                      </span>
                    )}
                    <h3 className="mt-2 text-lg font-medium text-gray-900">{roadmap.title}</h3>
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                      {roadmap.description || 'No description available.'}
                    </p>
                    
                    {/* Progress bar */}
                    {progressPercentage > 0 && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-500">Progress</span>
                          <span className="text-xs font-medium text-gray-500">{progressPercentage}%</span>
                        </div>
                        <div className="mt-1 relative w-full h-2 bg-gray-200 rounded-full">
                          <div 
                            className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
                            style={{ width: `${progressPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        {roadmap.nodes?.length || 0} topics
                      </span>
                      <Link
                        to={`/roadmaps/${roadmap._id}`}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        {progressPercentage > 0 ? 'Continue' : 'Start Learning'}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // No results
          <div className="text-center py-10">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No roadmaps found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
            <div className="mt-6">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('all');
                  setSortBy('title');
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Admin button */}
      {user?.role === 'admin' && (
        <div className="mt-6 text-center">
          <Link
            to="/admin"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <svg className="mr-2 h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Manage Roadmaps
          </Link>
        </div>
      )}
    </div>
  );
};

export default RoadmapList;

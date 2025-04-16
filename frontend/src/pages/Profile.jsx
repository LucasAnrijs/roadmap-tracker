import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUserProgress } from '../store/slices/progressSlice';
import { addNotification } from '../store/slices/uiSlice';
import { Link } from 'react-router-dom';

/**
 * User Profile page
 * 
 * Displays user information and learning progress statistics
 */
const Profile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { userProgress, isLoading } = useSelector(state => state.progress);
  
  // Local state for form
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  
  // Fetch user progress on mount
  useEffect(() => {
    dispatch(fetchUserProgress());
  }, [dispatch]);
  
  // Set initial form data when user data is available
  useEffect(() => {
    if (user) {
      setFormData(prevState => ({
        ...prevState,
        username: user.username || '',
        email: user.email || ''
      }));
    }
  }, [user]);
  
  // Calculate user statistics
  const stats = {
    totalRoadmaps: userProgress.length,
    completedRoadmaps: userProgress.filter(p => p.completionPercentage === 100).length,
    inProgressRoadmaps: userProgress.filter(p => p.completionPercentage > 0 && p.completionPercentage < 100).length,
    totalTopics: userProgress.reduce((total, p) => total + (p.roadmap?.nodes?.length || 0), 0),
    completedTopics: userProgress.reduce((total, p) => total + (p.completedNodes?.length || 0), 0),
    averageCompletion: userProgress.length
      ? Math.round(
          userProgress.reduce((sum, p) => sum + (p.completionPercentage || 0), 0) /
            userProgress.length
        )
      : 0
  };
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear field-specific error when user types
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };
  
  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!formData.username) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }
    
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    // Only validate password fields if any of them are filled
    if (formData.currentPassword || formData.newPassword || formData.confirmPassword) {
      if (!formData.currentPassword) {
        errors.currentPassword = 'Current password is required to change password';
      }
      
      if (!formData.newPassword) {
        errors.newPassword = 'New password is required';
      } else if (formData.newPassword.length < 6) {
        errors.newPassword = 'New password must be at least 6 characters';
      }
      
      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Please confirm your new password';
      } else if (formData.newPassword !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // This would normally call an API to update the user profile
      // For now, just show a notification
      dispatch(addNotification({
        message: 'Profile updated successfully!',
        type: 'success'
      }));
      
      setIsEditing(false);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Your Profile</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your account and view your learning progress
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User info card */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">Account Information</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Personal details and preferences.</p>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>
            
            {isEditing ? (
              <div className="border-t border-gray-200">
                <form onSubmit={handleSubmit} className="p-4 sm:p-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                        Username
                      </label>
                      <input
                        type="text"
                        name="username"
                        id="username"
                        value={formData.username}
                        onChange={handleChange}
                        className={`mt-1 block w-full rounded-md shadow-sm ${
                          formErrors.username ? 'border-red-300' : 'border-gray-300'
                        } focus:border-blue-500 focus:ring-blue-500 sm:text-sm`}
                      />
                      {formErrors.username && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.username}</p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email address
                      </label>
                      <input
                        type="email"
                        name="email"
                        id="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`mt-1 block w-full rounded-md shadow-sm ${
                          formErrors.email ? 'border-red-300' : 'border-gray-300'
                        } focus:border-blue-500 focus:ring-blue-500 sm:text-sm`}
                      />
                      {formErrors.email && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                      )}
                    </div>
                    
                    <div className="sm:col-span-2">
                      <h4 className="text-sm font-medium text-gray-700">Change Password</h4>
                      <p className="text-xs text-gray-500 mb-2">Leave blank if you don't want to change your password</p>
                    </div>
                    
                    <div>
                      <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                        Current Password
                      </label>
                      <input
                        type="password"
                        name="currentPassword"
                        id="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleChange}
                        className={`mt-1 block w-full rounded-md shadow-sm ${
                          formErrors.currentPassword ? 'border-red-300' : 'border-gray-300'
                        } focus:border-blue-500 focus:ring-blue-500 sm:text-sm`}
                      />
                      {formErrors.currentPassword && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.currentPassword}</p>
                      )}
                    </div>
                    
                    <div className="sm:col-span-2 grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                          New Password
                        </label>
                        <input
                          type="password"
                          name="newPassword"
                          id="newPassword"
                          value={formData.newPassword}
                          onChange={handleChange}
                          className={`mt-1 block w-full rounded-md shadow-sm ${
                            formErrors.newPassword ? 'border-red-300' : 'border-gray-300'
                          } focus:border-blue-500 focus:ring-blue-500 sm:text-sm`}
                        />
                        {formErrors.newPassword && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.newPassword}</p>
                        )}
                      </div>
                      
                      <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          name="confirmPassword"
                          id="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          className={`mt-1 block w-full rounded-md shadow-sm ${
                            formErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                          } focus:border-blue-500 focus:ring-blue-500 sm:text-sm`}
                        />
                        {formErrors.confirmPassword && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.confirmPassword}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="mr-3 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="border-t border-gray-200">
                <dl>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Username</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{user?.username}</dd>
                  </div>
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Email address</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{user?.email}</dd>
                  </div>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Role</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                      {user?.role === 'admin' ? 'Administrator' : 'User'}
                    </dd>
                  </div>
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Member since</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </dd>
                  </div>
                </dl>
              </div>
            )}
          </div>
        </div>
        
        {/* Stats card */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Learning Statistics</h3>
              <div className="mt-6 grid grid-cols-2 gap-5">
                <div className="bg-blue-50 overflow-hidden rounded-lg shadow px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-blue-500 truncate">Roadmaps</dt>
                  <dd className="mt-1 text-3xl font-semibold text-blue-900">{stats.totalRoadmaps}</dd>
                </div>
                
                <div className="bg-green-50 overflow-hidden rounded-lg shadow px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-green-500 truncate">Completed</dt>
                  <dd className="mt-1 text-3xl font-semibold text-green-900">{stats.completedRoadmaps}</dd>
                </div>
                
                <div className="bg-purple-50 overflow-hidden rounded-lg shadow px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-purple-500 truncate">Topics Done</dt>
                  <dd className="mt-1 text-3xl font-semibold text-purple-900">{stats.completedTopics}</dd>
                </div>
                
                <div className="bg-yellow-50 overflow-hidden rounded-lg shadow px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-yellow-500 truncate">Avg. Completion</dt>
                  <dd className="mt-1 text-3xl font-semibold text-yellow-900">{stats.averageCompletion}%</dd>
                </div>
              </div>
              
              <div className="mt-6">
                <Link
                  to="/roadmaps"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  View All Roadmaps
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent progress */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Progress</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Your latest activity across roadmaps.</p>
        </div>
        <div className="border-t border-gray-200">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : userProgress.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {userProgress.slice(0, 5).map((progress) => (
                <li key={progress._id} className="px-4 py-4 sm:px-6">
                  <Link to={`/roadmaps/${progress.roadmap?._id}`} className="flex items-center hover:bg-gray-50 -m-4 p-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-blue-600 truncate">{progress.roadmap?.title || 'Roadmap'}</p>
                      <p className="text-sm text-gray-500">
                        Last activity: {new Date(progress.lastActivity).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {progress.completionPercentage}% Complete
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-10">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No progress yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start following a roadmap to track your learning journey.
              </p>
              <div className="mt-6">
                <Link
                  to="/roadmaps"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  Browse Roadmaps
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;

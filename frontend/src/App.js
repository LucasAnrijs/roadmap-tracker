import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getUserProfile } from './store/slices/authSlice';

// Pages
import Dashboard from './pages/Dashboard';
import RoadmapList from './pages/RoadmapList';
import RoadmapDetail from './pages/RoadmapDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';
import Profile from './pages/Profile';
import AdminPanel from './pages/AdminPanel';

// Components
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Notifications from './components/Notifications';

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const { theme } = useSelector(state => state.ui);
  
  // Apply theme class to document
  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);
  
  // Try to load user profile if we have a token
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(getUserProfile());
    }
  }, [isAuthenticated, dispatch]);
  
  // Check if user is admin
  const isAdmin = user && user.role === 'admin';
  
  return (
    <Router>
      <div className="app">
        {/* Notifications system */}
        <Notifications />
        
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/dashboard" /> : <Login />
          } />
          <Route path="/register" element={
            isAuthenticated ? <Navigate to="/dashboard" /> : <Register />
          } />
          
          {/* Protected routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="roadmaps" element={<RoadmapList />} />
            <Route path="roadmaps/:id" element={<RoadmapDetail />} />
            <Route path="profile" element={<Profile />} />
            
            {/* Admin routes */}
            <Route path="admin" element={
              isAdmin ? <AdminPanel /> : <Navigate to="/dashboard" />
            } />
          </Route>
          
          {/* 404 route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle unauthorized errors (401)
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API service methods
const apiService = {
  // Auth endpoints
  auth: {
    register: (userData) => api.post('/register', userData),
    login: (credentials) => api.post('/login', credentials),
    getProfile: () => api.get('/user/profile')
  },
  
  // Roadmap endpoints
  roadmaps: {
    getAll: () => api.get('/roadmaps'),
    getById: (id) => api.get(`/roadmaps/${id}`),
    createRoadmap: (roadmapData) => api.post('/roadmaps', roadmapData),
    updateRoadmap: (id, roadmapData) => api.put(`/roadmaps/${id}`, roadmapData),
    deleteRoadmap: (id) => api.delete(`/roadmaps/${id}`)
  },
  
  // Progress endpoints
  progress: {
    getUserProgress: () => api.get('/user/progress'),
    getRoadmapProgress: (roadmapId) => api.get(`/user/progress/${roadmapId}`),
    updateProgress: (roadmapId, progressData) => api.post(`/user/progress/${roadmapId}`, progressData)
  },
  
  // Scraper endpoints (admin only)
  scraper: {
    scrapeAllRoadmaps: () => api.post('/scrape/roadmaps'),
    updateRoadmap: (roadmapId) => api.post(`/scrape/roadmaps/${roadmapId}`)
  }
};

export default apiService;

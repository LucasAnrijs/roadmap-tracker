import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import roadmapReducer from './slices/roadmapSlice';
import progressReducer from './slices/progressSlice';
import uiReducer from './slices/uiSlice';

// Configure Redux store
const store = configureStore({
  reducer: {
    auth: authReducer,
    roadmaps: roadmapReducer,
    progress: progressReducer,
    ui: uiReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types (for non-serializable data)
        ignoredActions: ['auth/loginSuccess', 'auth/registerSuccess'],
        // Ignore these paths in the state (for non-serializable data)
        ignoredPaths: ['auth.user'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production'
});

export default store;

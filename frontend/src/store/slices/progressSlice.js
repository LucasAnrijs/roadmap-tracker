import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '../../services/api';

// Initial state
const initialState = {
  userProgress: [],
  currentProgress: null,
  isLoading: false,
  error: null
};

// Async thunks
export const fetchUserProgress = createAsyncThunk(
  'progress/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.progress.getUserProgress();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch progress data');
    }
  }
);

export const fetchRoadmapProgress = createAsyncThunk(
  'progress/fetchRoadmapProgress',
  async (roadmapId, { rejectWithValue }) => {
    try {
      const response = await apiService.progress.getRoadmapProgress(roadmapId);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        // If progress not found, return null (not an error)
        return { data: null };
      }
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch roadmap progress');
    }
  }
);

export const updateNodeProgress = createAsyncThunk(
  'progress/updateNode',
  async ({ roadmapId, nodeId, completed, currentNode }, { rejectWithValue }) => {
    try {
      const response = await apiService.progress.updateProgress(roadmapId, {
        nodeId,
        completed,
        currentNode
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update progress');
    }
  }
);

// Progress slice
const progressSlice = createSlice({
  name: 'progress',
  initialState,
  reducers: {
    clearCurrentProgress: (state) => {
      state.currentProgress = null;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch user progress cases
      .addCase(fetchUserProgress.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserProgress.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userProgress = action.payload.data;
      })
      .addCase(fetchUserProgress.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch roadmap progress cases
      .addCase(fetchRoadmapProgress.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRoadmapProgress.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentProgress = action.payload.data;
      })
      .addCase(fetchRoadmapProgress.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Update node progress cases
      .addCase(updateNodeProgress.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateNodeProgress.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentProgress = action.payload.data;
        
        // Update progress in the list if it exists
        const index = state.userProgress.findIndex(
          p => p.roadmapId === action.payload.data.roadmapId
        );
        
        if (index !== -1) {
          state.userProgress[index] = {
            ...state.userProgress[index],
            completedNodes: action.payload.data.completedNodes.length,
            completionPercentage: action.payload.data.completionPercentage,
            lastActivity: action.payload.data.lastActivity
          };
        }
      })
      .addCase(updateNodeProgress.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

export const { clearCurrentProgress, clearError } = progressSlice.actions;
export default progressSlice.reducer;

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '../../services/api';

// Initial state
const initialState = {
  roadmaps: [],
  currentRoadmap: null,
  isLoading: false,
  error: null
};

// Async thunks
export const fetchRoadmaps = createAsyncThunk(
  'roadmaps/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.roadmaps.getAll();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch roadmaps');
    }
  }
);

export const fetchRoadmapById = createAsyncThunk(
  'roadmaps/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await apiService.roadmaps.getById(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch roadmap');
    }
  }
);

export const scrapeAllRoadmaps = createAsyncThunk(
  'roadmaps/scrapeAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.scraper.scrapeAllRoadmaps();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to scrape roadmaps');
    }
  }
);

export const updateRoadmapData = createAsyncThunk(
  'roadmaps/updateData',
  async (roadmapId, { rejectWithValue }) => {
    try {
      const response = await apiService.scraper.updateRoadmap(roadmapId);
      return { ...response.data, roadmapId };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update roadmap');
    }
  }
);

// Roadmap slice
const roadmapSlice = createSlice({
  name: 'roadmaps',
  initialState,
  reducers: {
    clearCurrentRoadmap: (state) => {
      state.currentRoadmap = null;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all roadmaps cases
      .addCase(fetchRoadmaps.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRoadmaps.fulfilled, (state, action) => {
        state.isLoading = false;
        state.roadmaps = action.payload.data;
      })
      .addCase(fetchRoadmaps.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch roadmap by id cases
      .addCase(fetchRoadmapById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRoadmapById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentRoadmap = action.payload.data;
      })
      .addCase(fetchRoadmapById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Scrape all roadmaps cases
      .addCase(scrapeAllRoadmaps.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(scrapeAllRoadmaps.fulfilled, (state) => {
        state.isLoading = false;
        // We don't update the state here, instead trigger a new fetch
      })
      .addCase(scrapeAllRoadmaps.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Update roadmap data cases
      .addCase(updateRoadmapData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateRoadmapData.fulfilled, (state, action) => {
        state.isLoading = false;
        // We might want to refresh the current roadmap
        if (state.currentRoadmap && state.currentRoadmap._id === action.payload.roadmapId) {
          state.currentRoadmap = null; // Force a refresh
        }
      })
      .addCase(updateRoadmapData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

export const { clearCurrentRoadmap, clearError } = roadmapSlice.actions;
export default roadmapSlice.reducer;

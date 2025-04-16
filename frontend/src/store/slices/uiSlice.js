import { createSlice } from '@reduxjs/toolkit';

// Initial state
const initialState = {
  sidebarOpen: true,
  theme: localStorage.getItem('theme') || 'light',
  notifications: [],
  modal: {
    isOpen: false,
    type: null,
    data: null
  }
};

// UI slice
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    
    setTheme: (state, action) => {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);
    },
    
    // Add a notification
    addNotification: (state, action) => {
      const notification = {
        id: Date.now(),
        message: action.payload.message,
        type: action.payload.type || 'info',
        duration: action.payload.duration || 3000
      };
      
      state.notifications.push(notification);
    },
    
    // Remove a notification by id
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },
    
    // Open modal
    openModal: (state, action) => {
      state.modal = {
        isOpen: true,
        type: action.payload.type,
        data: action.payload.data || null
      };
    },
    
    // Close modal
    closeModal: (state) => {
      state.modal = {
        isOpen: false,
        type: null,
        data: null
      };
    }
  }
});

export const {
  toggleSidebar,
  setTheme,
  addNotification,
  removeNotification,
  openModal,
  closeModal
} = uiSlice.actions;

export default uiSlice.reducer;

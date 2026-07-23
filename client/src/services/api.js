import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cc_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (err) => Promise.reject(err));

// Handle 401 and token refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;

    // Handle rate limiting
    if (err.response?.status === 429) {
      const retryAfter = err.response.headers['retry-after'];
      const waitTime = retryAfter ? `${retryAfter} seconds` : 'a few minutes';
      
      // Don't show toast here, let the calling component handle it
      // But we can attach a user-friendly message to the error
      err.userMessage = `Too many requests. Please try again in ${waitTime}.`;
      return Promise.reject(err);
    }

    if (err.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('cc_refresh_token');
      
      if (!refreshToken) {
        // No refresh token, logout
        localStorage.removeItem('cc_token');
        localStorage.removeItem('cc_user');
        localStorage.removeItem('cc_refresh_token');
        if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
          window.location.href = '/login';
        }
        return Promise.reject(err);
      }

      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/refresh`,
          { refreshToken }
        );
        
        const { token: newToken, refreshToken: newRefreshToken } = response.data.data;
        
        localStorage.setItem('cc_token', newToken);
        localStorage.setItem('cc_refresh_token', newRefreshToken);
        
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        
        processQueue(null, newToken);
        
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('cc_token');
        localStorage.removeItem('cc_user');
        localStorage.removeItem('cc_refresh_token');
        if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(err);
  }
);

export default api;

// ─────────── VIDEO GENERATION API ──────────────────────────────────────────
export const videoAPI = {
  // Document upload and parsing
  uploadDocument: (formData) => api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000, // 2 minutes for large files
  }),

  // Script generation and enhancement
  generateScript: (documentId, settings) => api.post(`/documents/${documentId}/generate-script`, settings),
  enhanceScript: (documentId) => api.post(`/enhance-script/${documentId}`),

  // Scene management
  getScenes: (projectId) => api.get(`/projects/${projectId}/scenes`),
  regenerateScene: (projectId, sceneId) => api.post(`/regenerate-scene/${projectId}/${sceneId}`),
  updateSceneDuration: (projectId, sceneId, duration) => api.patch(`/update-scene-duration/${projectId}/${sceneId}`, { duration }),
  regenerateAllPrompts: (projectId) => api.post(`/regenerate-all-prompts/${projectId}`),

  // Asset generation
  generateImage: (sceneId, prompt) => api.post(`/scenes/${sceneId}/generate-image`, { prompt }),
  generateAudio: (sceneId, text, settings) => api.post(`/scenes/${sceneId}/generate-audio`, { text, ...settings }),
  generateSubtitles: (sceneId) => api.post(`/scenes/${sceneId}/generate-subtitles`),

  // Video rendering
  renderScene: (sceneId) => api.post(`/scenes/${sceneId}/render`),
  assembleVideo: (projectId) => api.post(`/projects/${projectId}/assemble`),
  
  // Status checks
  getProjectStatus: (projectId) => api.get(`/projects/${projectId}/status`),
  getSceneStatus: (sceneId) => api.get(`/scenes/${sceneId}/status`),
};

// ─────────── AUTHENTICATION API ────────────────────────────────────────────
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  refreshToken: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
  getCurrentUser: () => api.get('/auth/me'),
};

// ─────────── PROJECT API ────────────────────────────────────────────────────
export const projectAPI = {
  getAll: () => api.get('/projects'),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
};

// ─────────── USER API ───────────────────────────────────────────────────────
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  updatePassword: (data) => api.put('/users/password', data),
  uploadAvatar: (formData) => api.post('/users/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
});

// Request interceptor for logging
api.interceptors.request.use((config) => {
  console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const projectsApi = {
  // Get all projects
  getProjects: () => api.get('/projects'),
  
  // Get sessions for a project
  getSessions: (projectId, params = {}) => 
    api.get(`/projects/${projectId}/sessions`, { params }),
  
  // Get full session with messages
  getSession: (projectId, sessionId, params = {}) => 
    api.get(`/projects/${projectId}/sessions/${sessionId}`, { params }),
  
  // Get single message
  getMessage: (projectId, sessionId, messageId) => 
    api.get(`/projects/${projectId}/sessions/${sessionId}/messages/${messageId}`),
};

export const searchApi = {
  // Search across conversations
  search: (searchParams) => api.post('/search', searchParams),
};

export const healthApi = {
  // Health check
  getHealth: () => api.get('/health'),
};

export default api;
import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 600000,  // 10 minutes timeout for long operations like index rebuild
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

export const exportApi = {
  // Export session in different formats
  exportSession: (projectId, sessionId, format = 'json') => 
    api.get(`/export/session/${projectId}/${sessionId}?format=${format}`, {
      responseType: 'blob'
    }),
};

export const searchApi = {
  // Search across conversations
  search: (searchParams) => api.post('/search', searchParams),

  // Rebuild search index
  rebuildIndex: () => api.post('/search/index/build'),

  // Get index status
  getIndexStatus: () => api.get('/search/index/status'),
};

export const sessionMetadataApi = {
  // Get session metadata (custom title, tags, notes, visibility)
  getMetadata: (projectId, sessionId) =>
    api.get(`/session-metadata/${projectId}/${sessionId}`),

  // Set/update full metadata
  setMetadata: (projectId, sessionId, metadata) =>
    api.put(`/session-metadata/${projectId}/${sessionId}`, metadata),

  // Update only custom title
  setCustomTitle: (projectId, sessionId, customTitle) =>
    api.patch(`/session-metadata/${projectId}/${sessionId}/title`, { customTitle }),

  // Toggle visibility (hide/show)
  toggleVisibility: (projectId, sessionId) =>
    api.patch(`/session-metadata/${projectId}/${sessionId}/visibility`),

  // Add tags (merges with existing)
  addTags: (projectId, sessionId, tags) =>
    api.post(`/session-metadata/${projectId}/${sessionId}/tags`, { tags }),

  // Remove specific tags
  removeTags: (projectId, sessionId, tags) =>
    api.delete(`/session-metadata/${projectId}/${sessionId}/tags`, { data: { tags } }),

  // Set notes
  setNotes: (projectId, sessionId, notes) =>
    api.patch(`/session-metadata/${projectId}/${sessionId}/notes`, { notes }),

  // Delete all metadata (restore to default)
  deleteMetadata: (projectId, sessionId) =>
    api.delete(`/session-metadata/${projectId}/${sessionId}`),

  // Get hidden sessions
  getHiddenSessions: (projectId) =>
    api.get(`/session-metadata/${projectId}/hidden`),

  // Get sessions by tag
  getSessionsByTag: (projectId, tag) =>
    api.get(`/session-metadata/${projectId}/tags/${tag}`),

  // Get all tags for project
  getAllTags: (projectId) =>
    api.get(`/session-metadata/${projectId}/tags`),

  // Batch operations
  batchSetVisibility: (projectId, sessionIds, isHidden) =>
    api.post(`/session-metadata/${projectId}/batch/visibility`, { sessionIds, isHidden }),

  batchAddTags: (projectId, sessionIds, tags) =>
    api.post(`/session-metadata/${projectId}/batch/tags`, { sessionIds, tags }),
};

export const healthApi = {
  // Health check
  getHealth: () => api.get('/health'),
};

export default api;
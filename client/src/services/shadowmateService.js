import api from './api';

const shadowmateService = {
  // --------------------------------------------------------------------------
  // Student Profile Memory (Transparent & Editable)
  // --------------------------------------------------------------------------
  getProfile: async () => {
    const response = await api.get('/student/profile');
    return response.data;
  },

  updateManualProfile: async (manualData) => {
    const response = await api.put('/student/profile/manual', manualData);
    return response.data;
  },

  // --------------------------------------------------------------------------
  // Assignments Management
  // --------------------------------------------------------------------------
  getAssignments: async () => {
    const response = await api.get('/student/assignments');
    return response.data;
  },

  createAssignment: async (assignmentData) => {
    const response = await api.post('/student/assignments', assignmentData);
    return response.data;
  },

  updateAssignment: async (id, data) => {
    const response = await api.patch(`/student/assignments/${id}`, data);
    return response.data;
  },

  // --------------------------------------------------------------------------
  // Study Sessions Logging
  // --------------------------------------------------------------------------
  getSessions: async () => {
    const response = await api.get('/student/sessions');
    return response.data;
  },

  logSession: async (sessionData) => {
    const response = await api.post('/student/sessions', sessionData);
    return response.data;
  },

  // --------------------------------------------------------------------------
  // Student Feedback Loop
  // --------------------------------------------------------------------------
  submitFeedback: async (feedbackData) => {
    const response = await api.post('/student/feedback', feedbackData);
    return response.data;
  },

  // --------------------------------------------------------------------------
  // 5 AI Agents API
  // --------------------------------------------------------------------------
  // 1. Study Planner Agent
  generateStudyPlan: async () => {
    const response = await api.post('/v1/ai/shadowmate/plan');
    return response.data;
  },

  // 2. Adaptive Replanning Agent
  triggerReplan: async (data = {}) => {
    const response = await api.post('/v1/ai/shadowmate/replan', data);
    return response.data;
  },

  // 3. Student Behavior Analyzer Agent
  analyzeBehavior: async () => {
    const response = await api.get('/v1/ai/shadowmate/analyze-behavior');
    return response.data;
  },

  // 4. Academic Guidance / Track Recommendation Agent
  getTrackRecommendations: async () => {
    const response = await api.get('/v1/ai/shadowmate/recommend-tracks');
    return response.data;
  },

  // 5. Study Co-Pilot Agent
  sendCopilotMessage: async (message) => {
    const response = await api.post('/v1/ai/shadowmate/copilot', { message });
    return response.data;
  },

  // --------------------------------------------------------------------------
  // Admin EdTech Catalog
  // --------------------------------------------------------------------------
  getAdminTracks: async () => {
    const response = await api.get('/admin/edtech/tracks');
    return response.data;
  },

  createAdminTrack: async (trackData) => {
    const response = await api.post('/admin/edtech/tracks', trackData);
    return response.data;
  }
};

export default shadowmateService;

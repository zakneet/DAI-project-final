import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

const client = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Intercepteur pour ajouter le token JWT
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur pour gérer l'expiration du token (Silent Refresh)
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Si l'erreur est 401 et qu'on n'a pas déjà essayé de rafraîchir
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (refreshToken) {
        try {
          // On utilise axios directement pour éviter l'intercepteur de boucle
          const refreshRes = await axios.post(`${API_BASE}/token/refresh/`, {
            refresh: refreshToken
          });
          
          const newAccessToken = refreshRes.data.access;
          localStorage.setItem('access_token', newAccessToken);
          
          // Mettre à jour le header et re-tenter la requête
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return axios(originalRequest);
        } catch (refreshError) {
          // Si le refresh échoue (session trop vieille), on déconnecte proprement
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login?expired=true';
          return Promise.reject(refreshError);
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// ── API Endpoints ──

export const api = {
  // Direct client access for custom requests
  client: client,

  // Auth
  login: (username, password) => client.post('/token/', { username, password }),
  register: (userData) => client.post('/register/', userData),
  getMe: () => client.get('/me/'),

  // Health
  health: () => client.get('/health/'),

  // Patients
  getPatients: () => client.get('/patients/'),
  getPatient: (id) => client.get(`/patients/${id}/`),
  createPatient: (data) => client.post('/patients/', data),
  updatePatient: (id, data) => client.patch(`/patients/${id}/`, data),
  getMyPatientProfile: () => client.get('/patients/my-profile/'),
  updateMyPatientProfile: (data) => client.patch('/patients/my-profile/', data),

  // Cases (Anesthesia Case / Dossier)
  getCases: () => client.get('/cases/'),
  getCasesByPatient: (patientId) => client.get('/cases/', { params: { patient: patientId } }),
  getCase: (id) => client.get(`/cases/${id}/`),
  createCase: (data) => client.post('/cases/', data),
  updateCase: (id, data) => client.patch(`/cases/${id}/`, data),

  // Question Templates
  getQuestionTemplates: () => client.get('/question-templates/'),

  // PreOp Questionnaires
  getQuestionnaires: () => client.get('/preop-questionnaires/'),
  getQuestionnaire: (id) => client.get(`/preop-questionnaires/${id}/`),
  createQuestionnaire: (data) => client.post('/preop-questionnaires/', data),
  updateQuestionnaire: (id, data) => client.patch(`/preop-questionnaires/${id}/`, data),
  getQuestionnaireForm: (id) => client.get(`/preop-questionnaires/${id}/form/`),
  computeScores: (id) => client.post(`/preop-questionnaires/${id}/compute-scores/`),

  // PreOp Responses
  getResponses: () => client.get('/preop-responses/'),
  createResponse: (data) => client.post('/preop-responses/', data),
  updateResponse: (id, data) => client.patch(`/preop-responses/${id}/`, data),
  saveResponsesBulk: (id, responses) => client.post(`/preop-questionnaires/${id}/save-responses/`, { responses }),

  // Clinical Scores
  getScores: () => client.get('/clinical-scores/'),

  // Audit Logs
  getAuditLogs: () => client.get('/audit-logs/'),
  getCaseAuditLogs: (caseId) => client.get('/audit-logs/', { params: { entity_id: caseId } }),

  // Standalone Calculation
  calculateRiskStandalone: (responses) => client.post('/compute-scores-standalone/', { responses }),

  // DICOM Imager
  getDicomImage: () => client.get('/dicom-view/'),

  // PerOp - Additional methods for dashboard
  getPerOpSessions: () => client.get('/perop/sessions/'),
  getPerOpSummary: (caseId) => client.get(`/cases/${caseId}/perop/summary/`),
  startPerOpSession: (caseId, data) => client.post(`/cases/${caseId}/perop/sessions/start/`, data),
  endPerOpSession: (caseId, data) => client.post(`/cases/${caseId}/perop/sessions/end/`, data),
  getPerOpVitals: (caseId) => client.get(`/cases/${caseId}/perop/vitals/`),
  postPerOpVital: (caseId, data) => client.post(`/cases/${caseId}/perop/vitals/`, data),
  getPerOpEvents: (caseId) => client.get(`/cases/${caseId}/perop/events/`),
  postPerOpEvent: (caseId, data) => client.post(`/cases/${caseId}/perop/events/`, data),

  // PostOp - Additional methods for dashboard
  getPostOpQueue: () => client.get('/postop/recovery-queue/'),
  getPostOpSummary: (caseId) => client.get(`/cases/${caseId}/postop/summary/`),
  startPostOpStay: (caseId, data) => client.post(`/cases/${caseId}/postop/stay/start/`, data),
  endPostOpStay: (caseId, data) => client.post(`/cases/${caseId}/postop/stay/end/`, data),
  getPostOpObservations: (caseId) => client.get(`/cases/${caseId}/postop/observations/`),
  postPostOpObservation: (caseId, data) => client.post(`/cases/${caseId}/postop/observations/`, data),
  getAldreteScore: (caseId) => client.get(`/cases/${caseId}/postop/scores/aldrete/`),
  updateAldreteScore: (patientId, data) => client.patch(`/postop/aldrete-scores/${patientId}/`, data),

  // Alerts
  getAlerts: () => client.get('/alerts/'),
  getCaseAlerts: (caseId) => client.get(`/cases/${caseId}/alerts/`),
  createCaseAlert: (caseId, data) => client.post(`/cases/${caseId}/alerts/`, data),
  acknowledgeAlert: (alertId, data) => client.post(`/alerts/${alertId}/ack/`, data),
  resolveAlert: (alertId, data) => client.post(`/alerts/${alertId}/resolve/`, data),
  updateAlert: (alertId, data) => client.patch(`/alerts/${alertId}/`, data),

  // DME/DPI
  getDMERecords: () => client.get('/dme/medical-records/'),
  getDMEPatient: (patientId) => client.get(`/dme/medical-records/patient/${patientId}/`),
  getMyDMERecord: () => client.get('/dme/medical-records/my-record/'),
  updateMyDMERecord: (data) => client.patch('/dme/medical-records/my-record/', data),
  postDMEHistory: (data) => client.post('/dme/history/', data),
  postDMEAllergy: (data) => client.post('/dme/allergies/', data),
  postDMEDiagnosis: (data) => client.post('/dme/diagnoses/', data),
  postDMEPrescription: (data) => client.post('/dme/prescriptions/', data),
  postDMEDocument: (data) => client.post('/dme/documents/', data),

  // Question Templates (Admin)
  getTemplates: () => client.get('/question-templates/'),
  createTemplate: (data) => client.post('/question-templates/', data),
  updateTemplate: (id, data) => client.patch(`/question-templates/${id}/`, data),
  deleteTemplate: (id) => client.delete(`/question-templates/${id}/`),

  // User Profile
  updateMe: (data) => client.patch('/me/', data),

  // AI Copilot
  askAICopilot: (data) => client.post('/ai/ask/', data),
};

export { client };
export default api;

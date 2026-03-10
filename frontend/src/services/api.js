import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// Auth
export const signup = (data) => api.post('/auth/signup', data)
export const login = (data) => api.post('/auth/login', data)

// Resume
export const uploadResume = (formData) =>
  api.post('/resume/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
export const getResume = () => api.get('/resume/')

// Interview
export const generateQuestions = (data) => api.post('/interview/generate-questions', data)
export const submitAnswer = (data) => api.post('/interview/submit-answer', data)
export const completeInterview = (id) => api.post(`/interview/complete/${id}`)
export const getInterviewReport = (id) => api.get(`/interview/report/${id}`)
export const getInterviewHistory = () => api.get('/interview/history')
export const getGreeting = (data) => api.post('/interview/greeting', data)
export const getIntroResponse = (data) => api.post('/interview/intro-response', data)

// ATS
export const analyzeATS = (formData) =>
  api.post('/ats/analyze', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
export const analyzeATSText = (data) => api.post('/ats/analyze-text', data)

export default api
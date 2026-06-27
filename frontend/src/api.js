import axios from 'axios';

const API = axios.create({ baseURL: "http://127.0.0.1:8000", timeout: 90000 });

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

export const register = (data) => API.post('/auth/register', data);
export const login = (data) => API.post('/auth/login', data);
export const submitReport = (data) => API.post('/reports', data);
export const getReports = () => API.get('/reports');
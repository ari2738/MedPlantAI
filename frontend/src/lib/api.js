import axios from "axios";

// In development, Vite proxies /api → localhost:5000
// In production (Vercel), set VITE_API_URL to your Render backend URL
// e.g. https://medplant-api.onrender.com
const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "/api";

const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("medplant_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;

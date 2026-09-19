import axios from "axios"
import { supabase } from "./supabase"

let rawBase = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
if (rawBase.endsWith('/')) {
  rawBase = rawBase.slice(0, -1);
}
if (!rawBase.endsWith('/api') && !rawBase.includes('/api/')) {
  rawBase = `${rawBase}/api`;
}

export const api = axios.create({
  baseURL: rawBase,
})

api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  } else if (!config.headers['Content-Type']) {
    config.headers['Content-Type'] = 'application/json';
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = "/login"
    }
    return Promise.reject(error)
  }
)

export const API_ENDPOINTS = {
  // Add API endpoints as needed based on backend design
}

export default api;

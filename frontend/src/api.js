import axios from 'axios';

// Leave VITE_BACKEND_URL empty in development: requests go to the same origin
// (/api/...) and the Vite dev server proxies them to Django (see vite.config.js).
// In production set it to your deployed backend, e.g. https://my-api.example.com
const baseURL = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/+$/, '');

export const api = axios.create({ baseURL, timeout: 120000 });

// Turn any axios failure into one sentence that is safe to show a user.
export function errorMessage(err) {
  if (err.response) {
    const data = err.response.data;
    if (data && typeof data === 'object') {
      if (data.error) return data.error;
      if (data.detail) return data.detail; // e.g. DRF "Request was throttled..."
    }
    return `The server had a problem (error ${err.response.status}). Please try again.`;
  }
  if (err.code === 'ECONNABORTED') {
    return 'The request took too long. Please try again.';
  }
  return "Can't reach the server. Is the backend running?";
}

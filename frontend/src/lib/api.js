import axios from "axios";

// This block chooses a backend host.
// In the browser it uses the same hostname as the frontend, which helps on localhost.
const fallbackHost =
  typeof window === "undefined" ? "localhost" : window.location.hostname;

// This block builds the base backend URL.
// You can override it with VITE_API_BASE_URL when deploying.
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || `http://${fallbackHost}:3000`;
// This block creates one reusable Axios client for all API calls.
// withCredentials sends and receives the auth cookie used by the backend.
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// This export lets services import the shared API client instead of repeating config.
export default api;

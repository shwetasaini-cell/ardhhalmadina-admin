import axios from "axios";
import { toast } from "react-toastify";

// Create axios instance
const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "/api",
});

// Request interceptor to add token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor to handle token expiration
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const originalRequest = error.config;

    // Check if error is due to token expiration (401 Unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Clear local storage
      localStorage.removeItem("token");
      localStorage.removeItem("userData"); // if you store user data

      // Show toast message
      toast.error("Session expired. Please login again.");

      // Redirect to login page
      window.location.href = "/login";

      return Promise.reject(error);
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;

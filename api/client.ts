import { appConfig } from "@/config/app.config";
import auth from "@react-native-firebase/auth";
import axios from "axios";

// Create axios instance — base URL tek config noktasından gelir
export const apiClient = axios.create({
  baseURL: appConfig.apiUrl,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add Firebase ID Token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const currentUser = auth().currentUser;
      if (currentUser) {
        // Zorla yenileme YOK: SDK süresi dolan token'ı kendisi yeniler.
        // getIdToken(true) her istekte Firebase'e ek round-trip demekti.
        const token = await currentUser.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error getting Firebase token:", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      console.error("API Error:", error.response.status, error.response.data);
    } else if (error.request) {
      // Request made but no response
      console.error("Network Error:", error.message);
    } else {
      console.error("Error:", error.message);
    }
    return Promise.reject(error);
  },
);

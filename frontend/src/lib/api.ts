import axios from "axios";

export const apiClient = axios.create({
  baseURL: "http://localhost:3000/api/v1",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request Interceptor: Token automatically attach karega
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("opspulse_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Token save & 401 cleanup
apiClient.interceptors.response.use(
  (response) => {
    const authHeader = response.headers["authorization"];
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      localStorage.setItem("opspulse_token", token);
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("opspulse_token");
    }
    return Promise.reject(error);
  }
);
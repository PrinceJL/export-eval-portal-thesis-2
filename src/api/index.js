import axios from "axios";
const api = axios.create({
    baseURL: process.env.NODE_ENV === 'production' ? "/api" : "http://localhost:3000/api",
});

// Attach token automatically
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken"); // or sessionStorage
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;

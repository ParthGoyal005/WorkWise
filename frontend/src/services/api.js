import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("eka_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const message =
            error.response?.data?.message ||
            error.message ||
            "Something went wrong. Please try again.";

        if (error.response?.status === 401) {
            const isAuthRoute =
                error.config?.url?.includes("/auth/login") ||
                error.config?.url?.includes("/auth/signup");

            if (!isAuthRoute) {
                localStorage.removeItem("eka_token");
                localStorage.removeItem("eka_user");
                if (window.location.pathname !== "/login") {
                    window.location.href = "/login";
                }
            }
        }

        return Promise.reject({
            ...error,
            message,
            details: error.response?.data?.details || null,
        });
    },
);

export default api;

import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    },
});

// Request interceptor: Automatically attach Sanctum Bearer token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('equiply_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor: Handle unauthenticated responses
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('equiply_token');
            localStorage.removeItem('equiply_user');
            // Notify components or dispatch event
            window.dispatchEvent(new CustomEvent('equiply:unauthorized'));
        }
        return Promise.reject(error);
    }
);

export const authApi = {
    login: async (login, password) => {
        const res = await api.post('/auth/login', { login, password });
        return res.data;
    },
    register: async (payload) => {
        const res = await api.post('/auth/register', payload);
        return res.data;
    },
    me: async () => {
        const res = await api.get('/auth/me');
        return res.data;
    },
    logout: async () => {
        try {
            await api.post('/auth/logout');
        } finally {
            localStorage.removeItem('equiply_token');
            localStorage.removeItem('equiply_user');
        }
    },
};

export const itemsApi = {
    list: async (params = {}) => {
        const res = await api.get('/items', { params });
        return res.data;
    },
    categories: async () => {
        const res = await api.get('/items/categories');
        return res.data;
    },
    get: async (id) => {
        const res = await api.get(`/items/${id}`);
        return res.data;
    },
    create: async (data) => {
        const res = await api.post('/items', data);
        return res.data;
    },
};

export const reservationsApi = {
    list: async (params = {}) => {
        const res = await api.get('/reservations', { params });
        return res.data;
    },
    create: async (data) => {
        const res = await api.post('/reservations', data);
        return res.data;
    },
    checkout: async (id) => {
        const res = await api.post(`/reservations/${id}/checkout`);
        return res.data;
    },
    checkin: async (id, data) => {
        const res = await api.post(`/reservations/${id}/checkin`, data);
        return res.data;
    },
    cancel: async (id) => {
        const res = await api.post(`/reservations/${id}/cancel`);
        return res.data;
    },
};

export default api;

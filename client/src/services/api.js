import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' }
});

// Attach token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('taskflow_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('taskflow_token');
            localStorage.removeItem('taskflow_user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// ── Auth ──
export const authAPI = {
    signup: (data) => api.post('/auth/signup', data),
    login: (data) => api.post('/auth/login', data),
    getMe: () => api.get('/auth/me'),
    searchUsers: (q) => api.get(`/auth/users/search?q=${q}`)
};

// ── Boards ──
export const boardAPI = {
    getAll: (params) => api.get('/boards', { params }),
    create: (data) => api.post('/boards', data),
    getById: (id) => api.get(`/boards/${id}`),
    update: (id, data) => api.put(`/boards/${id}`, data),
    delete: (id) => api.delete(`/boards/${id}`),
    addMember: (id, userId) => api.post(`/boards/${id}/members`, { userId }),
    removeMember: (id, userId) => api.delete(`/boards/${id}/members/${userId}`)
};

// ── Lists ──
export const listAPI = {
    create: (boardId, data) => api.post(`/boards/${boardId}/lists`, data),
    update: (id, data) => api.put(`/lists/${id}`, data),
    delete: (id) => api.delete(`/lists/${id}`),
    reorder: (lists) => api.put('/lists/reorder', { lists })
};

// ── Tasks ──
export const taskAPI = {
    create: (listId, data) => api.post(`/lists/${listId}/tasks`, data),
    update: (id, data) => api.put(`/tasks/${id}`, data),
    delete: (id) => api.delete(`/tasks/${id}`),
    reorder: (data) => api.put('/tasks/reorder', data),
    assign: (id, userId, action) => api.put(`/tasks/${id}/assign`, { userId, action }),
    search: (boardId, params) => api.get(`/boards/${boardId}/tasks/search`, { params })
};

// ── Activity ──
export const activityAPI = {
    getByBoard: (boardId, params) => api.get(`/boards/${boardId}/activity`, { params })
};

export default api;

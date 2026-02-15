import { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

const initialState = {
    user: JSON.parse(localStorage.getItem('taskflow_user') || 'null'),
    token: localStorage.getItem('taskflow_token') || null,
    loading: true,
    error: null
};

function authReducer(state, action) {
    switch (action.type) {
        case 'AUTH_SUCCESS':
            return { ...state, user: action.payload.user, token: action.payload.token, loading: false, error: null };
        case 'AUTH_LOADED':
            return { ...state, user: action.payload, loading: false };
        case 'AUTH_ERROR':
            return { ...state, error: action.payload, loading: false };
        case 'LOGOUT':
            return { ...state, user: null, token: null, loading: false, error: null };
        case 'CLEAR_ERROR':
            return { ...state, error: null };
        default:
            return state;
    }
}

export function AuthProvider({ children }) {
    const [state, dispatch] = useReducer(authReducer, initialState);

    useEffect(() => {
        const loadUser = async () => {
            if (state.token) {
                try {
                    const res = await authAPI.getMe();
                    dispatch({ type: 'AUTH_LOADED', payload: res.data.user });
                } catch {
                    dispatch({ type: 'LOGOUT' });
                    localStorage.removeItem('taskflow_token');
                    localStorage.removeItem('taskflow_user');
                }
            } else {
                dispatch({ type: 'AUTH_LOADED', payload: null });
            }
        };
        loadUser();
    }, []);

    const login = async (email, password) => {
        try {
            dispatch({ type: 'CLEAR_ERROR' });
            const res = await authAPI.login({ email, password });
            localStorage.setItem('taskflow_token', res.data.token);
            localStorage.setItem('taskflow_user', JSON.stringify(res.data.user));
            dispatch({ type: 'AUTH_SUCCESS', payload: res.data });
            return true;
        } catch (err) {
            dispatch({ type: 'AUTH_ERROR', payload: err.response?.data?.message || 'Login failed' });
            return false;
        }
    };

    const signup = async (name, email, password) => {
        try {
            dispatch({ type: 'CLEAR_ERROR' });
            const res = await authAPI.signup({ name, email, password });
            localStorage.setItem('taskflow_token', res.data.token);
            localStorage.setItem('taskflow_user', JSON.stringify(res.data.user));
            dispatch({ type: 'AUTH_SUCCESS', payload: res.data });
            return true;
        } catch (err) {
            dispatch({ type: 'AUTH_ERROR', payload: err.response?.data?.message || 'Signup failed' });
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('taskflow_token');
        localStorage.removeItem('taskflow_user');
        dispatch({ type: 'LOGOUT' });
    };

    const clearError = () => dispatch({ type: 'CLEAR_ERROR' });

    return (
        <AuthContext.Provider value={{ ...state, login, signup, logout, clearError }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};

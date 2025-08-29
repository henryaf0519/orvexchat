// src/services/api.js

import { useChatStore } from '../store/chatStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


export const apiFetch = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  const token = useChatStore.getState().accessToken;

  const mergedOptions = {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };
  if (token) {
    mergedOptions.headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, mergedOptions);
   if (response.status === 401) {
    console.log('Sesión expirada, redirigiendo al login...');
    useChatStore.getState().setAuthData({ userData: null, accessToken: null });
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    throw new Error('Sesión expirada o inválida.');
  }

  return response;
};
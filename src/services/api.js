// src/services/api.js

import { useChatStore } from '../store/chatStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


export const apiFetch = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  const mergedOptions = {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const response = await fetch(url, mergedOptions);
  if (response.status === 401 || response.status === 403) {

    if (window.location.pathname !== '/login') {
      console.log('Sesión expirada, redirigiendo al login...');
      useChatStore.getState().setUserData(null);
      window.location.href = '/login';
    }
     throw new Error('Sesión expirada o inválida.');
  }

  return response;
};
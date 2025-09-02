import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import ChatPage from '../pages/ChatPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import RemindersPage from '../pages/RemindersPage';
import ProtectedRoute from '../components/ProtectedRoute';
import App from '../app';

export const router = createBrowserRouter([
 {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <Navigate to="/login" replace />,
      },
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'register',
        element: <RegisterPage />,
      },
      {
        path: 'chat',
        element: (
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'reminders',
        element: (
          <ProtectedRoute>
            <RemindersPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);


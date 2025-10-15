import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import ChatPage from '../pages/ChatPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import RemindersPage from '../pages/RemindersPage';
import ContactsPage from '../pages/ContactsPage';
import ProtectedRoute from '../components/ProtectedRoute';
import ButtonsPage from '../pages/ButtonsPage';
import TemplatesPage from '../pages/TemplatesPage';
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
      {
        path: 'contacts',
        element: (
          <ProtectedRoute>
            <ContactsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'buttons',
        element: (
          <ProtectedRoute>
            <ButtonsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'templates',
        element: (
          <ProtectedRoute>
            <TemplatesPage />
          </ProtectedRoute>
        )
      }
    ],
  },
]);


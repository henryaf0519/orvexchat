import { Navigate } from 'react-router-dom';
import { useChatStore } from '../store/chatStore';

export default function ProtectedRoute({ children }) {
  const isAuthenticated = useChatStore((state) => state.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}


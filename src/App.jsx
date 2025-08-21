// src/App.jsx

import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useChatStore } from './store/chatStore';
import { verifySession } from './services/authService';

function App() {
  const [loading, setLoading] = useState(true);
  const setUserData = useChatStore((state) => state.setUserData);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const userData = await verifySession();
        setUserData(userData);
      } catch (error) {
        setUserData(null);
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, [setUserData]);

  if (loading) {
    return <div>Cargando...</div>; 
  }

  return <Outlet />;
}

export default App;
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
        setUserData(userData); // Restaura la sesión si la cookie es válida
      } catch (error) {
        setUserData(null); // Asegura que no haya sesión si la cookie no es válida
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
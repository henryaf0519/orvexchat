// src/App.jsx

import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useChatStore } from './store/chatStore';
import { verifySession } from './services/authService';

function App() {
 return <Outlet />;
}

export default App;
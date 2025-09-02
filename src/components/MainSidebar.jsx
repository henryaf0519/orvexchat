// src/components/MainSidebar.jsx

import { useNavigate } from "react-router-dom";
import {
  FaComments,
  FaClock, // 1. Importa el nuevo ícono
  FaSignOutAlt,
} from "react-icons/fa";
import logo from "../assets/logoOnly.png";

export default function MainSidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Tu lógica de logout
    navigate("/");
  };

  const currentPath = window.location.pathname;

  return (
    <div className="flex flex-col h-full bg-[#1e293b] text-gray-400 p-4 w-20 items-center justify-between border-r border-gray-700">
      <div className="flex flex-col items-center">
        <div className="mb-8 mt-2">
          <img src={logo} alt="Orvex Chat Logo" className="h-10 w-auto" />
        </div>
        <nav className="flex flex-col space-y-6">
          {/* Botón de Chats */}
          <button
            onClick={() => navigate('/chat')}
            title="Chats"
            className={`p-3 rounded-xl transition-transform transform hover:scale-110 ${
              currentPath === '/chat' ? 'bg-red-600 text-white' : 'hover:bg-red-600 hover:text-white'
            }`}
          >
            <FaComments size={24} />
          </button>

          {/* 3. Añade el nuevo botón para Recordatorios */}
          <button
            onClick={() => navigate('/reminders')}
            title="Recordatorios"
            className={`p-3 rounded-xl transition-transform transform hover:scale-110 ${
              currentPath === '/reminders' ? 'bg-red-600 text-white' : 'hover:bg-red-600 hover:text-white'
            }`}
          >
            <FaClock size={24} />
          </button>
        </nav>
      </div>
      <div className="pb-4">
        <button
          onClick={handleLogout}
          className="p-3 rounded-xl hover:bg-red-600 hover:text-white transition-colors"
          title="Cerrar sesión"
        >
          <FaSignOutAlt size={24} />
        </button>
      </div>
    </div>
  );
}
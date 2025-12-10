// src/components/MainSidebar.jsx

import { useNavigate } from "react-router-dom";
import {
  FaComments,
  FaClock,
  FaUser,
  FaSignOutAlt,
  FaPlusSquare,
  FaProjectDiagram,
  FaCalendarAlt,
} from "react-icons/fa";
// Asegúrate de que el path del logo sea correcto:
import logo from "../assets/logoOnly.png"; 

export default function MainSidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Tu lógica de logout, por ejemplo, limpiar el token de sesión.
    navigate("/");
  };

  // Obtenemos la ruta actual para el estado activo de los botones
  const currentPath = window.location.pathname;

  return (
    // Contenedor Principal:
    // MÓVIL: Fijo en la parte inferior, ancho completo (w-full), altura pequeña (h-16), usa flex horizontal.
    // ESCRITORIO (md+): Estático a la izquierda, alto completo (h-full), ancho (w-20), usa flex vertical.
    <div className="
        fixed bottom-0 left-0 w-full h-16 
        bg-[#1e293b] text-gray-400 p-2 
        flex items-center justify-between 
        border-t border-gray-700 z-50
        
        md:static md:flex md:flex-col md:h-full md:w-20 
        md:items-center md:justify-between md:border-r md:border-t-0 md:p-4
    ">
      
      {/* 1. Sección Superior (Logo y Navegación) */}
      <div className="flex items-center md:flex-col md:items-center w-full md:w-auto">
        
        {/* Logo: Visible siempre */}
        <div className="mr-auto md:mb-8 md:mt-2 md:mr-0">
          <img 
            src={logo} 
            alt="Orvex Chat Logo" 
            className="h-8 w-auto md:h-10" // Ajuste de tamaño en móvil
          />
        </div>
        
        {/* Navegación (OCULTA en móvil, VISIBLE en escritorio) */}
        <nav className="hidden md:flex md:flex-col md:space-y-6">
          
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

          {/* Botón para Recordatorios */}
          <button
            onClick={() => navigate('/reminders')}
            title="Recordatorios"
            className={`p-3 rounded-xl transition-transform transform hover:scale-110 ${
              currentPath === '/reminders' ? 'bg-red-600 text-white' : 'hover:bg-red-600 hover:text-white'
            }`}
          >
            <FaClock size={24} />
          </button>

          {/* Botón de Contactos */}
          <button
            onClick={() => navigate('/contacts')}
            title="Contactos"
            className={`p-3 rounded-xl transition-transform transform hover:scale-110 ${
              currentPath === '/contacts' ? 'bg-red-600 text-white' : 'hover:bg-red-600 hover:text-white'
            }`}
          >
            <FaUser size={24} />
          </button>

          {/* Botón de Plantillas */}
          <button
            onClick={() => navigate('/templates')}
            title="Plantillas"
            className={`p-3 rounded-xl transition-transform transform hover:scale-110 ${
              currentPath === '/templates' ? 'bg-red-600 text-white' : 'hover:bg-red-600 hover:text-white'
            }`}
          >
            <FaPlusSquare size={24} />
          </button>

          {/* Botón de Agenda */}
          <button
            onClick={() => navigate('/calendar')}
            title="Agenda"
            className={`p-3 rounded-xl transition-transform transform hover:scale-110 ${
              currentPath === '/calendar' ? 'bg-red-600 text-white' : 'hover:bg-red-600 hover:text-white'
            }`}
          >
            <FaCalendarAlt size={24} />
          </button>

          {/* Botón de Flujos */}
          <button
            onClick={() => navigate('/flows')}
            title="Flujos"
            className={`p-3 rounded-xl transition-transform transform hover:scale-110 ${
              currentPath === '/flows' ? 'bg-red-600 text-white' : 'hover:bg-red-600 hover:text-white'
            }`}
          >
            <FaProjectDiagram size={24} />
          </button>

        </nav>
      </div>
      
      {/* 2. Sección Inferior (Cerrar Sesión) */}
      {/* En móvil, se alinea automáticamente a la derecha por 'justify-between' en el padre */}
      <div className="md:pb-4">
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
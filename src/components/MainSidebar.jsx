// src/components/MainSidebar.jsx

import { useNavigate } from "react-router-dom";
import {
  FaComments,
  FaUsers,
  FaChartBar,
  FaCog,
  FaSignOutAlt,
} from "react-icons/fa";
import logo from "../assets/logoOnly.png"; // Asegúrate de que la ruta sea correcta

export default function MainSidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    navigate("/");
  };

  return (
    <div className="flex flex-col h-full bg-[#1e293b] text-gray-400 p-4 w-20 items-center justify-between border-r border-gray-700">
      {" "}
      {/* Contenedor de la parte superior (Logo e íconos de navegación) */}{" "}
      <div className="flex flex-col items-center">
        {/* Logo */}{" "}
        <div className="mb-8 mt-2">
          {" "}
          <img src={logo} alt="Orvex Chat Logo" className="h-10 w-auto" />{" "}
        </div>
        {/* Íconos de navegación */}{" "}
        <nav className="flex flex-col space-y-6">
          {" "}
          <div className="p-3 rounded-xl bg-red-600 text-white cursor-pointer transition-transform transform hover:scale-110">
            <FaComments size={24} />{" "}
          </div>{" "}

        </nav>{" "}
      </div>
      {/* Botón de Cerrar Sesión en la parte inferior */}{" "}
      <div className="pb-4">
        {" "}
        <button
          onClick={handleLogout}
          className="p-3 rounded-xl hover:bg-red-600 hover:text-white transition-colors"
          title="Cerrar sesión"
        >
          <FaSignOutAlt size={24} />{" "}
        </button>{" "}
      </div>{" "}
    </div>
  );
}

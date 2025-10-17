// src/components/MainHeader.jsx

import { FaSearch } from "react-icons/fa";
import { useState } from "react";
// Importa una imagen de avatar, o usa un servicio de avatares
// import userAvatar from "../assets/user-avatar.png";

export default function MainHeader() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <header className="flex items-center justify-between bg-white text-gray-800 px-6 py-3 shadow-sm border-b border-gray-200">
      {/* Barra de búsqueda */}
      <div className="flex-grow flex items-center bg-gray-100 rounded-full px-4 py-2 max-w-lg">
        <FaSearch className="text-gray-500 mr-2" />
        <input
          type="text"
          placeholder="Buscar por número..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent outline-none flex-grow"
        />
      </div>

      {/*       <div className="flex items-center gap-3">
        <div className="flex flex-col items-end">
          <span className="text-lg font-semibold text-gray-700">
            Cedar Botsford
          </span>
          <span className="text-xs text-gray-500">Active</span>
        </div>
        <img
          src="https://i.pravatar.cc/50?u=a042581f4e29026704d"
          alt="User Avatar"
          className="h-10 w-10 rounded-full border-2 border-green-500"
        />
      </div>*/}

    </header>
  );
}

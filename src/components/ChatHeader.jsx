import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

export default function ChatHeader() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    navigate("/");
  };

  return (
    <header className="flex items-center justify-between bg-[#2D0303] text-white px-6 py-3 shadow-md">
      <div className="flex items-center gap-3">
        <img src={logo} alt="Orvex Chat Logo" className="h-10 w-auto" />
        <span className="text-2xl font-bold tracking-wide">Orvex Chat</span>
      </div>
      <button
        onClick={handleLogout}
        className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
      >
        Cerrar sesión
      </button>
    </header>
  );
}

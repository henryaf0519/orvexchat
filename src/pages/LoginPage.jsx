import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/authService";
import logo from "../assets/logo.png";
import { HiEye, HiEyeOff } from "react-icons/hi"; // Iconos de mostrar/ocultar

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false); // Para mostrar/ocultar la contraseña
  const [emailError, setEmailError] = useState(""); // Error de email
  const [passwordError, setPasswordError] = useState(""); // Error de contraseña
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("authToken")) {
      navigate("/chat");
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setEmailError("");
    setPasswordError("");
    setLoading(true);

    // Validación de los campos
    let isValid = true;

    // Si el email está vacío
    if (!email) {
      setEmailError("El correo es obligatorio.");
      isValid = false;
    }

    // Si la contraseña está vacía
    if (!password) {
      setPasswordError("La contraseña es obligatoria.");
      isValid = false;
    }

    if (!isValid) {
      setLoading(false);
      return;
    }

    try {
      const { token } = await login(email, password);
      console.log("token: ", token);
      localStorage.setItem("authToken", token);
      navigate("/chat");
    } catch (err) {
      setError("Credenciales inválidas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 font-sans text-[#1A1C20] sm:p-0">
      <div className="flex w-full max-w-5xl bg-white shadow-2xl rounded-3xl overflow-hidden min-h-[600px] transform transition-all duration-300 hover:scale-[1.005]">
        {/* Sección de branding izquierda (similar a la imagen) */}
        <div className="hidden md:flex w-1/2 bg-[#2D0303] text-white flex-col justify-between p-12 relative overflow-hidden rounded-l-3xl">
          {/* Formas abstractas circulares */}
          <div className="absolute top-[-10%] left-[-10%] w-72 h-72 bg-red-800 rounded-full opacity-10 transform rotate-45"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-red-800 rounded-full opacity-10 transform -rotate-45"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Logo y Nombre de Marca */}
            <div className="relative z-10 text-center">
              {/* Usando el placeholder de URL para el logo */}
              <img
                src={logo}
                alt="Orvex Chat Logo"
                className="w-48 h-auto mb-6 mx-auto"
              />
              <h1 className="text-5xl font-extrabold text-white text-shadow-lg leading-tight">
                Accede a
                <br />
                tu cuenta
              </h1>
              <p className="mt-4 text-xl text-red-100 opacity-90">
                Conecta al instante. Comunica con impacto
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-400 mt-auto text-left relative z-10">
            © 2025 Orvex Chat. All Rights Reserved.
          </p>
        </div>

        {/* Sección de formulario de login derecha */}
        <div className="w-full md:w-1/2 flex flex-col justify-center p-8 sm:p-12 bg-white">
          <h2 className="text-4xl font-extrabold mb-8 text-center text-[#1A1C20]">
            Iniciar sesión
          </h2>

          {error && (
            <p className="bg-red-100 text-red-700 p-3 rounded-lg text-sm mb-6 text-center animate-fade-in">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email-input"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Email
              </label>
              <input
                id="email-input"
                type="email"
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                
                disabled={loading}
              />
              {emailError && (
                <p className="text-sm text-red-600 mt-2">{emailError}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="password-input"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password-input"
                  type={showPassword ? "text" : "password"}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showPassword ? (
                    <HiEyeOff className="h-5 w-5 text-gray-600" />
                  ) : (
                    <HiEye className="h-5 w-5 text-gray-600" />
                  )}
                </button>
              </div>
              {passwordError && (
                <p className="text-sm text-red-600 mt-2">{passwordError}</p>
              )}
            </div>

            {/* Acciones/enlaces combinados similares a la imagen */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0 mt-6">
              <button
                type="submit"
                className="w-full sm:w-auto bg-red-600 text-white py-3 px-8 rounded-lg font-semibold text-lg hover:bg-red-700 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                disabled={loading}
              >
                {loading ? (
                  <svg
                    className="animate-spin h-5 w-5 text-white mr-3"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  "Entrar"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

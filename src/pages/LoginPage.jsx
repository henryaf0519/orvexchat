import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../services/authService';
import logo from '../assets/orvex-logo.svg';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('authToken')) {
      navigate('/chat');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { token } = await login(email, password);
      localStorage.setItem('authToken', token);
      navigate('/chat');
    } catch (err) {
      setError('Credenciales inválidas');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left branding section */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-b from-red-600 to-red-800 text-white flex-col items-center justify-center p-8">
        <img src={logo} alt="Orvex Chat" className="w-40 h-40 mb-4" />
        <h1 className="text-4xl font-bold">Orvex Chat</h1>
        <p className="mt-2 text-lg text-red-100">Conecta y conversa al instante</p>
      </div>
      {/* Right login form */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="w-full max-w-md bg-white shadow-xl rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Iniciar sesión</h2>
          {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Contraseña</label>
              <input
                type="password"
                className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition-colors"
            >
              Entrar
            </button>
          </form>
          <p className="text-center text-sm text-gray-600 mt-4">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-indigo-600 hover:underline">
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}


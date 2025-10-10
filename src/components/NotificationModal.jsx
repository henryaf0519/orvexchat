import { useEffect } from 'react';
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';

export default function NotificationModal({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000); // Cierra automáticamente después de 4 segundos

    return () => clearTimeout(timer);
  }, [onClose]);

  const config = {
    success: {
      icon: <FaCheckCircle className="text-green-500" />,
      barColor: 'bg-green-500',
    },
    error: {
      icon: <FaExclamationTriangle className="text-red-500" />,
      barColor: 'bg-red-500',
    },
    info: {
      icon: <FaInfoCircle className="text-blue-500" />,
      barColor: 'bg-blue-500',
    },
  };

  const { icon, barColor } = config[type] || config.info;

  return (
    <div className="fixed top-5 right-5 z-50 animate-slide-in-right">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="p-4 flex items-start gap-4">
          <div className="text-2xl pt-1">{icon}</div>
          <div className="flex-1">
            <h4 className="font-bold text-gray-800">
              {type === 'success' ? 'Éxito' : type === 'error' ? 'Error' : 'Información'}
            </h4>
            {/* --- INICIO DE LA CORRECCIÓN ---
              En lugar de renderizar el mensaje como texto, usamos dangerouslySetInnerHTML
              para que React interprete las etiquetas HTML que le pasamos.
            */}
            <div 
              className="text-sm text-gray-600 mt-1" 
              dangerouslySetInnerHTML={{ __html: message }} 
            />
            {/* --- FIN DE LA CORRECCIÓN --- */}
          </div>
        </div>
        <div className={`h-1.5 ${barColor} animate-progress-bar`}></div>
      </div>
    </div>
  );
}
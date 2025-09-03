// src/components/NotificationModal.jsx
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

const modalRoot = document.getElementById('modal-root');

export default function NotificationModal({ message, type, onClose }) {
  // Configura un temporizador para que el modal se cierre solo después de 4 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000); 

    return () => clearTimeout(timer);
  }, [onClose]);

  const isSuccess = type === 'success';
  const icon = isSuccess ? <FaCheckCircle /> : <FaExclamationTriangle />;
  const bgColor = isSuccess ? 'bg-green-600' : 'bg-red-600';

 return createPortal(
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 animate-fade-in-down">
      <div
        className={`flex items-center p-4 rounded-lg shadow-2xl ${bgColor} text-white min-w-[300px]`}
      >
        <div className="text-xl mr-3">{icon}</div>
        <p className="font-semibold">{message}</p>
      </div>
    </div>,
    modalRoot // 4. Especifica que se debe renderizar en nuestro div "modal-root"
  );
}
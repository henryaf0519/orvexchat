import MainSidebar from "../components/MainSidebar";
import CreateButtonForm from "../components/CreateButtonForm";
import { getInteractiveButtons } from "../services/reminderService";
import { useEffect, useState } from "react";
import { FaExclamationTriangle } from 'react-icons/fa';

// Componente para mostrar la lista de botones existentes y manejar sus estados de carga/error
const ExistingButtonsList = ({ buttons, isLoading, error }) => {
    if (isLoading) {
        return <p className="text-center text-gray-500 mt-8">Cargando plantillas existentes...</p>;
    }

    if (error) {
        return (
            <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                <FaExclamationTriangle className="inline-block mr-2 text-yellow-500" />
                <span className="text-yellow-700">{error}</span>
            </div>
        );
    }
    
    if (buttons.length > 0) {
        return (
            <div className="mt-8">
                <h2 className="text-2xl font-bold text-gray-700 mb-4">Plantillas Guardadas</h2>
                {/* Aquí es donde mapearías y mostrarías los botones guardados */}
                <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-600">La visualización de plantillas guardadas se implementará aquí.</p>
                </div>
            </div>
        )
    }

    return null; // No mostrar nada si no hay botones y no hay error
};


export default function ButtonsPage() {
  const [buttons, setButtons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Función para cargar los botones, maneja los estados de carga y error
  const fetchButtons = () => {
    setIsLoading(true);
    setError(null);
    getInteractiveButtons()
      .then(setButtons)
      .catch(err => {
        console.error(err);
        setError("No se pudieron cargar las plantillas de botones. Aún puedes crear una nueva.");
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchButtons();
  }, []);
  
  // Esta función se pasa al formulario para que pueda refrescar la lista después de una creación exitosa
  const onButtonCreated = () => {
    fetchButtons();
  };

  return (
    <div className="h-screen flex bg-gray-100">
      <MainSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">
              Gestor de Botones Interactivos
            </h1>
            <CreateButtonForm onButtonCreated={onButtonCreated} />
            
            <hr className="my-8" />

            <ExistingButtonsList buttons={buttons} isLoading={isLoading} error={error} />
        </main>
      </div>
    </div>
  );
}
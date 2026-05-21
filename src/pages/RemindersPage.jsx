// src/pages/RemindersPage.jsx
import { useState } from "react"; // 1. Importar useState
import MainSidebar from "../components/MainSidebar";
import MainHeader from "../components/MainHeader";
import CreateReminderForm from "../components/CreateReminderForm"; 
import CreateCsvReminderForm from "../components/CreateCsvReminderForm"; // 2. Importar tu nuevo componente
import RemindersList from "../components/RemindersList";

export default function RemindersPage() {
  // 3. Crear el estado para controlar la vista activa. Por defecto mostrará 'normal'
  const [activeForm, setActiveForm] = useState('normal'); 

  return (
    <div className="h-screen flex bg-gray-100">
      <MainSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">
              Gestor de Publicidad
            </h1>

            {/* 4. Selector de Pestañas (Tabs) */}
            <div className="flex space-x-2 mb-6 bg-gray-200 p-1 rounded-lg w-fit">
              <button
                onClick={() => setActiveForm('normal')}
                className={`px-6 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
                  activeForm === 'normal' 
                    ? 'bg-white text-gray-800 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-300/50'
                }`}
              >
                Envío Programado / CRM
              </button>
              
              <button
                onClick={() => setActiveForm('csv')}
                className={`px-6 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
                  activeForm === 'csv' 
                    ? 'bg-white text-gray-800 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-300/50'
                }`}
              >
                Envío Inmediato (CSV)
              </button>
            </div>

            {/* 5. Renderizado Condicional del Formulario */}
            {activeForm === 'normal' ? (
              <CreateReminderForm />
            ) : (
              <CreateCsvReminderForm />
            )}

            {/* La lista de recordatorios siempre se muestra debajo */}
            <RemindersList />
        </main>
      </div>
    </div>
  );
}
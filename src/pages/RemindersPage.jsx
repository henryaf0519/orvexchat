// src/pages/RemindersPage.jsx

import MainSidebar from "../components/MainSidebar";
import MainHeader from "../components/MainHeader";
// Vamos a crear estos dos componentes a continuación
import CreateReminderForm from "../components/CreateReminderForm"; 
import RemindersList from "../components/RemindersList";

export default function RemindersPage() {
  return (
    <div className="h-screen flex bg-gray-100">
      <MainSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">
              Gestor de Publicidad
            </h1>
            <CreateReminderForm />
            <RemindersList />
        </main>
      </div>
    </div>
  );
}
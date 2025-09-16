import React from 'react';
import MainSidebar from '../components/MainSidebar';
import KanbanBoard from '../components/KanbanBoard';

export default function ContactsPage() {
  return (
    <div className="h-screen flex bg-gray-100">
      <MainSidebar />
      {/* ↓↓↓ CAMBIO AQUÍ: Eliminamos p-6 y overflow-y-auto del contenedor principal ↓↓↓ */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 flex flex-col overflow-hidden p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 flex-shrink-0">
            Gestor de Contactos (CRM)
          </h1>
          {/* El KanbanBoard ahora controlará su propio scroll */}
          <KanbanBoard />
        </main>
      </div>
    </div>
  );
}
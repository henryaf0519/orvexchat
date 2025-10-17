import React, { useState, useEffect } from 'react';
import MainSidebar from "../components/MainSidebar";
import KanbanBoard from "../components/KanbanBoard";
import ContactsList from "../components/ContactsList";
import { getContacts } from "../services/reminderService";
import { useChatStore } from "../store/chatStore";
import { FaSearch, FaTh, FaList } from "react-icons/fa";

export default function ContactsPage() {
  const [view, setView] = useState("kanban");
  const [searchTerm, setSearchTerm] = useState("");
  const [allContacts, setAllContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const companyId = useChatStore((state) => state.companyId);

  useEffect(() => {
    if (!companyId) return;

    getContacts()
      .then((contacts) => {
        const processedContacts = contacts.map((contact) => ({
          ...contact,
          id: `${companyId}#${contact.conversationId}`,
        }));
        setAllContacts(processedContacts);
        setFilteredContacts(processedContacts);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error al cargar contactos:", error);
        setIsLoading(false);
      });
  }, [companyId]);

  useEffect(() => {
    const results = allContacts.filter(
      (contact) =>
        contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.number?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredContacts(results);
  }, [searchTerm, allContacts]);

  return (
    <div className="h-screen flex bg-gray-50">
      <MainSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 flex flex-col overflow-hidden p-6">
          <div className="flex justify-between items-center mb-6 flex-shrink-0">
            <h1 className="text-3xl font-bold text-gray-800">
              Gestor de Contactos (CRM)
            </h1>
            {/* 3. Barra de Búsqueda y Selector de Vista */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <FaSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o número..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div className="flex bg-gray-200 p-1 rounded-lg">
                <button
                  onClick={() => setView("kanban")}
                  title="Vista Kanban"
                  className={`p-2 rounded-md ${
                    view === "kanban" ? "bg-white shadow" : "text-gray-500"
                  }`}
                >
                  <FaTh size={20} />
                </button>
                <button
                  onClick={() => setView("list")}
                  title="Vista de Lista"
                  className={`p-2 rounded-md ${
                    view === "list" ? "bg-white shadow" : "text-gray-500"
                  }`}
                >
                  <FaList size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* 4. Renderizado Condicional de la Vista */}
          <div className="flex-1 overflow-auto">
            {isLoading ? (
              <p>Cargando...</p>
            ) : view === "kanban" ? (
              <KanbanBoard contacts={filteredContacts} />
            ) : (
              <ContactsList contacts={filteredContacts} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

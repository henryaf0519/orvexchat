import React, { useEffect, useState } from 'react';
import MainSidebar from '../components/MainSidebar';
import ContactsList from '../components/ContactsList';
import { getContacts } from '../services/reminderService';

export default function ContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const contactsData = await getContacts();
        setContacts(contactsData);
      } catch (error) {
        console.error("Error al cargar los contactos:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContacts();
  }, []);

  return (
    <div className="h-screen flex bg-gray-100">
      <MainSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            Gestor de Contactos (CRM)
          </h1>
          <ContactsList contacts={contacts} isLoading={isLoading} />
        </main>
      </div>
    </div>
  );
}
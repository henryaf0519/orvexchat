import React from 'react';
import { FaUserCircle } from 'react-icons/fa';

export default function ContactsList({ contacts, isLoading }) {
  if (isLoading) {
    return <p className="text-center text-gray-500 mt-8">Cargando contactos...</p>;
  }

  if (contacts.length === 0) {
    return <p className="text-center text-gray-500 mt-8">No se encontraron contactos.</p>;
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Número de Teléfono
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {contacts.map((contact) => (
              <tr key={contact.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <FaUserCircle className="h-8 w-8 text-gray-400 mr-3" />
                    <div className="text-sm font-medium text-gray-900">{contact.name}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-600">{contact.number}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
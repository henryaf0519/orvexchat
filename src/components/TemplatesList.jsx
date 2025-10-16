// src/components/TemplatesList.jsx
import React from 'react';
import { Edit, Trash2 } from 'lucide-react';

const StatusBadge = ({ status }) => {
  const statusConfig = {
    APPROVED: { text: 'Aprobado', color: 'bg-green-100 text-green-800' },
    PENDING: { text: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
    REJECTED: { text: 'Rechazado', color: 'bg-red-100 text-red-800' },
    // Añadimos más estados que pueden venir de la API
    PAUSED: { text: 'Pausado', color: 'bg-blue-100 text-blue-800' },
    DISABLED: { text: 'Deshabilitado', color: 'bg-gray-100 text-gray-800' },
  };
  const config = statusConfig[status] || { text: status, color: 'bg-gray-100 text-gray-800' };
  return <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${config.color}`}>{config.text}</span>;
};

// ✅ Recibimos las nuevas funciones onEdit y onDelete
export default function TemplatesList({ templates, isLoading, onEdit, onDelete }) {
  if (isLoading) return <p className="text-center text-gray-500 mt-8">Cargando plantillas...</p>;
  if (!templates || templates.length === 0) return <p className="text-center text-gray-500 mt-8">No se encontraron plantillas.</p>;

  return (
    // ✅ Eliminamos el margen (mt-8) para que el contenedor principal lo controle
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Idioma</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              {/* ✅ Nueva columna para acciones */}
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {templates.map((template) => (
              <tr key={template.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{template.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{template.category}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{template.language}</td>
                <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={template.status} /></td>
                {/* ✅ Nuevos botones de acción */}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <button onClick={() => onEdit(template)} className="text-indigo-600 hover:text-indigo-900 transition duration-150 ease-in-out" title="Editar">
                    <Edit size={18} />
                  </button>
                  <button onClick={() => onDelete(template.id)} className="text-red-600 hover:text-red-900 transition duration-150 ease-in-out" title="Eliminar">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
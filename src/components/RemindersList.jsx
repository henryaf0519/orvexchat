// src/components/RemindersList.jsx
import { useEffect } from 'react';
import { useChatStore } from '../store/chatStore';
import { FaTrash } from 'react-icons/fa';
import { shallow } from 'zustand/shallow';

export default function RemindersList() {
  const { schedules, loadingSchedules, fetchSchedules, deleteSchedule } = useChatStore(
    (state) => ({
      schedules: state.schedules,
      loadingSchedules: state.loadingSchedules,
      fetchSchedules: state.fetchSchedules,
      deleteSchedule: state.deleteSchedule,
    }),
    shallow
  );

  // ----> INICIO DE LA CORRECCIÓN <----
  useEffect(() => {
    // Esta función se llamará solo una vez cuando el componente se monte por primera vez.
    fetchSchedules();
  }, []); // El arreglo de dependencias vacío [] es la clave.
  // ----> FIN DE LA CORRECCIÓN <----

  const handleDelete = async (scheduleId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este recordatorio?')) {
      try {
        await deleteSchedule(scheduleId);
      } catch (error) {
        console.error("Error al eliminar", error);
        alert("No se pudo eliminar el recordatorio.");
      }
    }
  };

  const formatScheduleTime = (schedule) => {
    if (schedule.scheduleType === 'once' && schedule.sendAt) {
      return new Date(schedule.sendAt).toLocaleString('es-CO', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    }
    if (schedule.scheduleType === 'recurring' && schedule.cronExpression) {
      return `Recurrente (${schedule.cronExpression})`;
    }
    return 'No especificado';
  };

  if (loadingSchedules && !schedules?.length) {
    return <p className="text-center text-gray-500">Cargando recordatorios...</p>;
  }

  const safeSchedules = schedules || [];

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">Recordatorios Programados</h3>
      {safeSchedules.length === 0 ? (
        <p className="text-center text-gray-500">No hay recordatorios programados.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mensaje</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Programación</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {safeSchedules.map((schedule) => (
                <tr key={schedule.scheduleId}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{schedule.name}</div>
                    <div className="text-sm text-gray-500">{schedule.phoneNumbers.join(', ')}</div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-700 max-w-xs truncate" title={schedule.message}>{schedule.message}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatScheduleTime(schedule)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleDelete(schedule.scheduleId)} className="text-red-600 hover:text-red-900">
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
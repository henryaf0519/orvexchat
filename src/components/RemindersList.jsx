// src/components/RemindersList.jsx (Versión Definitiva)
import { useEffect } from 'react';
import { useChatStore } from '../store/chatStore';
import { FaTrash } from 'react-icons/fa';

export default function RemindersList() {
  // ✅ SOLUCIÓN: Selecciona cada pieza del estado individualmente.
  // Esto garantiza que el componente solo se re-renderice cuando estas piezas específicas cambien.
  const schedules = useChatStore((state) => state.schedules);
  const loadingSchedules = useChatStore((state) => state.loadingSchedules);
  const fetchSchedules = useChatStore((state) => state.fetchSchedules);
  const deleteSchedule = useChatStore((state) => state.deleteSchedule);

  useEffect(() => {
    // Este console.log ahora solo debería mostrarse dos veces en el montaje inicial (por StrictMode)
    // y no debería repetirse en un bucle.
    console.log("Fetching schedules... (should only see this once per mount)");
    fetchSchedules();
  }, [fetchSchedules]); // Es una buena práctica incluir la función del store en las dependencias.

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

  // src/components/RemindersList.jsx

const formatScheduleTime = (schedule) => {
  if (schedule.scheduleType === 'once' && schedule.sendAt) {
    const localDateString = schedule.sendAt.slice(0, -1);
    return new Date(localDateString).toLocaleString('es-CO', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }
  if (schedule.scheduleType === 'recurring' && schedule.cronExpression) {
    return `Recurrente (${schedule.cronExpression})`;
  }
  return 'No especificado';
};

  if (loadingSchedules && schedules.length === 0) {
    return <p className="text-center text-gray-500">Cargando recordatorios...</p>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">Recordatorios Programados</h3>
      {schedules.length === 0 ? (
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
              {schedules.map((schedule) => (
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
import { useEffect, useState } from 'react';
import { useChatStore } from '../store/chatStore';
import { FaTrash } from 'react-icons/fa';
import ConfirmationModal from './ConfirmationModal'; // Importa el nuevo modal

export default function RemindersList() {
  const schedules = useChatStore((state) => state.schedules);
  const loadingSchedules = useChatStore((state) => state.loadingSchedules);
  const fetchSchedules = useChatStore((state) => state.fetchSchedules);
  const deleteSchedule = useChatStore((state) => state.deleteSchedule);

  // Estados para controlar el modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState(null);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  // Esta función abre el modal y guarda el ID del recordatorio a eliminar
  const handleDeleteClick = (scheduleId) => {
    setScheduleToDelete(scheduleId);
    setIsModalOpen(true);
  };

  // Esta función se ejecuta cuando el usuario confirma la eliminación
  const handleConfirmDelete = async () => {
    if (scheduleToDelete) {
      try {
        await deleteSchedule(scheduleToDelete);
      } catch (error) {
        console.error("Error al eliminar", error);
        alert("No se pudo eliminar el recordatorio.");
      } finally {
        // Cierra el modal y limpia el estado
        setIsModalOpen(false);
        setScheduleToDelete(null);
      }
    }
  };
  
  const formatCronExpression = (cronExpression) => {
    if (!cronExpression) return 'Recurrente (inválido)';

    const parts = cronExpression.split(' ');
    if (parts.length < 5) return `Recurrente (${cronExpression})`;

    const [minute, hour, , , daysOfWeekStr] = parts;
    const time = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;

    const dayMap = {
      '0': 'Dom', '1': 'Lun', '2': 'Mar', '3': 'Mié', '4': 'Jue', '5': 'Vie', '6': 'Sáb'
    };

    if (daysOfWeekStr === '*') {
      return `Todos los días a las ${time}`;
    }

    const days = daysOfWeekStr.split(',').sort();

    if (days.join(',') === '0,1,2,3,4,5,6') {
      return `Todos los días a las ${time}`;
    }
    if (days.join(',') === '1,2,3,4,5') {
      return `Lunes a Viernes a las ${time}`;
    }
    if (days.join(',') === '0,6') {
      return `Fines de semana a las ${time}`;
    }

    const dayNames = days.map(d => dayMap[d] || '').join(', ');
    return `${dayNames} a las ${time}`;
  };


  const formatScheduleTime = (schedule) => {
    if (schedule.scheduleType === 'once' && schedule.sendAt) {
      const localDateString = schedule.sendAt.slice(0, -1);
      return new Date(localDateString).toLocaleString('es-CO', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    }
    if (schedule.scheduleType === 'recurring' && schedule.cronExpression) {
      return formatCronExpression(schedule.cronExpression);
    }
    return 'No especificado';
  };

  if (loadingSchedules && schedules.length === 0) {
    return <p className="text-center text-gray-500">Cargando recordatorios...</p>;
  }

  return (
    <>
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Eliminación"
        message="¿Estás seguro de que quieres eliminar este recordatorio? Esta acción no se puede deshacer."
      />
      <div className="bg-white p-6 rounded-lg shadow-md mt-8">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">Recordatorios Programados</h3>
        {schedules.length === 0 ? (
          <p className="text-center text-gray-500">No hay recordatorios programados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre Campaña</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plantilla</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Programación</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {schedules.map((schedule) => (
                  <tr key={schedule.scheduleId}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{schedule.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700 max-w-xs truncate" title={schedule.templateName}>{schedule.templateName}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatScheduleTime(schedule)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleDeleteClick(schedule.scheduleId)} className="text-gray-400 hover:text-red-600">
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
    </>
  );
}
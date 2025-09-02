// src/services/reminderService.js
import { apiFetch } from './api';

/**
 * Obtiene la lista de todos los recordatorios programados.
 * Esta es la función que buscará los datos en tu backend.
 */
export async function getSchedules() {
  try {
    const response = await apiFetch('/bulk-messaging/schedules');
    if (!response.ok) {
      throw new Error('Error al obtener los recordatorios.');
    }
    return await response.json();
  } catch (error) {
    console.error('Fallo en getSchedules:', error);
    // Devolvemos un array vacío en caso de error para no romper la UI.
    return []; 
  }
}

/**
 * Crea un nuevo recordatorio programado.
 * @param {object} scheduleData - Los datos del recordatorio.
 */
export async function createSchedule(scheduleData) {
  try {
    const response = await apiFetch('/bulk-messaging/schedule', {
      method: 'POST',
      body: JSON.stringify(scheduleData),
    });
    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(errorBody.message || 'Error al crear el recordatorio.');
    }
    return await response.json();
  } catch (error) {
    console.error('Fallo en createSchedule:', error);
    throw error;
  }
}

/**
 * Elimina un recordatorio por su ID.
 * @param {string} scheduleId - El ID del recordatorio a eliminar.
 */
export async function deleteSchedule(scheduleId) {
  try {
    const response = await apiFetch(`/bulk-messaging/schedule/${scheduleId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Error al eliminar el recordatorio.');
    }
    return { success: true };
  } catch (error) {
    console.error('Fallo en deleteSchedule:', error);
    throw error;
  }
}
// src/services/appointmentService.js
import { apiFetch } from './api';

/**
 * Obtiene las citas del calendario (GET /appointments)
 */
export const getAppointments = async () => {
  try {
    // Llamamos al endpoint que creamos en el CalendarController de NestJS
    const response = await apiFetch('/appointments', {
      method: 'GET',
    });

    if (!response.ok) {
      // Intentamos leer el error del backend si existe
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al obtener las citas');
    }

    // El backend devuelve directamente el array de citas []
    return await response.json();
  } catch (error) {
    console.error("Error in getAppointments service:", error);
    throw error;
  }
};
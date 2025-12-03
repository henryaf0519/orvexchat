// src/services/appointmentService.js
import { apiFetch } from "./api";

/**
 * Obtiene las citas del calendario (GET /appointments)
 */
export const getAppointments = async () => {
  try {
    const response = await apiFetch("/appointments", {
      method: "GET",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Error al obtener las citas");
    }

    return await response.json();
  } catch (error) {
    console.error("Error in getAppointments service:", error);
    throw error;
  }
};

export const createAppointment = async (appointmentData) => {
  try {
    const response = await apiFetch("/appointments", {
      method: "POST",
      body: JSON.stringify(appointmentData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Error al crear la cita");
    }

    return await response.json();
  } catch (error) {
    console.error("Error in createAppointment service:", error);
    throw error;
  }
};

export const cancelAppointment = async (appointmentId) => {
  try {
    const encodedId = encodeURIComponent(appointmentId);
    const response = await apiFetch(`/appointments/${encodedId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Error al cancelar la cita");
    }

    return { success: true };
  } catch (error) {
    console.error("Error in cancelAppointment service:", error);
    throw error;
  }
};

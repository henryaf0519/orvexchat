import { apiFetch } from './api';

/**
 * Envía la configuración completa de la plantilla al backend para su creación en Meta.
 * @param {Object} templateData - El objeto JSON que define la plantilla, puede incluir un base64 de imagen.
 * @returns {Promise<Object>} - La respuesta de la API de creación de plantillas.
 */
export const createTemplate = async (templateData) => {
  try {
    const response = await apiFetch('/templates', {
      method: 'POST',
      body: JSON.stringify(templateData),
    });

    const responseData = await response.json();

    if (!response.ok) {
      // Intenta obtener el mensaje de error específico de la API de Meta si está disponible
      const metaError = responseData.metaError?.error_user_msg;
      const defaultMessage = responseData.message || 'Error desconocido al crear la plantilla.';
      throw new Error(metaError || defaultMessage);
    }

    return responseData;
  } catch (error) {
    console.error('Error al crear la plantilla:', error);
    throw error;
  }
};

export const updateTemplate = async (templateId, updateData) => {
  try {
    const response = await apiFetch(`/templates/${templateId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });

    const responseData = await response.json();
    if (!response.ok) {
      const errorMessage = responseData.message || 'Error desconocido al actualizar la plantilla.';
      throw new Error(errorMessage);
    }

    return responseData;
  } catch (error) {
    console.error('Error al actualizar la plantilla:', error);
    throw error;
  }
};

export const getTemplates = async () => {
  try {
    const response = await apiFetch('/templates');
    if (!response.ok) {
      throw new Error('Error al obtener las plantillas.');
    }
    return await response.json();
  } catch (error) {
    console.error('Fallo en getTemplates:', error);
    throw error;
  }
};

export const deleteTemplate = async (templateName) => {
  try {
    const response = await apiFetch(`/templates/${templateName}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Error al eliminar la plantilla.' }));
      throw new Error(errorData.message || 'Ocurrió un error en el servidor.');
    }
    
    return await response.json();

  } catch (error) {
    console.error(`Fallo al eliminar la plantilla "${templateName}":`, error);
    throw error;
  }
};
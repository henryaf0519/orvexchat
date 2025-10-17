// src/services/authService.js

import { apiFetch } from "./api"; // Importa nuestro interceptor centralizado
import { useChatStore } from '../store/chatStore';

/**
 * Función para iniciar sesión (login) de un usuario.
 */
export async function login(email, password) {
  try {
    // ✅ Usa apiFetch con solo el endpoint y las opciones necesarias
    const response = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Error desconocido en el login" }));
      throw new Error(errorData.message || "Credenciales inválidas");
    }

     return await response.json(); 
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    throw error;
  }
}

/**
 * Función para verificar si ya existe una sesión activa al cargar la página.
 */
export async function verifySession() {
  try {
    // ✅ Usa apiFetch solo con el endpoint. El método GET es el predeterminado.
    const response = await apiFetch("/auth/profile");

    if (!response.ok) {
      throw new Error("No hay sesión activa");
    }

    return response.json(); // Devuelve los datos del usuario
  } catch (error) {
    // Este log es opcional, ya que es normal que falle si no hay sesión
    console.log("Verificación de sesión fallida. Redirigiendo a login.");
    throw error;
  }
}

/**
 * Función para registrar un nuevo usuario.
 * Nota: Tu endpoint en el backend es '/auth/register', pero aquí usas '/user/register'.
 * Asegúrate de que coincidan. Lo corregiré a '/auth/register'.
 */
export async function register(email, password, waba_id, whatsapp_token) {
  try {
    const response = await apiFetch("/auth/register", {
      // ✅ Corregido a /auth/register y usando apiFetch
      method: "POST",
      body: JSON.stringify({ email, password, waba_id, whatsapp_token }), // ✅ Añadidos los nuevos campos
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Error desconocido en el registro" }));
      throw new Error(errorData.message || "No se pudo registrar el usuario");
    }

    return response.json();
  } catch (error) {
    console.error("Error al registrar usuario:", error);
    throw error;
  }
}

/**
 * Función para cerrar la sesión del usuario.
 */
export async function logout() {
  try {
    // No nos importa la respuesta, solo que se ejecute.
    await apiFetch("/auth/logout", { method: "POST" });
  } catch (error) {
    // No es crítico si esto falla, ya que la sesión del frontend se limpiará de todas formas.
    console.error("Error al cerrar sesión en el servidor:", error);
  }
}

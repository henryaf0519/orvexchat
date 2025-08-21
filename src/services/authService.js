// Define la URL base de tu API de NestJS.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Función para iniciar sesión (login) de un usuario.
 *
 * @param {string} email - El correo electrónico del usuario.
 * @param {string} password - La contraseña del usuario (en texto plano).
 * @returns {Promise<Object>} Un objeto con el access_token si el login es exitoso.
 * @throws {Error} Si las credenciales son inválidas o hay un error.
 */
export async function login(email, password) {
  const LOGIN_URL = `${API_BASE_URL}/auth/login`;

  try {
    const response = await fetch(LOGIN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Error desconocido en el login" }));
      throw new Error(errorData.message || "Credenciales inválidas");
    }

    const data = await response.json();
    return { templates: data.templates, userData: data.userData };
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    throw error;
  }
}

export async function verifySession() {
  const PROFILE_URL = `${API_BASE_URL}/auth/profile`;

  try {
    const response = await fetch(PROFILE_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("No hay sesión activa");
    }

    return response.json();
  } catch (error) {
    console.log("Verificación de sesión fallida:", error.message);
    throw error;
  }
}

/**
 * Función para registrar un nuevo usuario.
 *
 * @param {string} email - El correo electrónico del nuevo usuario.
 * @param {string} password - La contraseña del nuevo usuario (en texto plano).
 * @returns {Promise<Object>} Un objeto con el mensaje de éxito y el email del usuario registrado.
 * @throws {Error} Si no se pudo registrar el usuario.
 */
export async function register(email, password) {
  const REGISTER_URL = `${API_BASE_URL}/user/register`;

  try {
    const response = await fetch(REGISTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
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

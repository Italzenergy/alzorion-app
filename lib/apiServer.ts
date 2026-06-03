// lib/apiServer.ts
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

// 1. Leemos la URL base directamente desde el entorno seguro de Next.js
const URL_BASE = process.env.NEXT_PUBLIC_API_URL;

async function fetchServer<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  if (!URL_BASE) {
    throw new Error("La variable de entorno NEXT_PUBLIC_API_URL no está definida.");
  }

  const url = `${URL_BASE}${endpoint}`;

  // 2. Extraemos las cookies que el navegador del usuario le envió a Next.js.
  // En las versiones modernas de Next.js (15 y 16), cookies() es asíncrono.
  const cookieStore = await cookies();
  const formatoCookies = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');

  // 3. Construimos la configuración de la petición para el servidor de Node.js
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      // Inyectamos las cookies manualmente para que el backend reconozca al usuario
      'Cookie': formatoCookies, 
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      // SI EL BACKEND RESPONDE 401 (SESIÓN EXPIRADA / INVÁLIDA)
      if (response.status === 401) {
        console.warn("Sesión expirada detectada en el servidor. Redirigiendo al login...");
        // Cortamos la ejecución y redirigimos de forma nativa en el servidor
        redirect('/login');
      }

      // --- DESEMPAQUETAR EL ERROR REAL DEL BACKEND ---
      let mensajeError = `Error HTTP: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData && errorData.error) {
          mensajeError = errorData.error;
        } else if (errorData && errorData.message) {
          mensajeError = errorData.message;
        }
      } catch (e) {
        // Ignoramos si no es un JSON válido y dejamos el mensaje por defecto
      }

      throw new Error(mensajeError);
    }

    // Retornamos los datos puros tipados
    return await response.json() as T;
  } catch (error) {
    // Si Next.js arrojó un redirect por el error 401, debemos dejar que pase sin interrumpirlo
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error;
    }
    console.error("Fallo de red en la petición de servidor:", error);
    throw error;
  }
}

// Interfaz pública de herramientas exclusivas para tus Server Components (Padres)
export const apiServer = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    fetchServer<T>(endpoint, { ...options, method: 'GET' }),
};
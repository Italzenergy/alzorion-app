import { useAuthStore } from "@/store/authStore";
//apuntamos al backend 
const URL_BASE = process.env.NEXT_PUBLIC_API_URL;

//motor principal
async function fetchClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${URL_BASE}${endpoint}`;
  
  // 1. DETECTAMOS SI ES FORM DATA (ARCHIVOS)
  const isFormData = options.body instanceof FormData;

  //configuraciones de la peticion (Objeto)
  const config: RequestInit = {
      ...options,
      headers: {
        // SOLO ponemos application/json si NO es un archivo
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...options.headers, //permitimos sobreescribir headers si es necesario        
      },
      //permitir que los cookies viajen por el back
      credentials: 'include',
  };

  try {
    const response = await fetch(url, config);
    //interceptamos la respuesta 
 
    if (!response.ok) {
      
      // SI EL BACKEND DICE "401 UNAUTHORIZED"
      if (response.status === 401) {
        console.warn("Sesión expirada o inválida. Redirigiendo al login...");
        useAuthStore.getState().logout(true);
        // Retornamos una promesa rechazada para detener la ejecución inmediatamente
        return Promise.reject(new Error("Sesión expirada")); 
      }

      // --- NUEVO: DESEMPAQUETAR EL ERROR REAL DEL BACKEND ---
      let mensajeError = `Error HTTP: ${response.status}`; // Mensaje por defecto
      
      try {
        // Intentamos abrir la caja de error que mandó el backend
        const errorData = await response.json();
        
        // Si el backend mandó { "error": "Detalle del problema" } o { "message": "..." }
        if (errorData && errorData.error) {
          mensajeError = errorData.error;
        } else if (errorData && errorData.message) {
          mensajeError = errorData.message;
        }
      } catch (e) {
        // Si no se puede parsear a JSON (ej. si el server crasheó feo), ignoramos y usamos el por defecto
      }

      // Lanzamos la excepción con el mensaje REAL para que el frontend lo atrape
      throw new Error(mensajeError);
    }
    //limpiamos los datos 
    //extraigo el json directamente asi el front recibe la data pura y dura 
    const data: T = await response.json();
    return data;
  } catch (error) {
    console.error("Fallo en la red para la peticion:", error);
    throw error;
  }
}

//menu de atajos prefabricados 
const api = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    fetchClient<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: any, options?: RequestInit) =>
    fetchClient<T>(endpoint, {
      ...options,
      method: 'POST',
      // 2. SOLO SERIALIZAMOS A JSON SI NO ES UN ARCHIVO
      body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined)
    }),

  put: <T>(endpoint: string, body?: any, options?: RequestInit) =>
    fetchClient<T>(endpoint, {
      ...options,
      method: 'PUT',
      // 2. SOLO SERIALIZAMOS A JSON SI NO ES UN ARCHIVO
      body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined)
    }),

  delete: <T>(endpoint: string, options?: RequestInit) =>
    fetchClient<T>(endpoint, { ...options, method: 'DELETE' })
}

export default api;
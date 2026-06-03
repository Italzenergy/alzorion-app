import { create } from 'zustand';
import api from '@/lib/api';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
}
// indicamos los que vamos a revivir 
interface Autoresponse{
  user:User;
  permissions:string[];
}

interface AuthState {
  user: User | null;
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  checkAuth: () => Promise<void>;
  logout: (expired?: boolean) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  permissions: [],
  isAuthenticated: false,
  isLoading: true, // Inicia en true para que muestre la pantalla de carga al inicio

  login: async (email, password) => {
    // Le pegamos a tu endpoint real
    //usamos <AuthResponse> en lugar de <any> para tipado estricto.
    const respuesta = await api.post<Autoresponse>('/auth/login', {email, password});
    
    // Si funciona, guardamos los datos en la memoria global
    set({ 
      user: respuesta.user, 
      permissions: respuesta.permissions,
      isAuthenticated: true,
      isLoading: false // Quitamos el loading al entrar
    });
  },

  checkAuth: async () => {
    try {
      const check =await api.get<AuthState>('/auth/profile')
      set({ 
        user: check.user, 
        permissions: check.permissions, 
        isAuthenticated: true,
        isLoading: false 
      }); 
    } catch (error) {
      set({ user: null, permissions: [], isAuthenticated: false, isLoading: false });
    }
  },

  logout: async () => {
    try {
      //le decimos al back que destruya la cookie 
      //aqui puede que nos de error en post porque tenemos configurado en api.ts
      //que todos los metodos post deben recibir algun argumento lo cual no es cierto 
      //no todos los post deben recibir algo se puede poner{} al final de la ruta 
      //pero lo indicado para no hacer este proceso en todos los  compoentes que utlicen post 
      //es poner ? en el body como ya se encuentra en el archivo 
      await api.post('/auth/logout');
    } finally {
      set({ user: null, permissions: [], isAuthenticated: false, isLoading: false });
      window.location.href = '/login';
    }
  }
}));
import { create } from 'zustand'
import axios from 'axios'

export type UserRole = 'admin' | 'supervisor' | 'operador'

interface AuthState {
  role: UserRole
  setRole: (role: UserRole) => void
}

// Configurar cabecera inicial de Axios con el rol por defecto 'admin'
axios.defaults.headers.common['X-Demo-Role'] = 'admin'

export const useAuthStore = create<AuthState>((set) => ({
  role: 'admin',
  setRole: (role) => {
    // Sincronizar con la cabecera HTTP de Axios en caliente
    axios.defaults.headers.common['X-Demo-Role'] = role
    set({ role })
  },
}))

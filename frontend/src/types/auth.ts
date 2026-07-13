export type UserRole = 'admin' | 'supervisor' | 'operador'

export interface User {
  user_id: number
  email: string
  username: string
  role: UserRole
  is_active: boolean
  created_at: string | null
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  username: string
  password: string
  role: UserRole
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  user: User
}

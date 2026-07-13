import api from './api'
import type { LoginCredentials, RegisterData, TokenResponse, User } from '../types/auth'

export const authService = {
  async login(credentials: LoginCredentials): Promise<TokenResponse> {
    const res = await api.post<TokenResponse>('/auth/login', credentials)
    return res.data
  },

  async register(data: RegisterData): Promise<TokenResponse> {
    const res = await api.post<TokenResponse>('/auth/register', data)
    return res.data
  },

  async getMe(): Promise<User> {
    const res = await api.post<User>('/auth/me')
    return res.data
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout')
  },

  async listUsers(): Promise<User[]> {
    const res = await api.post<User[]>('/auth/users')
    return res.data
  },
}

import api from './api'

export interface User {
  id: number
  email: string
  full_name: string
  role: 'investor' | 'contractor' | 'admin'
  is_active: boolean
  created_at: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/api/auth/login', { email, password })
  localStorage.setItem('pca_token', data.access_token)
  localStorage.setItem('pca_user', JSON.stringify(data.user))
  return data
}

export async function register(
  email: string,
  password: string,
  full_name: string,
  role: string
): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/api/auth/register', { email, password, full_name, role })
  localStorage.setItem('pca_token', data.access_token)
  localStorage.setItem('pca_user', JSON.stringify(data.user))
  return data
}

export function logout() {
  localStorage.removeItem('pca_token')
  localStorage.removeItem('pca_user')
  window.location.href = '/auth/login'
}

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem('pca_user')
  return raw ? JSON.parse(raw) : null
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false
  return !!localStorage.getItem('pca_token')
}

import type { UserRole } from '../types/auth'

export const NAV_ITEMS: NavItem[] = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: 'LayoutDashboard',
    roles: ['admin', 'supervisor', 'operador'],
  },
  {
    path: '/inventory',
    label: 'Inventario',
    icon: 'Package',
    roles: ['admin', 'supervisor', 'operador'],
  },
  {
    path: '/tracking',
    label: 'Tracking',
    icon: 'MapPin',
    roles: ['admin', 'supervisor'],
  },
  {
    path: '/products/list',
    label: 'Productos',
    icon: 'PackagePlus',
    roles: ['admin', 'supervisor', 'operador'],
  },
  {
    path: '/chatbot',
    label: 'Asistente IA',
    icon: 'MessageSquare',
    roles: ['admin', 'supervisor', 'operador'],
  },
  {
    path: '/audit',
    label: 'Auditoría',
    icon: 'ClipboardList',
    roles: ['admin', 'supervisor'],
  },
  {
    path: '/users',
    label: 'Usuarios',
    icon: 'Users',
    roles: ['admin'],
  },
  {
    path: '/settings',
    label: 'Configuración',
    icon: 'Settings',
    roles: ['admin', 'supervisor', 'operador'],
  },
]

export interface NavItem {
  path: string
  label: string
  icon: string
  roles: UserRole[]
}

export const DEMO_CREDENTIALS = [
  { email: 'admin@nike.com', password: 'admin123', label: 'Administrador' },
  { email: 'supervisor@nike.com', password: 'supervisor123', label: 'Supervisor' },
  { email: 'operador@nike.com', password: 'operador123', label: 'Operador' },
]

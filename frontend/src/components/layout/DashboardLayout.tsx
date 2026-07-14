import React, { useState } from 'react'
import { useLocation } from '@tanstack/react-router'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useWebSocket } from '../../hooks/useWebSocket'
import { useIsMobile } from '../../hooks/useIsMobile'
import { inventoryService } from '../../services/inventory.service'

interface DashboardLayoutProps {
  children: React.ReactNode
}

const pageTitleMap: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/inventory': 'Inventario',
  '/tracking': 'Tracking',
  '/chatbot': 'Asistente IA',
  '/audit': 'Auditoría',
  '/users': 'Usuarios',
  '/settings': 'Configuración',
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const isMobile = useIsMobile()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  const wsUrl = import.meta.env.VITE_API_BASE_URL
    ? `${import.meta.env.VITE_API_BASE_URL.replace('http', 'ws')}/ws/stock`
    : `ws://${window.location.host}/api/v1/ws/stock`

  const { isConnected, fallbackToPolling } = useWebSocket({
    url: wsUrl,
    onMessage: () => {},
    onFallbackTriggered: () => {
      const interval = setInterval(() => {
        const token = localStorage.getItem('access_token')
        if (!token) {
          clearInterval(interval)
          return
        }
        inventoryService.getStock().catch(() => {})
      }, 10000)
      return () => clearInterval(interval)
    },
  })

  const title = pageTitleMap[location.pathname] || 'Dashboard'

  return (
    <div className="min-h-screen bg-background text-white flex">
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        isMobile={isMobile}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={title}
          onMenuClick={() => setMobileOpen(true)}
          wsConnected={isConnected}
          wsFallback={fallbackToPolling}
          isMobile={isMobile}
        />

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}

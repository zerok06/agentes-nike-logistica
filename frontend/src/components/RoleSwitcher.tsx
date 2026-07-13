import React, { useState } from 'react'
import { useAuthStore, UserRole } from '../store/useAuthStore'
import { Shield, User, Users, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export const RoleSwitcher: React.FC = () => {
  const { role, setRole } = useAuthStore()
  const [isOpen, setIsOpen] = useState(false)

  const roles: { value: UserRole; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      value: 'admin',
      label: 'Administrador',
      icon: <Shield className="w-4 h-4 text-red-500" />,
      desc: 'Control total de inventario y auditoría'
    },
    {
      value: 'supervisor',
      label: 'Supervisor',
      icon: <Users className="w-4 h-4 text-blue-400" />,
      desc: 'Visualización completa y traslados locales'
    },
    {
      value: 'operador',
      label: 'Operador',
      icon: <User className="w-4 h-4 text-green-400" />,
      desc: 'Consulta de stock y escáner de códigos QR'
    }
  ]

  const currentRoleInfo = roles.find(r => r.value === role)

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-16 right-0 w-72 rounded-2xl glass-panel p-3 mb-2 shadow-2xl flex flex-col gap-1.5"
          >
            <div className="px-2 py-1 border-b border-white/5 mb-1.5">
              <span className="text-xs text-white/40 uppercase tracking-wider font-semibold">Cambiar Perfil de Demo</span>
            </div>
            {roles.map((r) => (
              <button
                key={r.value}
                onClick={() => {
                  setRole(r.value)
                  setIsOpen(false)
                }}
                className={`w-full flex items-start gap-3 p-2.5 rounded-xl transition-all duration-200 text-left hover:bg-white/5 ${
                  role === r.value ? 'bg-nikeOrange/10 border border-nikeOrange/30' : 'border border-transparent'
                }`}
              >
                <div className="mt-0.5 p-1 bg-white/5 rounded-lg">
                  {r.icon}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white/90">{r.label}</div>
                  <div className="text-xs text-white/50">{r.desc}</div>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-3 rounded-full glass-panel border border-nikeOrange/40 hover:border-nikeOrange/80 transition-all duration-300 shadow-lg hover:shadow-nikeOrange/20 hover:shadow-xl active:scale-95"
      >
        <RefreshCw className={`w-4 h-4 text-nikeOrange ${isOpen ? 'rotate-180' : ''} transition-transform duration-500`} />
        <span className="text-xs font-bold text-white/90 uppercase tracking-widest">
          {currentRoleInfo?.label}
        </span>
      </button>
    </div>
  )
}

import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { ClipboardList, ShieldAlert, CheckCircle2, Calendar } from 'lucide-react'
import { useAuthStore } from '../../store/useAuthStore'

interface AuditLog {
  audit_id: number
  action: string
  user_email: string
  details: {
    product_id?: string
    from_warehouse_id?: string
    to_warehouse_id?: string
    quantity?: number
    user_email?: string
  }
  created_at: string
}

export const AuditTrail: React.FC = () => {
  const { role } = useAuthStore()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchLogs = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.get('/api/v1/stock/audit-logs')
      setLogs(res.data)
    } catch (err: any) {
      console.error(err)
      if (err.response && err.response.status === 403) {
        setError('Acceso denegado: No tienes permisos suficientes para ver esta sección.')
      } else {
        setError('Error al obtener el historial de auditoría.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (role === 'admin' || role === 'supervisor') {
      fetchLogs()
    }
  }, [role])

  if (role === 'operador') {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-3xl p-6 flex flex-col items-center justify-center text-center gap-3">
        <ShieldAlert className="w-12 h-12 text-red-500" />
        <h3 className="text-lg font-bold text-red-400">Acceso Restringido</h3>
        <p className="text-sm text-white/50 max-w-md">
          El panel de auditoría inmutable de movimientos de stock sólo está disponible para Administradores y Supervisores.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-3xl glass-panel p-6 shadow-xl relative overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <ClipboardList className="w-5 h-5 text-nikeOrange" />
          <h2 className="text-lg font-bold tracking-tight text-white/90">Registro de Auditoría Inmutable</h2>
        </div>
        <button 
          onClick={fetchLogs}
          className="text-xs text-nikeOrange hover:text-white transition-colors uppercase font-bold tracking-wider"
        >
          Refrescar logs
        </button>
      </div>

      {error ? (
        <div className="text-center py-6 text-red-400 text-sm">{error}</div>
      ) : loading ? (
        <div className="text-center py-10 text-white/40 text-sm">Cargando logs de auditoría...</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-10 text-white/30 text-sm">No se han registrado movimientos de inventario todavía.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/5 text-white/40 text-xs uppercase tracking-wider">
                <th className="py-3 px-2">ID Log</th>
                <th className="py-3 px-2">Acción</th>
                <th className="py-3 px-2">Email</th>
                <th className="py-3 px-2">Detalles</th>
                <th className="py-3 px-2 text-right">Fecha/Hora</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.audit_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-3 px-2 font-mono text-xs text-white/40">#{log.audit_id}</td>
                  <td className="py-3 px-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20">
                      <CheckCircle2 className="w-3 h-3" />
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-white/80 font-medium">{log.user_email}</td>
                  <td className="py-3 px-2 text-xs text-white/50 max-w-xs truncate">
                    {`Traslado de ${log.details.quantity || 0} pares. Cód. Producto: ${log.details.product_id?.substring(0,8)}...`}
                  </td>
                  <td className="py-3 px-2 text-right text-xs text-white/40 font-mono">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

import React, { useEffect, useState } from 'react'
import {
  ClipboardList,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  Search,
} from 'lucide-react'
import { Card } from '../../components/ui/card'
import { Loader } from '../../components/ui/Loader'
import { Badge } from '../../components/ui/badge'
import { Input } from '../../components/ui/input'
import { useAuthStore } from '../../store/useAuthStore'
import { inventoryService } from '../../services/inventory.service'
import type { AuditLog } from '../../types/inventory'

export const AuditPage: React.FC = () => {
  const { hasRole } = useAuthStore()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const fetchLogs = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await inventoryService.getAuditLogs()
      setLogs(data)
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('Acceso denegado: No tienes permisos suficientes.')
      } else {
        setError('Error al obtener el historial de auditoría.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (hasRole('admin', 'supervisor')) {
      fetchLogs()
    }
  }, [])

  if (!hasRole('admin', 'supervisor')) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-3xl p-6 flex flex-col items-center justify-center text-center gap-3">
        <ShieldAlert className="w-12 h-12 text-red-500" />
        <h3 className="text-lg font-bold text-red-400">Acceso Restringido</h3>
        <p className="text-sm text-white/50 max-w-md">
          El panel de auditoría inmutable solo está disponible para Administradores y
          Supervisores.
        </p>
      </div>
    )
  }

  const filteredLogs = logs.filter(
    (log) =>
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      (log.user_email || '').toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <Card
      title="Registro de Auditoría Inmutable"
      icon={<ClipboardList className="w-5 h-5 text-nikeOrange" />}
      action={
        <button
          onClick={fetchLogs}
          className="text-xs text-nikeOrange hover:text-white transition-colors uppercase font-bold tracking-wider flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3" /> Refrescar
        </button>
      }
    >
      <div className="mb-4">
        <Input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por acción o email..."
          icon={<Search className="w-4 h-4" />}
        />
      </div>

      {error ? (
        <div className="text-center py-6 text-red-400 text-sm">{error}</div>
      ) : loading ? (
        <Loader label="Cargando logs de auditoría..." />
      ) : filteredLogs.length === 0 ? (
        <div className="text-center py-10 text-white/30 text-sm">
          No se han registrado movimientos de inventario.
        </div>
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
              {filteredLogs.map((log) => (
                <tr
                  key={log.audit_id}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="py-3 px-2 font-mono text-xs text-white/40">
                    #{log.audit_id}
                  </td>
                  <td className="py-3 px-2">
                    <Badge variant="success">
                      <CheckCircle2 className="w-3 h-3" />
                      {log.action}
                    </Badge>
                  </td>
                  <td className="py-3 px-2 text-white/80 font-medium">
                    {log.user_email}
                  </td>
                  <td className="py-3 px-2 text-xs text-white/50 max-w-xs truncate">
                    {`Traslado de ${log.details.quantity || 0} pares. Cód. Producto: ${log.details.product_id?.substring(0, 8)}...`}
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
    </Card>
  )
}

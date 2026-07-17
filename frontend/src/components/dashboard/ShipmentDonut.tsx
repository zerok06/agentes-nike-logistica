import React, { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { Truck, Activity } from 'lucide-react'
import { Card } from '../ui/Card'
import { ChartSkeleton } from '../metrics/MetricCardSkeleton'
import { metricsService } from '../../services/metrics.service'
import type { ShipmentStats } from '../../types/metrics'
import { useDashboardFilters } from '../../context/DashboardFilterContext'



export const ShipmentDonut: React.FC = () => {
  const [data, setData] = useState<ShipmentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeIndex, setActiveIndex] = useState<number>(0)

  const { filters } = useDashboardFilters()
  useEffect(() => {
    setLoading(true)
    metricsService.getShipmentStats(filters.warehouseId)
      .then((res) => {
        setData(res)
        if (res && Object.keys(res.by_status).length > 0) {
          setActiveIndex(0)
        }
      })
      .catch(() => { })
      .finally(() => setLoading(false))
  }, [filters.warehouseId])

  if (loading) {
    return <ChartSkeleton />
  }

  const chartData = data
    ? Object.entries(data.by_status).map(([name, value]) => {
      let color = '#94a3b8' // Default slate
      const nameLower = name.toLowerCase()
      if (nameLower.includes('entregado') || nameLower.includes('delivered')) {
        color = '#ffffff' // Stark White for Delivered
      } else if (nameLower.includes('tránsito') || nameLower.includes('transit') || nameLower.includes('ruta')) {
        color = '#94a3b8' // Slate for In Transit
      } else if (nameLower.includes('retrasado') || nameLower.includes('delay') || nameLower.includes('incidencia') || nameLower.includes('crítico')) {
        color = '#ef4444' // RED for Delayed/Urgent Alerts!
      } else {
        color = '#475569' // Charcoal/Gray for Pending/Preparing
      }
      return { name, value, color }
    })
    : []

  const totalShipments = chartData.reduce((acc, curr) => acc + curr.value, 0)
  const activeItem = chartData[activeIndex] || chartData[0]
  const percentage = totalShipments > 0 ? ((activeItem?.value || 0) / totalShipments * 100).toFixed(1) : 0

  return (
    <Card
      title="Estado de Envíos - Logística"
      icon={<Truck className="w-5 h-5 text-white filter drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" />}
    >
      <div className="text-xs text-white/40 -mt-4 mb-6 italic">
        Distribución y ciclo operativo de despachos en tiempo real
      </div>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-4 items-center">

        {/* Columna Izquierda: Gráfico de Dona con centro interactivo (Ocupa 7 cols) */}
        <div className="md:col-span-7 h-[220px] relative flex items-center justify-center bg-white/[0.02] rounded-2xl border border-white/5 p-2">

          {/* Indicador superior flotante */}
          <div className="absolute top-2 left-3 text-[10px] font-mono text-white/70 uppercase tracking-widest flex items-center gap-1">
            <Activity className="w-3 h-3 text-white/40" /> Monitoreo Activo
          </div>

          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%" cy="50%"
                innerRadius={55}
                outerRadius={75}
                paddingAngle={6}
                dataKey="value"
                onMouseEnter={(_, index) => setActiveIndex(index)}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth={index === activeIndex ? 2 : 1}
                    style={{
                      filter: index === activeIndex ? `drop-shadow(0px 0px 8px ${entry.color}80)` : 'none',
                      transition: 'all 0.3s ease'
                    }}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#09090b',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#fff',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.8)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Información central dinámica al hacer hover sobre la dona */}
          {activeItem && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-[10px] font-mono text-slate-400 uppercase max-w-[80px] truncate">{activeItem.name}</span>
              <span className="text-lg font-extrabold text-white mt-0.5">{activeItem.value}</span>
              <span className="text-[10px] font-bold text-white/80">{percentage}%</span>
            </div>
          )}
        </div>

        {/* Columna Derecha: Tarjetas de desglose rápido por estado (Ocupa 5 cols) */}
        <div className="md:col-span-5 flex flex-col gap-2 justify-center">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">
            Resumen de Estados ({totalShipments} Total)
          </div>

          <div className="space-y-2 max-h-[210px] overflow-y-auto pr-1">
            {chartData.map((item, index) => {
              const itemPct = totalShipments > 0 ? ((item.value / totalShipments) * 100).toFixed(0) : 0
              const isSelected = index === activeIndex

              return (
                <div
                  key={index}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${isSelected
                      ? 'bg-white/10 border-white/20'
                      : 'bg-black/20 border-white/5 hover:border-white/10'
                    }`}
                  style={isSelected ? { boxShadow: `0 0 12px ${item.color}33` } : undefined}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                    <span className="text-xs font-semibold text-slate-200">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">{itemPct}%</span>
                    <span className="text-xs font-bold text-white bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                      {item.value}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </Card>
  )
}
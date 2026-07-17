import React, { useEffect, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Activity } from 'lucide-react'
import { Card } from '../ui/Card'
import { ChartSkeleton } from '../metrics/MetricCardSkeleton'
import { metricsService } from '../../services/metrics.service'
import { useDashboardFilters } from '../../context/DashboardFilterContext'
import type { MovementTrend } from '../../types/metrics'

export const TrendChart: React.FC = () => {
  const { filters } = useDashboardFilters()
  const [data, setData] = useState<MovementTrend[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    metricsService.getTrends(filters.timeRange, filters.warehouseId)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [filters.timeRange, filters.warehouseId])

  if (loading) {
    return <ChartSkeleton className="lg:col-span-2" />
  }

  return (
    <Card
      title={`Movimientos de Stock (${filters.timeRange}d)`}
      icon={<Activity className="w-5 h-5 text-white" />}
      className="lg:col-span-2"
    >
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ffffff" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#ffffff" stopOpacity={0.01} />
            </linearGradient>
            <linearGradient id="colorSalidas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
          <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} />
          <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} />
          <Tooltip contentStyle={{ background: '#09090b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px', color: 'rgba(255,255,255,0.9)' }} />
          <Legend wrapperStyle={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }} />
          <Area type="monotone" dataKey="entradas" stroke="#ffffff" strokeWidth={2.5} fill="url(#colorEntradas)" name="Entradas" />
          <Area type="monotone" dataKey="salidas" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" fill="url(#colorSalidas)" name="Salidas" />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  )
}

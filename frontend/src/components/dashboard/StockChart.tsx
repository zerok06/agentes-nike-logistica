import React, { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Package } from 'lucide-react'
import { Card } from '../ui/card'
import { ChartSkeleton } from '../metrics/MetricCardSkeleton'
import { metricsService } from '../../services/metrics.service'
import { useDashboardFilters } from '../../context/DashboardFilterContext'
import type { StockByWarehouse } from '../../types/metrics'

export const StockChart: React.FC = () => {
  const { filters } = useDashboardFilters()
  const [data, setData] = useState<StockByWarehouse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    metricsService.getStockByWarehouse(filters.warehouseId)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [filters.warehouseId])

  if (loading) {
    return <ChartSkeleton />
  }

  return (
    <Card
      title="Stock por Almacén"
      icon={<Package className="w-5 h-5 text-nikeOrange" />}
    >
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} angle={-15} textAnchor="end" height={60} />
          <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} />
          <Tooltip contentStyle={{ background: '#1C1C1E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px', color: 'rgba(255,255,255,0.9)' }} />
          <Legend wrapperStyle={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }} />
          <Bar dataKey="normal" stackId="a" fill="#00C49F" name="Normal" radius={[0, 0, 0, 0]} />
          <Bar dataKey="critical" stackId="a" fill="#FF6B6B" name="Crítico" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}

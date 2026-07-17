import React, { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Truck } from 'lucide-react'
import { Card } from '../ui/card'
import { ChartSkeleton } from '../metrics/MetricCardSkeleton'
import { metricsService } from '../../services/metrics.service'
import type { ShipmentStats } from '../../types/metrics'

const CHART_COLORS = {
  nikeOrange: '#FA5400',
  green: '#00C49F',
  yellow: '#FFBB28',
  red: '#FF6B6B',
  purple: '#8884D8',
  blue: '#3B82F6',
}

const COLOR_PALETTE = [
  CHART_COLORS.nikeOrange,
  CHART_COLORS.green,
  CHART_COLORS.yellow,
  CHART_COLORS.red,
  CHART_COLORS.purple,
  CHART_COLORS.blue,
]

export const ShipmentDonut: React.FC = () => {
  const [data, setData] = useState<ShipmentStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    metricsService.getShipmentStats()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <ChartSkeleton />
  }

  const chartData = data
    ? Object.entries(data.by_status).map(([name, value], i) => ({
        name,
        value,
        color: COLOR_PALETTE[i % COLOR_PALETTE.length],
      }))
    : []

  return (
    <Card
      title="Estado de Envíos"
      icon={<Truck className="w-5 h-5 text-nikeOrange" />}
    >
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%" cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ background: '#1C1C1E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px', color: 'rgba(255,255,255,0.9)' }} />
          <Legend wrapperStyle={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }} />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  )
}

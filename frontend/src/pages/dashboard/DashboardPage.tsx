import React, { useEffect, useState } from 'react'
import {
  Package,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  ArrowRight,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { Card } from '../../components/ui/Card'
import { Loader } from '../../components/ui/Loader'
import { Badge } from '../../components/ui/Badge'
import { inventoryService } from '../../services/inventory.service'
import type { StockItem } from '../../types/inventory'

const COLORS = ['#FA5400', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export const DashboardPage: React.FC = () => {
  const [stock, setStock] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await inventoryService.getStock()
        setStock(data)
      } catch {
        // Error silencioso en dashboard
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <Loader label="Cargando dashboard..." />

  const totalProducts = new Set(stock.map((s) => s.sku)).size
  const criticalStock = stock.filter((s) => s.stock_qty < s.min_stock).length
  const totalUnits = stock.reduce((sum, s) => sum + s.stock_qty, 0)
  const totalValue = stock.reduce((sum, s) => sum + s.stock_qty * 100, 0)

  const warehouseData = stock.reduce((acc, item) => {
    const existing = acc.find((w) => w.name === item.warehouse_name)
    if (existing) {
      existing.qty += item.stock_qty
    } else {
      acc.push({ name: item.warehouse_name, qty: item.stock_qty })
    }
    return acc
  }, [] as { name: string; qty: number }[])

  const trendData = [
    { name: 'Lun', movimientos: 12 },
    { name: 'Mar', movimientos: 19 },
    { name: 'Mié', movimientos: 15 },
    { name: 'Jue', movimientos: 25 },
    { name: 'Vie', movimientos: 22 },
    { name: 'Sáb', movimientos: 18 },
    { name: 'Dom', movimientos: 8 },
  ]

  const roleDistribution = [
    { name: 'Normal', value: stock.length - criticalStock },
    { name: 'Crítico', value: criticalStock },
  ]

  const kpis = [
    {
      label: 'Total Productos',
      value: totalProducts.toString(),
      icon: <Package className="w-5 h-5 text-nikeOrange" />,
      color: 'text-nikeOrange',
    },
    {
      label: 'Stock Crítico',
      value: criticalStock.toString(),
      icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
      color: 'text-red-500',
    },
    {
      label: 'Total Unidades',
      value: totalUnits.toLocaleString(),
      icon: <TrendingUp className="w-5 h-5 text-green-500" />,
      color: 'text-green-500',
    },
    {
      label: 'Valor Estimado',
      value: `$${(totalValue / 1000).toFixed(1)}K`,
      icon: <DollarSign className="w-5 h-5 text-blue-400" />,
      color: 'text-blue-400',
    },
  ]

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">
                  {kpi.label}
                </p>
                <p className={`text-3xl font-bold mt-2 ${kpi.color}`}>{kpi.value}</p>
              </div>
              <div className="p-3 rounded-2xl bg-white/5">{kpi.icon}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title="Stock por Almacén"
          icon={<Package className="w-5 h-5 text-nikeOrange" />}
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={warehouseData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="name"
                stroke="rgba(255,255,255,0.4)"
                fontSize={12}
                tickLine={false}
              />
              <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: '#1C1C1E',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                }}
              />
              <Bar dataKey="qty" fill="#FA5400" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card
          title="Tendencia de Movimientos"
          icon={<TrendingUp className="w-5 h-5 text-nikeOrange" />}
        >
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="name"
                stroke="rgba(255,255,255,0.4)"
                fontSize={12}
                tickLine={false}
              />
              <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: '#1C1C1E',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                }}
              />
              <Line
                type="monotone"
                dataKey="movimientos"
                stroke="#FA5400"
                strokeWidth={3}
                dot={{ fill: '#FA5400', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card
          title="Estado de Stock"
          icon={<AlertTriangle className="w-5 h-5 text-nikeOrange" />}
        >
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={roleDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
              >
                {roleDistribution.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#1C1C1E',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card
          title="Alertas de Stock Crítico"
          icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
        >
          <div className="space-y-3 max-h-[200px] overflow-y-auto">
            {stock
              .filter((s) => s.stock_qty < s.min_stock)
              .slice(0, 5)
              .map((item) => (
                <div
                  key={item.inventory_id}
                  className="flex items-center justify-between p-2 rounded-lg bg-red-500/5"
                >
                  <div>
                    <p className="text-sm font-semibold text-white/90">
                      {item.product_name}
                    </p>
                    <p className="text-xs text-white/40">{item.warehouse_name}</p>
                  </div>
                  <Badge variant="danger">{item.stock_qty} u.</Badge>
                </div>
              ))}
            {criticalStock === 0 && (
              <p className="text-sm text-white/30 text-center py-8">
                No hay alertas de stock crítico.
              </p>
            )}
          </div>
        </Card>

        <Card
          title="Acciones Rápidas"
          icon={<ArrowRight className="w-5 h-5 text-nikeOrange" />}
        >
          <div className="space-y-3">
            <a
              href="/inventory"
              className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <span className="text-sm font-semibold text-white/90">
                Ver Inventario
              </span>
              <ArrowRight className="w-4 h-4 text-nikeOrange" />
            </a>
            <a
              href="/chatbot"
              className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <span className="text-sm font-semibold text-white/90">
                Consultar Asistente IA
              </span>
              <ArrowRight className="w-4 h-4 text-nikeOrange" />
            </a>
            <a
              href="/audit"
              className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <span className="text-sm font-semibold text-white/90">
                Ver Auditoría
              </span>
              <ArrowRight className="w-4 h-4 text-nikeOrange" />
            </a>
          </div>
        </Card>
      </div>
    </div>
  )
}

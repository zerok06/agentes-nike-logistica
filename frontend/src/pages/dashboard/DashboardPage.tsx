import React, { useEffect, useState } from 'react'
import {
  Package,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  ArrowRight,
  Activity,
  Warehouse as WarehouseIcon,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { Card } from '../../components/ui/card'
import { Loader } from '../../components/ui/Loader'
import { Badge } from '../../components/ui/badge'
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

  const movimientosArea = [
    { name: 'Lun', entradas: 120, salidas: 80, traslados: 12 },
    { name: 'Mar', entradas: 200, salidas: 150, traslados: 19 },
    { name: 'Mié', entradas: 150, salidas: 120, traslados: 15 },
    { name: 'Jue', entradas: 280, salidas: 200, traslados: 25 },
    { name: 'Vie', entradas: 240, salidas: 180, traslados: 22 },
    { name: 'Sáb', entradas: 180, salidas: 100, traslados: 18 },
    { name: 'Dom', entradas: 80, salidas: 40, traslados: 8 },
  ]

  const stockTrendArea = [
    { name: 'Sem 1', lima: 3200, arequipa: 1800, trujillo: 1200, cusco: 800 },
    { name: 'Sem 2', lima: 3400, arequipa: 1900, trujillo: 1100, cusco: 850 },
    { name: 'Sem 3', lima: 3100, arequipa: 2000, trujillo: 1300, cusco: 900 },
    { name: 'Sem 4', lima: 3600, arequipa: 2100, trujillo: 1250, cusco: 820 },
    { name: 'Sem 5', lima: 3800, arequipa: 1950, trujillo: 1400, cusco: 880 },
    { name: 'Sem 6', lima: 3500, arequipa: 2200, trujillo: 1500, cusco: 950 },
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

      {/* Area Chart - Movimientos */}
      <Card
        title="Movimientos de Inventario (Semanal)"
        icon={<Activity className="w-5 h-5 text-nikeOrange" />}
      >
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={movimientosArea}>
            <defs>
              <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FA5400" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#FA5400" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorSalidas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00C49F" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#00C49F" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorTraslados" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FFBB28" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#FFBB28" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} />
            <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: '#1C1C1E',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }} />
            <Area
              type="monotone"
              dataKey="entradas"
              stroke="#FA5400"
              strokeWidth={2}
              fill="url(#colorEntradas)"
              name="Entradas"
            />
            <Area
              type="monotone"
              dataKey="salidas"
              stroke="#00C49F"
              strokeWidth={2}
              fill="url(#colorSalidas)"
              name="Salidas"
            />
            <Area
              type="monotone"
              dataKey="traslados"
              stroke="#FFBB28"
              strokeWidth={2}
              fill="url(#colorTraslados)"
              name="Traslados"
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Stock trend by city - Area Chart */}
      <Card
        title="Tendencia de Stock por Sede"
        icon={<WarehouseIcon className="w-5 h-5 text-nikeOrange" />}
      >
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={stockTrendArea}>
            <defs>
              <linearGradient id="colorLima" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FA5400" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#FA5400" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="colorArequipa" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00C49F" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#00C49F" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="colorTrujillo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FFBB28" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#FFBB28" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="colorCusco" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8884D8" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#8884D8" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} />
            <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: '#1C1C1E',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }} />
            <Area type="monotone" dataKey="lima" stroke="#FA5400" strokeWidth={2} fill="url(#colorLima)" name="Lima" />
            <Area type="monotone" dataKey="arequipa" stroke="#00C49F" strokeWidth={2} fill="url(#colorArequipa)" name="Arequipa" />
            <Area type="monotone" dataKey="trujillo" stroke="#FFBB28" strokeWidth={2} fill="url(#colorTrujillo)" name="Trujillo" />
            <Area type="monotone" dataKey="cusco" stroke="#8884D8" strokeWidth={2} fill="url(#colorCusco)" name="Cusco" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card
          title="Stock por Almacén"
          icon={<Package className="w-5 h-5 text-nikeOrange" />}
        >
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={warehouseData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="name"
                stroke="rgba(255,255,255,0.4)"
                fontSize={10}
                tickLine={false}
                angle={-15}
                textAnchor="end"
                height={60}
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
              <Legend wrapperStyle={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }} />
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
      </div>

      {/* Quick actions */}
      <Card
        title="Acciones Rápidas"
        icon={<ArrowRight className="w-5 h-5 text-nikeOrange" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <a
            href="/inventory"
            className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            <span className="text-sm font-semibold text-white/90">Ver Inventario</span>
            <ArrowRight className="w-4 h-4 text-nikeOrange" />
          </a>
          <a
            href="/chatbot"
            className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            <span className="text-sm font-semibold text-white/90">Consultar Asistente IA</span>
            <ArrowRight className="w-4 h-4 text-nikeOrange" />
          </a>
          <a
            href="/tracking"
            className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            <span className="text-sm font-semibold text-white/90">Ver Tracking GPS</span>
            <ArrowRight className="w-4 h-4 text-nikeOrange" />
          </a>
        </div>
      </Card>
    </div>
  )
}

import React, { useEffect, useState } from 'react'
import {
  Package,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Activity,
  Warehouse as WarehouseIcon,
  Truck,
  Clock,
  Gauge,
  Boxes,
  ArrowRight,
  RefreshCw,
  Download,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts'
import { Loader } from '../../components/ui/Loader'
import { Badge } from '../../components/ui/badge'
import { MetricCard } from '../../components/metrics/MetricCard'
import { ExportButton } from '../../components/metrics/ExportButton'
import {
  ChartContainer,
  chartTooltipStyle,
  chartAxisStyle,
  chartGridStyle,
  CHART_COLORS,
  COLOR_PALETTE,
} from '../../components/metrics/ChartContainer'
import { metricsService } from '../../services/metrics.service'
import type {
  MetricsSummary,
  WarehousePerformance,
  MovementTrend,
  TopProduct,
  CategoryDistribution,
  Alert,
  ShipmentStats,
  StockByWarehouse,
} from '../../types/metrics'

export const DashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<MetricsSummary | null>(null)
  const [warehousePerf, setWarehousePerf] = useState<WarehousePerformance[]>([])
  const [trends, setTrends] = useState<MovementTrend[]>([])
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [categories, setCategories] = useState<CategoryDistribution[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [shipStats, setShipStats] = useState<ShipmentStats | null>(null)
  const [stockByWh, setStockByWh] = useState<StockByWarehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchAll = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const [s, wp, tr, tp, cat, al, sh, sbw] = await Promise.all([
        metricsService.getSummary(),
        metricsService.getWarehousePerformance(),
        metricsService.getTrends(7),
        metricsService.getTopProducts(10),
        metricsService.getCategoryDistribution(),
        metricsService.getAlerts(),
        metricsService.getShipmentStats(),
        metricsService.getStockByWarehouse(),
      ])
      setSummary(s)
      setWarehousePerf(wp)
      setTrends(tr)
      setTopProducts(tp)
      setCategories(cat)
      setAlerts(al)
      setShipStats(sh)
      setStockByWh(sbw)
    } catch {
      // silent
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchAll()
    const interval = setInterval(() => fetchAll(true), 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) return <Loader label="Cargando dashboard de métricas..." />

  const stockStatusData = summary ? [
    { name: 'Normal', value: summary.normal_units, color: CHART_COLORS.green },
    { name: 'Crítico', value: summary.critical_units, color: CHART_COLORS.red },
  ] : []

  const shipmentStatusData = shipStats
    ? Object.entries(shipStats.by_status).map(([name, value], i) => ({
        name,
        value,
        color: COLOR_PALETTE[i % COLOR_PALETTE.length],
      }))
    : []

  const radarData = warehousePerf.map((w) => ({
    warehouse: w.city || w.warehouse_name,
    Stock: w.total_stock,
    Productos: w.product_count * 10,
    Utilización: w.utilization * 10,
  }))

  const carrierData = shipStats
    ? Object.entries(shipStats.by_carrier).map(([name, count]) => ({ name, count }))
    : []

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* KPIs Row 1 - Inventario */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <MetricCard
          label="Total Unidades"
          value={summary?.total_stock.toLocaleString() || '0'}
          icon={<Package className="w-5 h-5 lg:w-6 lg:h-6 text-nikeOrange" />}
          color="text-white/90"
          iconBg="bg-nikeOrange/10"
          subtitle={`${summary?.total_products || 0} productos`}
        />
        <MetricCard
          label="Valor Inventario"
          value={`$${((summary?.total_value || 0) / 1000).toFixed(1)}K`}
          icon={<DollarSign className="w-5 h-5 lg:w-6 lg:h-6 text-blue-400" />}
          color="text-blue-400"
          iconBg="bg-blue-500/10"
          subtitle="Valor total stock"
        />
        <MetricCard
          label="Stock Crítico"
          value={summary?.critical_count || 0}
          icon={<AlertTriangle className="w-5 h-5 lg:w-6 lg:h-6 text-red-400" />}
          color="text-red-400"
          iconBg="bg-red-500/10"
          subtitle={`${summary?.critical_units || 0} unidades`}
        />
        <MetricCard
          label="Rotación"
          value={summary?.inventory_turnover.toFixed(2) || '0'}
          icon={<TrendingUp className="w-5 h-5 lg:w-6 lg:h-6 text-green-400" />}
          color="text-green-400"
          iconBg="bg-green-500/10"
          subtitle={`${summary?.days_of_inventory || 0} días inventario`}
        />
      </div>

      {/* KPIs Row 2 - Logística */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <MetricCard
          label="Tasa Cumplimiento"
          value={`${summary?.fulfillment_rate || 0}%`}
          icon={<Gauge className="w-5 h-5 lg:w-6 lg:h-6 text-green-400" />}
          color="text-green-400"
          iconBg="bg-green-500/10"
          subtitle="Pedidos completados"
        />
        <MetricCard
          label="Tiempo de Ciclo"
          value={`${summary?.cycle_time_hours || 0}h`}
          icon={<Clock className="w-5 h-5 lg:w-6 lg:h-6 text-yellow-400" />}
          color="text-yellow-400"
          iconBg="bg-yellow-500/10"
          subtitle="Orden → entrega"
        />
        <MetricCard
          label="Utilización Cap."
          value={`${summary?.capacity_utilization || 0}%`}
          icon={<Boxes className="w-5 h-5 lg:w-6 lg:h-6 text-purple-400" />}
          color="text-purple-400"
          iconBg="bg-purple-500/10"
          subtitle="Espacio usado"
        />
        <MetricCard
          label="Envíos Activos"
          value={summary?.in_transit || 0}
          icon={<Truck className="w-5 h-5 lg:w-6 lg:h-6 text-nikeOrange" />}
          color="text-nikeOrange"
          iconBg="bg-nikeOrange/10"
          subtitle={`${summary?.prep_shipments || 0} en prep · ${summary?.delivered_shipments || 0} entregados`}
        />
      </div>

      {/* Charts Row 1 - Trends + Stock Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Movement Trends - Area Chart */}
        <ChartContainer
          title="Movimientos de Inventario (7 días)"
          icon={<Activity className="w-5 h-5 text-nikeOrange" />}
          className="lg:col-span-2"
          action={
            <button
              onClick={() => fetchAll(true)}
              className="text-xs text-nikeOrange hover:text-white transition-colors flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
            </button>
          }
        >
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trends}>
              <defs>
                <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.nikeOrange} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={CHART_COLORS.nikeOrange} stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorSalidas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.green} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={CHART_COLORS.green} stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid {...chartGridStyle} />
              <XAxis dataKey="date" {...chartAxisStyle} fontSize={10} />
              <YAxis {...chartAxisStyle} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }} />
              <Area type="monotone" dataKey="entradas" stroke={CHART_COLORS.nikeOrange} strokeWidth={2} fill="url(#colorEntradas)" name="Entradas" />
              <Area type="monotone" dataKey="salidas" stroke={CHART_COLORS.green} strokeWidth={2} fill="url(#colorSalidas)" name="Salidas" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Stock Status - Pie Chart */}
        <ChartContainer
          title="Estado de Stock"
          icon={<AlertTriangle className="w-5 h-5 text-nikeOrange" />}
        >
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stockStatusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
              >
                {stockStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={chartTooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Charts Row 2 - Warehouse Radar + Stock by Warehouse Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Warehouse Radar Chart */}
        <ChartContainer
          title="Performance por Almacén (Radar)"
          icon={<WarehouseIcon className="w-5 h-5 text-nikeOrange" />}
        >
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="warehouse" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
              <PolarRadiusAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} />
              <Radar name="Stock" dataKey="Stock" stroke={CHART_COLORS.nikeOrange} fill={CHART_COLORS.nikeOrange} fillOpacity={0.3} strokeWidth={2} />
              <Radar name="Utilización" dataKey="Utilización" stroke={CHART_COLORS.blue} fill={CHART_COLORS.blue} fillOpacity={0.2} strokeWidth={2} />
              <Legend wrapperStyle={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }} />
              <Tooltip contentStyle={chartTooltipStyle} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Stock by Warehouse - Bar Chart */}
        <ChartContainer
          title="Stock por Almacén"
          icon={<Package className="w-5 h-5 text-nikeOrange" />}
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stockByWh}>
              <CartesianGrid {...chartGridStyle} />
              <XAxis dataKey="name" {...chartAxisStyle} fontSize={10} angle={-15} textAnchor="end" height={60} />
              <YAxis {...chartAxisStyle} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }} />
              <Bar dataKey="normal" stackId="a" fill={CHART_COLORS.green} name="Normal" radius={[0, 0, 0, 0]} />
              <Bar dataKey="critical" stackId="a" fill={CHART_COLORS.red} name="Crítico" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Charts Row 3 - Top Products + Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Top Products - Horizontal Bar */}
        <ChartContainer
          title="Top 10 Productos por Stock"
          icon={<Package className="w-5 h-5 text-nikeOrange" />}
        >
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={topProducts} layout="vertical">
              <CartesianGrid {...chartGridStyle} />
              <XAxis type="number" {...chartAxisStyle} />
              <YAxis
                type="category"
                dataKey="product_name"
                {...chartAxisStyle}
                fontSize={10}
                width={120}
                tickFormatter={(v: string) => v.length > 18 ? v.substring(0, 18) + '...' : v}
              />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Bar dataKey="total_stock" fill={CHART_COLORS.nikeOrange} radius={[0, 8, 8, 0]} name="Stock" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Category Distribution - Pie */}
        <ChartContainer
          title="Distribución por Categoría"
          icon={<Boxes className="w-5 h-5 text-nikeOrange" />}
        >
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={categories}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="total_stock"
                nameKey="name"
                label={(entry: any) => entry.name}
                labelLine={false}
                style={{ fontSize: '10px', fill: 'rgba(255,255,255,0.6)' }}
              >
                {categories.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLOR_PALETTE[index % COLOR_PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={chartTooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Charts Row 4 - Shipment Status + Carrier */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Shipment Status - Pie */}
        <ChartContainer
          title="Estado de Envíos"
          icon={<Truck className="w-5 h-5 text-nikeOrange" />}
        >
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={shipmentStatusData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {shipmentStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={chartTooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Carrier Distribution - Bar */}
        <ChartContainer
          title="Envíos por Transportista"
          icon={<Truck className="w-5 h-5 text-nikeOrange" />}
        >
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={carrierData}>
              <CartesianGrid {...chartGridStyle} />
              <XAxis dataKey="name" {...chartAxisStyle} fontSize={11} />
              <YAxis {...chartAxisStyle} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Bar dataKey="count" fill={CHART_COLORS.blue} radius={[8, 8, 0, 0]} name="Envíos" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Alerts + Warehouse Table + Export */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Alerts */}
        <ChartContainer
          title={`Alertas (${alerts.length})`}
          icon={<AlertTriangle className="w-5 h-5 text-red-400" />}
        >
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {alerts.length === 0 ? (
              <p className="text-sm text-white/30 text-center py-8">No hay alertas activas.</p>
            ) : (
              alerts.map((alert, i) => (
                <div
                  key={i}
                  className={`p-2.5 rounded-lg border ${
                    alert.severity === 'high'
                      ? 'bg-red-500/5 border-red-500/20'
                      : 'bg-yellow-500/5 border-yellow-500/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold text-white/90">{alert.title}</p>
                    <Badge variant={alert.severity === 'high' ? 'danger' : 'warning'}>
                      {alert.severity}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-white/40 mt-1">{alert.description}</p>
                </div>
              ))
            )}
          </div>
        </ChartContainer>

        {/* Warehouse Performance Table */}
        <ChartContainer
          title="Performance por Almacén"
          icon={<WarehouseIcon className="w-5 h-5 text-nikeOrange" />}
        >
          <div className="space-y-3">
            {warehousePerf.map((w) => (
              <div key={w.warehouse_id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white/90">{w.warehouse_name}</p>
                    <p className="text-[10px] text-white/40">{w.city} · {w.product_count} productos</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white/90">{w.total_stock}</p>
                    <p className="text-[10px] text-white/40">{w.utilization}% cap.</p>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, w.utilization)}%`,
                      background: w.utilization > 80 ? CHART_COLORS.red : w.utilization > 60 ? CHART_COLORS.yellow : CHART_COLORS.green,
                    }}
                  />
                </div>
                {w.critical_count > 0 && (
                  <Badge variant="danger" className="text-[10px]">{w.critical_count} críticos</Badge>
                )}
              </div>
            ))}
          </div>
        </ChartContainer>

        {/* Export + Quick Actions */}
        <div className="space-y-4">
          <ChartContainer
            title="Exportar Reportes"
            icon={<Download className="w-5 h-5 text-nikeOrange" />}
          >
            <div className="space-y-3">
              <p className="text-xs text-white/40">Descarga métricas en formato CSV</p>
              <ExportButton />
            </div>
          </ChartContainer>

          <ChartContainer
            title="Acciones Rápidas"
            icon={<ArrowRight className="w-5 h-5 text-nikeOrange" />}
          >
            <div className="space-y-2">
              <a href="/inventory" className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                <span className="text-sm font-semibold text-white/90">Ver Inventario</span>
                <ArrowRight className="w-4 h-4 text-nikeOrange" />
              </a>
              <a href="/chatbot" className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                <span className="text-sm font-semibold text-white/90">Asistente IA</span>
                <ArrowRight className="w-4 h-4 text-nikeOrange" />
              </a>
              <a href="/tracking" className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                <span className="text-sm font-semibold text-white/90">Tracking GPS</span>
                <ArrowRight className="w-4 h-4 text-nikeOrange" />
              </a>
            </div>
          </ChartContainer>
        </div>
      </div>
    </div>
  )
}

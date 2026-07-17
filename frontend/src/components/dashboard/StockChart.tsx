import React, { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Package, Layers, PieChart as PieIcon, ArrowUpRight } from 'lucide-react'
import { Card } from '../ui/Card'
import { useDashboardFilters } from '../../context/DashboardFilterContext'
import { metricsService } from '../../services/metrics.service'
import { ChartSkeleton } from '../metrics/MetricCardSkeleton'
import type { StockByWarehouse } from '../../types/metrics'

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const title = payload[0].payload.name || '';
    return (
      <div className="bg-[#121215]/95 border border-white/10 backdrop-blur-md px-4 py-3 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.8)] text-xs font-semibold text-white">
        <p className="font-bold text-slate-200 mb-1.5 border-b border-white/5 pb-1.5">
          {title}
        </p>
        <div className="space-y-1.5">
          {payload.map((item: any, index: number) => {
            const displayName = item.dataKey === 'value' ? item.payload.name : item.name;
            return (
              <div key={index} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color || item.fill }} />
                  {displayName}
                </span>
                <span className="font-mono font-bold text-white">
                  {item.value.toLocaleString()} und
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

export const StockChart: React.FC = () => {
  const { filters } = useDashboardFilters()
  const [data, setData] = useState<StockByWarehouse[]>([])
  const [activeWarehouse, setActiveWarehouse] = useState<StockByWarehouse | null>(null)
  const [loading, setLoading] = useState(true)
  const [chartMode, setChartMode] = useState<'total' | 'critical'>('total')

  const pieData = activeWarehouse
    ? (activeWarehouse.breakdown || []).map(item => ({
        ...item,
        displayValue: chartMode === 'total' ? item.value : item.critical
      })).filter(item => item.displayValue > 0)
    : []

  const getCategoryColor = (name: string): string => {
    const nameLower = name.toLowerCase()
    if (nameLower.includes('fútbol') || nameLower.includes('futbol') || nameLower.includes('football')) {
      return '#ffffff' // stark white for football
    } else if (nameLower.includes('lifestyle') || nameLower.includes('moda') || nameLower.includes('urban')) {
      return '#94a3b8' // slate silver for lifestyle
    } else if (nameLower.includes('running') || nameLower.includes('correr') || nameLower.includes('entrenamiento')) {
      return '#475569' // dark gray for running
    }
    return '#cbd5e1' // default light gray
  }

  useEffect(() => {
    setLoading(true)
    metricsService.getStockByWarehouse(filters.warehouseId)
      .then((res) => {
        const formattedData = res.map((wh) => ({
          ...wh,
          breakdown: (wh.breakdown || []).map((item) => ({
            ...item,
            color: getCategoryColor(item.name)
          }))
        }))
        setData(formattedData)
        if (formattedData.length > 0) {
          setActiveWarehouse((prev) => {
            if (!prev) return formattedData[0]
            const match = formattedData.find(w => w.name === prev.name)
            return match || formattedData[0]
          })
        } else {
          setActiveWarehouse(null)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [filters.warehouseId])

  if (loading) {
    return <ChartSkeleton className="w-full" />
  }

  if (!activeWarehouse || data.length === 0) {
    return (
      <Card
        title="Análisis Operativo Multi-Sede - Logística Nike"
        icon={<Package className="w-6 h-6 text-white filter drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" />}
        className="w-full"
      >
        <p className="text-sm text-white/30 text-center py-8">No hay datos de stock disponibles.</p>
      </Card>
    )
  }

  return (
    <Card
      title="Análisis Operativo Multi-Sede - Logística Nike"
      icon={<Package className="w-6 h-6 text-white filter drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" />}
      className="w-full perspective-[1200px]"
    >
      <div className="text-xs text-white/40 -mt-4 mb-6 italic">
        Interactúa sobre las barras de la izquierda para desplegar el desglose estructural de cada almacén.
      </div>

      {/* Contenedor en 2 columnas amplias y equilibradas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch [transform-style:preserve-3d]">

        {/* Columna Izquierda: Gráfico de Barras Verticales (7 columnas) */}
        <div className="lg:col-span-7 bg-[#121215]/80 backdrop-blur-md rounded-3xl p-6 border-t border-white/15 border-x border-white/10 border-b border-black/40 relative flex flex-col justify-between shadow-[0_15px_35px_rgba(0,0,0,0.6)] transform [transform-style:preserve-3d] hover:rotate-x-[1.5deg] hover:rotate-y-[-1.5deg] hover:border-white/25 transition-all duration-500 ease-out">
          <div className="flex items-center justify-between mb-6">
            <span className="text-xs font-mono text-white uppercase tracking-widest flex items-center gap-2">
              <Layers className="w-4 h-4 text-white/60" /> Comparativa de Stock por Sede
            </span>
            <span className="text-[10px] text-white bg-white/10 border border-white/20 px-2.5 py-1 rounded-full flex items-center gap-1 font-semibold">
              Modo Interactivo <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>

          <div className="w-full h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                onMouseMove={(state) => {
                  if (state && state.activePayload && state.activePayload.length > 0) {
                    setActiveWarehouse(state.activePayload[0].payload)
                  }
                }}
                onClick={(state) => {
                  if (state && state.activePayload && state.activePayload.length > 0) {
                    setActiveWarehouse(state.activePayload[0].payload)
                  }
                }}
              >
                <defs>
                  <linearGradient id="nikeOrangeGradient3d" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#4b5563" stopOpacity={0.95} />
                    <stop offset="60%" stopColor="#ffffff" stopOpacity={1} />
                    <stop offset="100%" stopColor="#e5e7eb" stopOpacity={1} />
                  </linearGradient>
                  <linearGradient id="nikeRedGradient3d" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#991b1b" stopOpacity={0.95} />
                    <stop offset="60%" stopColor="#ef4444" stopOpacity={1} />
                    <stop offset="100%" stopColor="#f87171" stopOpacity={1} />
                  </linearGradient>
                  <filter id="bar3DShadow" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="3" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.7" />
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                <XAxis type="number" stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.9)" fontSize={13} fontWeight={600} tickLine={false} axisLine={false} width={100} />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                  content={<CustomTooltip />}
                />
                <Bar dataKey="normal" name="Stock Normal" fill="url(#nikeOrangeGradient3d)" stackId="a" filter="url(#bar3DShadow)" barSize={24} />
                <Bar dataKey="critical" name="Stock Crítico" fill="url(#nikeRedGradient3d)" stackId="a" radius={[0, 6, 6, 0]} filter="url(#bar3DShadow)" barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-8 text-xs text-slate-400 pt-4 border-t border-white/5 mt-4">
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-gradient-to-r from-gray-300 to-white shadow-[0_0_8px_rgba(255,255,255,0.4)]" /> Stock Normal</span>
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-gradient-to-r from-red-800 to-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" /> Stock Crítico</span>
          </div>
        </div>

        {/* Columna Derecha: Gráfico Circular Dinámico (5 columnas) */}
        <div className="lg:col-span-5 bg-[#121215]/80 backdrop-blur-md rounded-3xl p-6 border-t border-white/15 border-x border-white/10 border-b border-black/40 relative flex flex-col justify-between shadow-[0_15px_35px_rgba(0,0,0,0.6)] transform [transform-style:preserve-3d] hover:rotate-x-[1.5deg] hover:rotate-y-[1.5deg] hover:border-white/25 transition-all duration-500 ease-out">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <span className="text-xs font-mono text-white uppercase tracking-widest flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-white/60" /> Desglose por Categoría
            </span>
            <div className="flex items-center gap-2.5">
              <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 gap-0.5">
                <button
                  onClick={() => setChartMode('total')}
                  className={`px-2.5 py-0.5 text-[9px] font-extrabold rounded-lg transition-all ${chartMode === 'total' ? 'bg-white text-black shadow-md' : 'text-white/40 hover:text-white/80'}`}
                >
                  Total
                </button>
                <button
                  onClick={() => setChartMode('critical')}
                  className={`px-2.5 py-0.5 text-[9px] font-extrabold rounded-lg transition-all ${chartMode === 'critical' ? 'bg-red-500 text-white shadow-md' : 'text-white/40 hover:text-white/80'}`}
                >
                  Crítico
                </button>
              </div>
              <span className="text-[10px] font-bold text-white bg-white/10 border border-white/20 px-2 py-0.5 rounded-lg">
                {activeWarehouse.name}
              </span>
            </div>
          </div>

          <div className="w-full h-[200px] flex items-center justify-center relative">
            {pieData.length === 0 ? (
              <div className="text-center p-4">
                <p className="text-sm font-semibold text-white/50">Stock Totalmente Óptimo</p>
                <p className="text-[10px] text-emerald-400 mt-1">No hay alertas ni stock crítico en esta sede.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    <filter id="pie3DShadow" x="-10%" y="-10%" width="120%" height="120%">
                      <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.8" />
                    </filter>
                  </defs>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={6}
                    dataKey="displayValue"
                    filter="url(#pie3DShadow)"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(255,255,255,0.15)" strokeWidth={1.5} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Tarjetas inferiores de desglose */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/5 text-center mt-4">
            {(activeWarehouse.breakdown || []).map((item, idx) => {
              const hasCritical = item.critical > 0;
              return (
                <div
                  key={idx}
                  className={`bg-white/[0.02] hover:bg-white/[0.06] p-3 rounded-2xl border border-white/5 shadow-md transition-all duration-300 hover:-translate-y-0.5 group cursor-pointer ${
                    chartMode === 'critical' 
                      ? (hasCritical ? 'hover:border-red-500/40 border-red-500/20 shadow-[0_0_12px_rgba(239,68,68,0.1)]' : 'opacity-40') 
                      : 'hover:border-white/30'
                  }`}
                >
                  <div className="text-[10px] font-semibold text-white/50 flex items-center justify-center gap-1.5 uppercase tracking-wider truncate">
                    <span className="w-1.5 h-1.5 rounded-full scale-100 group-hover:scale-125 transition-transform duration-300" style={{ backgroundColor: item.color }} />
                    {item.name}
                  </div>
                  <div className="text-sm font-black text-white mt-1.5 transition-colors group-hover:text-white">
                    {chartMode === 'critical' ? `${item.critical} prod.` : `${item.value} und`}
                  </div>
                  {chartMode === 'total' && hasCritical && (
                    <span className="text-[9px] font-bold text-red-400 px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 mt-1.5 inline-block animate-pulse">
                      {item.critical} crítico
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </Card>
  )
}
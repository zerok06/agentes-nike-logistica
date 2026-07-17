import React from 'react'
import { TimeRangeSelector } from '../metrics/TimeRangeSelector'
import { useDashboardFilters } from '../../context/DashboardFilterContext'
import api from '../../services/api'
import { ChevronDown, Warehouse, Tag } from 'lucide-react'

interface FilterOption {
  id: number | null
  name: string
}

export const DashboardFilterBar: React.FC<{
  refreshing?: boolean
  onRefresh?: () => void
  nextRefresh?: number
}> = () => {
  const { filters, setTimeRange, setWarehouseId, setCategory } = useDashboardFilters()
  const [warehouses, setWarehouses] = React.useState<FilterOption[]>([])
  const [categories, setCategories] = React.useState<FilterOption[]>([])

  React.useEffect(() => {
    Promise.all([
      api.get('/metrics/warehouses').then(r => r.data),
      api.get('/metrics/categories').then(r => r.data),
    ])
      .then(([wh, cat]) => {
        console.log('Fetched warehouses:', wh);
        console.log('Fetched categories:', cat);
        const hasWarehouses = Array.isArray(wh) && wh.length > 0;
        const warehousesData = hasWarehouses ? wh.map((w: any) => ({ id: w.id, name: w.name })) : [
          { id: 1, name: 'Almacén Central' },
          { id: 2, name: 'Almacén Norte' },
          { id: 3, name: 'Almacén Sur' },
        ];
        setWarehouses(warehousesData);
        setCategories(cat.map((c: any) => ({ id: c.id, name: c.name })));
      })
      .catch((err) => {
        console.error('Error loading filter data:', err);
        // Fallback mock data for development/testing
        const mockWarehouses = [
          { id: 1, name: 'Almacén Central' },
          { id: 2, name: 'Almacén Norte' },
          { id: 3, name: 'Almacén Sur' },
        ];
        setWarehouses(mockWarehouses);
        setCategories([]);
      })
  }, [])

  return (
    <div className="w-full bg-gradient-to-b from-[#141418] to-[#0c0c0e] border-t border-white/15 border-x border-white/10 border-b border-black/40 rounded-3xl p-6 shadow-[0_20px_40px_rgba(0,0,0,0.8)] flex flex-wrap items-center justify-between gap-6 transition-all duration-300 hover:border-white/25">
      <div className="flex items-center gap-3">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
        </span>
        <span className="text-xs font-mono uppercase tracking-wider text-white/60">Filtros de Comando Operativo</span>
      </div>
      <div className="flex items-center gap-4 flex-wrap">
        {/* Selector de Rango de Tiempo */}
        <TimeRangeSelector value={filters.timeRange} onChange={(d) => setTimeRange(d)} />

        {/* Selector de Almacenes con diseño estilizado */}
        <div className="relative flex items-center">
          <Warehouse className="absolute left-3.5 w-4 h-4 text-[#ff7a00] pointer-events-none" />
          <select
            value={filters.warehouseId ?? ''}
            onChange={(e) => setWarehouseId(e.target.value ? Number(e.target.value) : null)}
            className="pl-10 pr-9 py-2.5 rounded-2xl bg-[#121215] border border-white/15 text-white/90 text-xs font-semibold focus:outline-none focus:border-[#ff7a00] focus:ring-2 focus:ring-[#ff7a00]/20 appearance-none cursor-pointer shadow-lg transition-all hover:bg-[#15151b] hover:border-white/25"
          >
            <option value="">Todos los almacenes</option>
            {warehouses.map((w) => (
              <option key={w.id} value={String(w.id)}>{w.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3.5 w-4 h-4 text-white/40 pointer-events-none" />
        </div>

        {/* Selector de Categorías con diseño estilizado */}
        <div className="relative flex items-center">
          <Tag className="absolute left-3.5 w-4 h-4 text-[#ff7a00] pointer-events-none" />
          <select
            value={filters.category ?? ''}
            onChange={(e) => setCategory(e.target.value || null)}
            className="pl-10 pr-9 py-2.5 rounded-2xl bg-[#121215] border border-white/15 text-white/90 text-xs font-semibold focus:outline-none focus:border-[#ff7a00] focus:ring-2 focus:ring-[#ff7a00]/20 appearance-none cursor-pointer shadow-lg transition-all hover:bg-[#15151b] hover:border-white/25"
          >
            <option value="">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3.5 w-4 h-4 text-white/40 pointer-events-none" />
        </div>
      </div>
    </div>
  )
}
import React from 'react'
import { TimeRangeSelector } from '../metrics/TimeRangeSelector'
import { useDashboardFilters } from '../../context/DashboardFilterContext'
import api from '../../services/api'

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
    ]).then(([wh, cat]) => {
      setWarehouses(wh.map((w: any) => ({ id: w.id, name: w.name })))
      setCategories(cat.map((c: any) => ({ id: c.id, name: c.name })))
    }).catch(() => {})
  }, [])

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <TimeRangeSelector value={filters.timeRange} onChange={(d) => setTimeRange(d)} />
      <select
        value={filters.warehouseId ?? ''}
        onChange={(e) => setWarehouseId(e.target.value ? Number(e.target.value) : null)}
        className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/80 text-xs font-semibold focus:outline-none focus:border-nikeOrange/50 appearance-none cursor-pointer"
      >
        <option value="">Todos los almacenes</option>
        {warehouses.map((w) => (
          <option key={w.id} value={w.id ?? ''}>{w.name}</option>
        ))}
      </select>
      <select
        value={filters.category ?? ''}
        onChange={(e) => setCategory(e.target.value || null)}
        className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/80 text-xs font-semibold focus:outline-none focus:border-nikeOrange/50 appearance-none cursor-pointer"
      >
        <option value="">Todas las categorías</option>
        {categories.map((c) => (
          <option key={c.name} value={c.name}>{c.name}</option>
        ))}
      </select>
    </div>
  )
}

import React, { useEffect, useState } from 'react'
import { Warehouse } from 'lucide-react'
import api from '../../services/api'
import type { WarehouseDistribution } from '../../types/product'

interface WarehouseOption {
  id: number
  name: string
  city: string | null
}

interface WarehouseDistributionFormProps {
  value: WarehouseDistribution[]
  onChange: (dists: WarehouseDistribution[]) => void
}

export const WarehouseDistributionForm: React.FC<WarehouseDistributionFormProps> = ({ value, onChange }) => {
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([])

  useEffect(() => {
    api.get('/metrics/warehouses').then(r => setWarehouses(r.data)).catch(() => {})
  }, [])

  const toggleWarehouse = (whId: number) => {
    const exists = value.find((d) => d.warehouse_id === whId)
    if (exists) {
      onChange(value.filter((d) => d.warehouse_id !== whId))
    } else {
      onChange([...value, { warehouse_id: whId, stock_qty: 0 }])
    }
  }

  const updateQty = (whId: number, qty: number) => {
    onChange(
      value.map((d) => (d.warehouse_id === whId ? { ...d, stock_qty: qty } : d))
    )
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-white/80 flex items-center gap-2">
        <Warehouse className="w-4 h-4 text-nikeOrange" />
        Distribuir en almacenes
      </label>
      <p className="text-[10px] text-white/40 mb-2">
        Selecciona los almacenes donde se distribuirá este producto y asigna el stock inicial.
      </p>
      <div className="space-y-1.5">
        {warehouses.map((wh) => {
          const dist = value.find((d) => d.warehouse_id === wh.id)
          const selected = !!dist
          return (
            <div
              key={wh.id}
              className={`flex items-center gap-3 p-2 rounded-lg border transition-colors cursor-pointer ${
                selected
                  ? 'bg-nikeOrange/5 border-nikeOrange/30'
                  : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}
              onClick={() => toggleWarehouse(wh.id)}
            >
              <input
                type="checkbox"
                checked={selected}
                onChange={() => toggleWarehouse(wh.id)}
                className="accent-nikeOrange"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white/80 truncate">{wh.name}</p>
                <p className="text-[10px] text-white/40">{wh.city || ''}</p>
              </div>
              {selected && (
                <input
                  type="number"
                  min={0}
                  value={dist?.stock_qty ?? 0}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => updateQty(wh.id, Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-20 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white text-xs text-center"
                  placeholder="Stock"
                />
              )}
            </div>
          )
        })}
      </div>
      {warehouses.length === 0 && (
        <p className="text-xs text-white/30">Cargando almacenes...</p>
      )}
    </div>
  )
}

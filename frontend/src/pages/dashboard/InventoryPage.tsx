import React, { useEffect, useState } from 'react'
import {
  Database,
  RefreshCw,
  ShieldAlert,
  ClipboardList,
  Search,
} from 'lucide-react'
import { Card } from '../../components/ui/card'
import { Loader } from '../../components/ui/Loader'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { toast } from 'sonner'
import { useAuthStore } from '../../store/useAuthStore'
import { inventoryService } from '../../services/inventory.service'
import type { StockItem, TransferRequest } from '../../types/inventory'

export const InventoryPage: React.FC = () => {
  const { hasRole } = useAuthStore()
  const [stock, setStock] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [transferError, setTransferError] = useState<string | null>(null)
  const [transferSuccess, setTransferSuccess] = useState<string | null>(null)

  const [selectedProduct, setSelectedProduct] = useState('')
  const [fromWarehouse, setFromWarehouse] = useState('')
  const [toWarehouse, setToWarehouse] = useState('')
  const [transferQty, setTransferQty] = useState(5)

  const fetchStock = async () => {
    setLoading(true)
    try {
      const data = await inventoryService.getStock()
      setStock(data)
      setTransferError(null)
    } catch (err: any) {
      setTransferError('No se pudo cargar el inventario.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStock()
  }, [])

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    setTransferSuccess(null)
    setTransferError(null)

    if (!selectedProduct || !fromWarehouse || !toWarehouse) {
      setTransferError('Por favor selecciona todos los campos.')
      toast.error('Por favor selecciona todos los campos.')
      return
    }

    try {
      const data: TransferRequest = {
        product_id: parseInt(selectedProduct),
        from_warehouse_id: parseInt(fromWarehouse),
        to_warehouse_id: parseInt(toWarehouse),
        quantity: transferQty,
      }
      const result = await inventoryService.transferStock(data)
      setTransferSuccess(result.message)
      toast.success(result.message)
      fetchStock()
    } catch (err: any) {
      if (err.response?.status === 403) {
        setTransferError('Acceso Denegado: No tienes permisos para modificar el stock.')
        toast.error('Acceso Denegado: No tienes permisos para modificar el stock.')
      } else {
        setTransferError(err.response?.data?.detail || 'Error al procesar la transferencia.')
        toast.error(err.response?.data?.detail || 'Error al procesar la transferencia.')
      }
    }
  }

  const filteredStock = stock.filter(
    (item) =>
      item.product_name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase()) ||
      item.warehouse_name.toLowerCase().includes(search.toLowerCase()),
  )

  const uniqueProducts = Array.from(new Set(stock.map((item) => item.product_name))).map(
    (name) => {
      const found = stock.find((item) => item.product_name === name)
      return { id: found?.inventory_id, name }
    },
  )

  return (
    <div className="space-y-6">
      {/* Stock table */}
      <Card
        title="Inventario y Stock en Vivo"
        icon={<Database className="w-5 h-5 text-nikeOrange" />}
        action={
          <button
            onClick={fetchStock}
            className="text-xs text-nikeOrange hover:text-white transition-colors uppercase font-bold tracking-wider flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" /> Refrescar
          </button>
        }
      >
        {/* Search */}
        <div className="mb-4">
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por SKU, producto o almacén..."
            icon={<Search className="w-4 h-4" />}
          />
        </div>

        {loading ? (
          <Loader label="Cargando base de datos central..." />
        ) : filteredStock.length === 0 ? (
          <div className="text-center py-10 text-white/30 text-sm">
            No hay stock registrado o no coincide la búsqueda.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/5 text-white/40 text-xs uppercase tracking-wider">
                  <th className="py-3 px-2">SKU</th>
                  <th className="py-3 px-2">Producto</th>
                  <th className="py-3 px-2">Almacén</th>
                  <th className="py-3 px-2 text-right">Cantidad</th>
                  <th className="py-3 px-2 text-right">Estado</th>
                </tr>
              </thead>
              <tbody>
                {filteredStock.map((item) => (
                  <tr
                    key={item.inventory_id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-3.5 px-2 font-mono text-xs text-white/60">
                      {item.sku}
                    </td>
                    <td className="py-3.5 px-2 font-semibold text-white/90">
                      {item.product_name}
                    </td>
                    <td className="py-3.5 px-2 text-white/60">
                      {item.warehouse_name}{' '}
                      <span className="text-xs text-white/30">({item.city})</span>
                    </td>
                    <td
                      className={`py-3.5 px-2 text-right font-bold ${
                        item.stock_qty < item.min_stock
                          ? 'text-red-400'
                          : 'text-green-400'
                      }`}
                    >
                      {item.stock_qty}
                    </td>
                    <td className="py-3.5 px-2 text-right">
                      {item.stock_qty < item.min_stock ? (
                        <Badge variant="danger">Crítico</Badge>
                      ) : (
                        <Badge variant="success">Normal</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Transfer form */}
      <Card
        title="Traslado Rápido de Stock"
        icon={<ClipboardList className="w-5 h-5 text-nikeOrange" />}
      >
        {!hasRole('admin', 'supervisor') ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex gap-3 items-start">
            <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-red-400">Funcionalidad Restringida</h4>
              <p className="text-xs text-white/50 mt-1">
                Tu rol de <strong>Operador</strong> no permite simular traslados ni modificar el stock.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleTransfer} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Calzado / Producto</Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona Calzado" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueProducts.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Cantidad</Label>
                <Input
                  type="number"
                  value={transferQty}
                  onChange={(e) => setTransferQty(parseInt(e.target.value))}
                  min={1}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Almacén Origen</Label>
                <Select value={fromWarehouse} onValueChange={setFromWarehouse}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona Origen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Almacén Central Lima (Lima)</SelectItem>
                    <SelectItem value="2">Almacén Logístico Callao (Callao)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Almacén Destino</Label>
                <Select value={toWarehouse} onValueChange={setToWarehouse}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona Destino" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">Almacén Logístico Callao (Callao)</SelectItem>
                    <SelectItem value="1">Almacén Central Lima (Lima)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {transferSuccess && (
              <div className="text-xs text-green-400 font-semibold bg-green-500/10 border border-green-500/20 p-3 rounded-xl">
                {transferSuccess}
              </div>
            )}
            {transferError && (
              <div className="text-xs text-red-400 font-semibold bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
                {transferError}
              </div>
            )}

            <Button type="submit">Confirmar Traslado</Button>
          </form>
        )}
      </Card>
    </div>
  )
}

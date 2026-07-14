import React, { useEffect, useState, useMemo } from 'react'
import {
  Database,
  RefreshCw,
  ShieldAlert,
  ClipboardList,
  Search,
  Package,
  AlertTriangle,
  TrendingUp,
  Warehouse,
  ArrowRight,
  Filter,
  X,
} from 'lucide-react'
import { Card } from '../../components/ui/card'
import { Loader } from '../../components/ui/Loader'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Progress } from '../../components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '../../components/ui/tabs'
import { toast } from 'sonner'
import { useAuthStore } from '../../store/useAuthStore'
import { useIsMobile } from '../../hooks/useIsMobile'
import { inventoryService } from '../../services/inventory.service'
import type { StockItem, TransferRequest } from '../../types/inventory'

type StockFilter = 'all' | 'normal' | 'critical' | 'low'

export const InventoryPage: React.FC = () => {
  const { hasRole } = useAuthStore()
  const isMobile = useIsMobile()
  const [stock, setStock] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<StockFilter>('all')
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
    } catch {
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

    if (fromWarehouse === toWarehouse) {
      setTransferError('El almacén origen y destino deben ser diferentes.')
      toast.error('El almacén origen y destino deben ser diferentes.')
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

  const stats = useMemo(() => {
    const totalUnits = stock.reduce((sum, item) => sum + item.stock_qty, 0)
    const criticalCount = stock.filter((item) => item.stock_qty < item.min_stock).length
    const lowCount = stock.filter((item) => item.stock_qty <= item.min_stock * 1.5 && item.stock_qty >= item.min_stock).length
    const normalCount = stock.length - criticalCount - lowCount
    const warehouses = new Set(stock.map((item) => item.warehouse_name)).size
    return { totalUnits, criticalCount, lowCount, normalCount, warehouses, totalProducts: stock.length }
  }, [stock])

  const filteredStock = useMemo(() => {
    let result = stock.filter(
      (item) =>
        item.product_name.toLowerCase().includes(search.toLowerCase()) ||
        item.sku.toLowerCase().includes(search.toLowerCase()) ||
        item.warehouse_name.toLowerCase().includes(search.toLowerCase()),
    )

    if (filter !== 'all') {
      result = result.filter((item) => {
        if (filter === 'critical') return item.stock_qty < item.min_stock
        if (filter === 'low') return item.stock_qty <= item.min_stock * 1.5 && item.stock_qty >= item.min_stock
        if (filter === 'normal') return item.stock_qty > item.min_stock * 1.5
        return true
      })
    }

    return result
  }, [stock, search, filter])

  const uniqueProducts = Array.from(new Set(stock.map((item) => item.product_name))).map(
    (name) => {
      const found = stock.find((item) => item.product_name === name)
      return { id: found?.inventory_id, name }
    },
  )

  const getStockPercent = (item: StockItem) => {
    const max = item.max_stock || 500
    return Math.min(100, (item.stock_qty / max) * 100)
  }

  const getStockState = (item: StockItem): 'critical' | 'low' | 'normal' => {
    if (item.stock_qty < item.min_stock) return 'critical'
    if (item.stock_qty <= item.min_stock * 1.5) return 'low'
    return 'normal'
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <Card className="p-4 lg:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] lg:text-xs text-white/40 uppercase tracking-wider font-semibold">Total Unidades</p>
              <p className="text-xl lg:text-3xl font-bold text-white/90 mt-1">{stats.totalUnits}</p>
            </div>
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-nikeOrange/10 flex items-center justify-center">
              <Package className="w-5 h-5 lg:w-6 lg:h-6 text-nikeOrange" />
            </div>
          </div>
        </Card>

        <Card className="p-4 lg:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] lg:text-xs text-white/40 uppercase tracking-wider font-semibold">Productos</p>
              <p className="text-xl lg:text-3xl font-bold text-white/90 mt-1">{stats.totalProducts}</p>
            </div>
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Database className="w-5 h-5 lg:w-6 lg:h-6 text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="p-4 lg:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] lg:text-xs text-white/40 uppercase tracking-wider font-semibold">Almacenes</p>
              <p className="text-xl lg:text-3xl font-bold text-white/90 mt-1">{stats.warehouses}</p>
            </div>
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
              <Warehouse className="w-5 h-5 lg:w-6 lg:h-6 text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="p-4 lg:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] lg:text-xs text-white/40 uppercase tracking-wider font-semibold">Stock Crítico</p>
              <p className="text-xl lg:text-3xl font-bold text-red-400 mt-1">{stats.criticalCount}</p>
            </div>
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 lg:w-6 lg:h-6 text-red-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Stock table */}
      <Card
        title="Inventario y Stock en Vivo"
        icon={<Database className="w-5 h-5 text-nikeOrange" />}
        action={
          <button
            onClick={fetchStock}
            className="text-xs text-nikeOrange hover:text-white transition-colors uppercase font-bold tracking-wider flex items-center gap-1"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Refrescar
          </button>
        }
      >
        {/* Search + Filters */}
        <div className="mb-4 space-y-3">
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por SKU, producto o almacén..."
            icon={<Search className="w-4 h-4" />}
          />

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Filter className="w-3.5 h-3.5 text-white/30 shrink-0" />
            <Tabs value={filter} onValueChange={(v) => setFilter(v as StockFilter)}>
              <TabsList className="h-9">
                <TabsTrigger value="all" className="text-xs">
                  Todos ({stats.totalProducts})
                </TabsTrigger>
                <TabsTrigger value="normal" className="text-xs">
                  Normal ({stats.normalCount})
                </TabsTrigger>
                <TabsTrigger value="low" className="text-xs">
                  Bajo ({stats.lowCount})
                </TabsTrigger>
                <TabsTrigger value="critical" className="text-xs">
                  Crítico ({stats.criticalCount})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {loading ? (
          <Loader label="Cargando base de datos central..." />
        ) : filteredStock.length === 0 ? (
          <div className="text-center py-10 text-white/30 text-sm">
            No hay stock registrado o no coincide la búsqueda.
          </div>
        ) : isMobile ? (
          /* Mobile: Card layout */
          <div className="space-y-3">
            {filteredStock.map((item) => {
              const state = getStockState(item)
              const percent = getStockPercent(item)
              return (
                <div
                  key={item.inventory_id}
                  className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-white/90 text-sm truncate">{item.product_name}</p>
                      <p className="font-mono text-[10px] text-white/40 mt-0.5">{item.sku}</p>
                    </div>
                    {state === 'critical' ? (
                      <Badge variant="danger">Crítico</Badge>
                    ) : state === 'low' ? (
                      <Badge variant="warning">Bajo</Badge>
                    ) : (
                      <Badge variant="success">Normal</Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-white/50">
                    <Warehouse className="w-3.5 h-3.5" />
                    <span className="truncate">{item.warehouse_name}</span>
                    {item.city && <span className="text-white/30">· {item.city}</span>}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/40">Stock</span>
                      <span className={`font-bold ${state === 'critical' ? 'text-red-400' : state === 'low' ? 'text-yellow-400' : 'text-green-400'}`}>
                        {item.stock_qty} / {item.max_stock || 500}
                      </span>
                    </div>
                    <Progress
                      value={percent}
                      className="h-1.5"
                      indicatorClassName={
                        state === 'critical'
                          ? 'bg-red-500'
                          : state === 'low'
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                      }
                    />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* Desktop: Table layout */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/5 text-white/40 text-xs uppercase tracking-wider">
                  <th className="py-3 px-2">SKU</th>
                  <th className="py-3 px-2">Producto</th>
                  <th className="py-3 px-2">Almacén</th>
                  <th className="py-3 px-2 w-40">Nivel</th>
                  <th className="py-3 px-2 text-right">Cantidad</th>
                  <th className="py-3 px-2 text-right">Estado</th>
                </tr>
              </thead>
              <tbody>
                {filteredStock.map((item) => {
                  const state = getStockState(item)
                  const percent = getStockPercent(item)
                  return (
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
                        <div className="flex items-center gap-1.5">
                          <Warehouse className="w-3.5 h-3.5 text-white/30" />
                          <span>{item.warehouse_name}</span>
                          {item.city && <span className="text-xs text-white/30">({item.city})</span>}
                        </div>
                      </td>
                      <td className="py-3.5 px-2">
                        <div className="flex items-center gap-2">
                          <Progress
                            value={percent}
                            className="h-1.5"
                            indicatorClassName={
                              state === 'critical'
                                ? 'bg-red-500'
                                : state === 'low'
                                  ? 'bg-yellow-500'
                                  : 'bg-green-500'
                            }
                          />
                          <span className="text-[10px] text-white/30 shrink-0 w-16 text-right">
                            {item.stock_qty}/{item.max_stock || 500}
                          </span>
                        </div>
                      </td>
                      <td
                        className={`py-3.5 px-2 text-right font-bold ${
                          state === 'critical'
                            ? 'text-red-400'
                            : state === 'low'
                              ? 'text-yellow-400'
                              : 'text-green-400'
                        }`}
                      >
                        {item.stock_qty}
                      </td>
                      <td className="py-3.5 px-2 text-right">
                        {state === 'critical' ? (
                          <Badge variant="danger">Crítico</Badge>
                        ) : state === 'low' ? (
                          <Badge variant="warning">Bajo</Badge>
                        ) : (
                          <Badge variant="success">Normal</Badge>
                        )}
                      </td>
                    </tr>
                  )
                })}
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

            {/* Visual flow indicator */}
            {fromWarehouse && toWarehouse && fromWarehouse !== toWarehouse && (
              <div className="flex items-center justify-center gap-3 py-2 px-4 rounded-xl bg-white/5 border border-white/5">
                <span className="text-xs text-white/60 font-medium">
                  {fromWarehouse === '1' ? 'Lima' : 'Callao'}
                </span>
                <ArrowRight className="w-4 h-4 text-nikeOrange" />
                <span className="text-xs text-white/60 font-medium">
                  {toWarehouse === '1' ? 'Lima' : 'Callao'}
                </span>
                <span className="text-xs text-white/40">·</span>
                <span className="text-xs text-nikeOrange font-bold">{transferQty} unidades</span>
              </div>
            )}

            {transferSuccess && (
              <div className="text-xs text-green-400 font-semibold bg-green-500/10 border border-green-500/20 p-3 rounded-xl flex items-center gap-2">
                <TrendingUp className="w-4 h-4 shrink-0" />
                {transferSuccess}
              </div>
            )}
            {transferError && (
              <div className="text-xs text-red-400 font-semibold bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-center gap-2">
                <X className="w-4 h-4 shrink-0" />
                {transferError}
              </div>
            )}

            <Button type="submit" className="w-full md:w-auto">
              <ClipboardList className="w-4 h-4 mr-2" />
              Confirmar Traslado
            </Button>
          </form>
        )}
      </Card>
    </div>
  )
}

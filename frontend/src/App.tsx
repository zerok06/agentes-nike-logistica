import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { motion } from 'framer-motion'
import { RoleSwitcher } from './components/RoleSwitcher'
import { useAuthStore } from './store/useAuthStore'
import { useWebSocket } from './hooks/useWebSocket'
import { AuditTrail } from './features/audit/AuditTrail'
import { 
  MessageSquare, 
  Database, 
  Send, 
  Loader2, 
  MapPin, 
  TrendingUp, 
  ShieldAlert, 
  ArrowRight,
  ClipboardList
} from 'lucide-react'

interface StockItem {
  inventory_id: string
  sku: string
  product_name: string
  warehouse_name: string
  city: string
  stock_qty: number
  min_stock: number
  max_stock: number | null
}

interface Message {
  sender: 'user' | 'bot'
  text: string
  timestamp: Date
}

export default function App() {
  const { role } = useAuthStore()
  const [stock, setStock] = useState<StockItem[]>([])
  const [chatMessage, setChatMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<Message[]>([
    {
      sender: 'bot',
      text: '¡Hola! Soy tu Asistente Logístico de Nike. ¿En qué puedo ayudarte hoy con el inventario o despachos?',
      timestamp: new Date()
    }
  ])
  const [loadingChat, setLoadingChat] = useState(false)
  const [loadingStock, setLoadingStock] = useState(false)
  const [transferError, setTransferError] = useState<string | null>(null)
  
  // Datos para simulación rápida de reubicación
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [fromWarehouse, setFromWarehouse] = useState<string>('')
  const [toWarehouse, setToWarehouse] = useState<string>('')
  const [transferQty, setTransferQty] = useState<number>(5)
  const [transferSuccess, setTransferSuccess] = useState<string | null>(null)

  // Conexión resiliente WebSocket con fallback a HTTP polling
  const { isConnected, fallbackToPolling } = useWebSocket({
    url: 'ws://localhost:8000/api/v1/ws/stock',
    onMessage: (data) => {
      console.log("Notificación WebSocket recibida:", data)
      fetchStock() // Actualizar stock en caliente al recibir notificación
    },
    onFallbackTriggered: () => {
      // Activar HTTP polling cada 10 segundos
      const interval = setInterval(fetchStock, 10000)
      return () => clearInterval(interval)
    }
  })

  const fetchStock = async () => {
    setLoadingStock(true)
    try {
      const res = await axios.get('/api/v1/stock/')
      setStock(res.data)
      setTransferError(null)
    } catch (err: any) {
      console.error(err)
      setTransferError('No se pudo cargar el inventario. Verifica si el backend está activo.')
    } finally {
      setLoadingStock(false)
    }
  }

  useEffect(() => {
    fetchStock()
  }, [role]) // Recargar cuando cambie el rol para testear los permisos

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatMessage.trim()) return

    const userMsg = chatMessage
    setChatMessage('')
    setChatHistory(prev => [...prev, { sender: 'user', text: userMsg, timestamp: new Date() }])
    setLoadingChat(true)

    try {
      const res = await axios.post('/api/v1/chat/', { message: userMsg })
      setChatHistory(prev => [...prev, { sender: 'bot', text: res.data.response, timestamp: new Date() }])
    } catch (err: any) {
      console.error(err)
      setChatHistory(prev => [...prev, { 
        sender: 'bot', 
        text: 'Lo siento, ocurrió un error al consultar el chatbot de Nike.', 
        timestamp: new Date() 
      }])
    } finally {
      setLoadingChat(false)
    }
  }

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    setTransferSuccess(null)
    setTransferError(null)

    if (!selectedProduct || !fromWarehouse || !toWarehouse) {
      setTransferError('Por favor selecciona todos los campos.')
      return
    }

    try {
      const res = await axios.post('/api/v1/stock/transfer', {
        product_id: selectedProduct,
        from_warehouse_id: fromWarehouse,
        to_warehouse_id: toWarehouse,
        quantity: transferQty
      })
      setTransferSuccess(res.data.message)
      fetchStock()
    } catch (err: any) {
      if (err.response && err.response.status === 403) {
        setTransferError('Acceso Denegado: Como OPERADOR no tienes permisos para modificar el stock (403 Forbidden).')
      } else {
        setTransferError(err.response?.data?.detail || 'Error al procesar la transferencia.')
      }
    }
  }

  // Obtener listas únicas de productos y almacenes para el select de traslado
  const uniqueProducts = Array.from(new Set(stock.map(item => item.product_name))).map(name => {
    const found = stock.find(item => item.product_name === name)
    return { id: found?.inventory_id, name: name } // en una demo simplificada mapeamos al id
  })

  // Almacenes disponibles
  const warehousesList = Array.from(new Set(stock.map(item => item.warehouse_name))).map(name => {
    const found = stock.find(item => item.warehouse_name === name)
    return { id: found?.inventory_id, name: name, city: found?.city }
  })

  return (
    <div className="min-h-screen bg-background text-white p-6 md:p-10 font-sans relative pb-24">
      {/* Header */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 border-b border-white/5 pb-6">
        <div className="flex items-center gap-4">
          <svg className="w-16 h-6 text-white fill-current" viewBox="0 0 24 24">
            <path d="M21 6.5c-2.4 1.6-6.1 3.8-9 5.2-2.3 1.1-4.7 2.1-7.1 2.9-.6.2-1.2.4-1.9.4-.3 0-.6 0-.8-.2-.3-.2-.4-.5-.4-.9 0-1.1.7-2.7 1.8-4.4.9-1.4 2.1-2.9 3.5-4.2.3-.3.8-.4 1.1-.2.3.2.4.6.2 1-.7 1.4-1.4 3.1-1.7 4.5.7-.2 1.5-.6 2.4-1.1 3.2-1.8 7-4.1 10.4-5.6.8-.4 1.7-.8 2.5-.9.4 0 .7.1.8.4.1.3 0 .7-.5 1.1z"/>
          </svg>
          <div className="h-6 w-px bg-white/20"></div>
          <div>
            <h1 className="text-xl font-bold tracking-wider uppercase text-white/95">Nike Logística</h1>
            <p className="text-xs text-white/40 font-semibold tracking-widest uppercase">Plataforma de Inteligencia</p>
          </div>
        </div>

        {/* Indicator */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5 text-xs text-white/70">
            <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : fallbackToPolling ? 'bg-yellow-500' : 'bg-red-500'}`} />
            <span>{isConnected ? 'Real-Time Connected' : fallbackToPolling ? 'Fallback (REST Polling)' : 'Disconnected'}</span>
          </div>
          <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5 text-xs text-white/70">
            <ShieldAlert className="w-4 h-4 text-nikeOrange" />
            <span>
              Rol Activo en API: <strong className="text-white uppercase tracking-wider">{role}</strong>
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left column: Stock list and actions */}
        <section className="lg:col-span-7 flex flex-col gap-8">
          {/* Stock table card */}
          <div className="rounded-3xl glass-panel p-6 shadow-xl relative overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-nikeOrange" />
                <h2 className="text-lg font-bold tracking-tight text-white/90">Inventario y Stock en Vivo</h2>
              </div>
              <button 
                onClick={fetchStock} 
                className="text-xs text-nikeOrange hover:text-white transition-colors uppercase font-bold tracking-wider"
              >
                Refrescar
              </button>
            </div>

            {loadingStock ? (
              <div className="flex flex-col gap-3 py-10 justify-center items-center">
                <Loader2 className="w-8 h-8 text-nikeOrange animate-spin" />
                <span className="text-xs text-white/40">Cargando base de datos central...</span>
              </div>
            ) : stock.length === 0 ? (
              <div className="text-center py-10 text-white/30 text-sm">
                No hay stock registrado en el almacén o conexión fallida.
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
                    </tr>
                  </thead>
                  <tbody>
                    {stock.map((item) => (
                      <tr key={item.inventory_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-3.5 px-2 font-mono text-xs text-white/60">{item.sku}</td>
                        <td className="py-3.5 px-2 font-semibold text-white/90">{item.product_name}</td>
                        <td className="py-3.5 px-2 text-white/60">
                          {item.warehouse_name} <span className="text-xs text-white/30">({item.city})</span>
                        </td>
                        <td className={`py-3.5 px-2 text-right font-bold ${item.stock_qty < item.min_stock ? 'text-red-400' : 'text-green-400'}`}>
                          {item.stock_qty}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Quick Transfer Form (Disabled dynamically for Operator) */}
          <div className="rounded-3xl glass-panel p-6 shadow-xl relative overflow-hidden">
            <div className="flex items-center gap-3 mb-4">
              <ClipboardList className="w-5 h-5 text-nikeOrange" />
              <h2 className="text-lg font-bold tracking-tight text-white/90">Traslado Rápido de Stock</h2>
            </div>
            
            {role === 'operador' ? (
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex gap-3 items-start">
                <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-red-400">Funcionalidad Restringida</h4>
                  <p className="text-xs text-white/50 mt-1">
                    Tu rol de <strong>Operador</strong> no permite simular traslados ni modificar el stock en el backend. 
                    Por favor, utiliza el widget selector en la parte inferior para cambiar a <strong>Supervisor</strong> o <strong>Administrador</strong>.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleTransfer} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-white/40 uppercase tracking-wider font-semibold">Calzado / Producto</label>
                    <select 
                      value={selectedProduct} 
                      onChange={e => setSelectedProduct(e.target.value)}
                      className="bg-background border border-white/10 rounded-xl p-2.5 text-sm text-white focus:border-nikeOrange outline-none"
                    >
                      <option value="">Selecciona Calzado</option>
                      {uniqueProducts.map(p => (
                        <option key={p.id} value="ad000001-0000-0000-0000-000000000001">{p.name}</option> // Para demo simplificada usamos id dummy
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-white/40 uppercase tracking-wider font-semibold">Cantidad</label>
                    <input 
                      type="number" 
                      value={transferQty} 
                      onChange={e => setTransferQty(parseInt(e.target.value))}
                      min={1}
                      className="bg-background border border-white/10 rounded-xl p-2.5 text-sm text-white focus:border-nikeOrange outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-white/40 uppercase tracking-wider font-semibold">Almacén Origen</label>
                    <select 
                      value={fromWarehouse} 
                      onChange={e => setFromWarehouse(e.target.value)}
                      className="bg-background border border-white/10 rounded-xl p-2.5 text-sm text-white focus:border-nikeOrange outline-none"
                    >
                      <option value="">Selecciona Origen</option>
                      <option value="ab000001-0000-0000-0000-000000000001">Almacén Central Lima (Lima)</option>
                      <option value="ab000002-0000-0000-0000-000000000002">Almacén Logístico Callao (Callao)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-white/40 uppercase tracking-wider font-semibold">Almacén Destino</label>
                    <select 
                      value={toWarehouse} 
                      onChange={e => setToWarehouse(e.target.value)}
                      className="bg-background border border-white/10 rounded-xl p-2.5 text-sm text-white focus:border-nikeOrange outline-none"
                    >
                      <option value="">Selecciona Destino</option>
                      <option value="ab000002-0000-0000-0000-000000000002">Almacén Logístico Callao (Callao)</option>
                      <option value="ab000001-0000-0000-0000-000000000001">Almacén Central Lima (Lima)</option>
                    </select>
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

                <button 
                  type="submit" 
                  className="bg-nikeOrange hover:bg-nikeOrange/90 text-white font-bold text-sm uppercase py-3 rounded-xl transition-all tracking-widest hover:shadow-lg hover:shadow-nikeOrange/20 active:scale-98"
                >
                  Confirmar Traslado (Simular Drag-and-Drop)
                </button>
              </form>
            )}
          </div>
        </section>

        {/* Right column: Chatbot */}
        <section className="lg:col-span-5 flex flex-col h-[600px] md:h-[700px]">
          <div className="rounded-3xl glass-panel p-6 shadow-xl flex flex-col h-full overflow-hidden relative">
            <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
              <MessageSquare className="w-5 h-5 text-nikeOrange" />
              <div>
                <h2 className="text-lg font-bold tracking-tight text-white/90">Asistente Logístico RAG</h2>
                <p className="text-xs text-white/40">Powered by Huawei & pgvector</p>
              </div>
            </div>

            {/* Chat message display */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-4 mb-4 pr-2">
              {chatHistory.map((msg, index) => (
                <div 
                  key={index}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] rounded-2xl p-3.5 text-sm ${
                    msg.sender === 'user' 
                      ? 'bg-nikeOrange text-white rounded-tr-none' 
                      : 'bg-white/5 border border-white/5 text-white/90 rounded-tl-none'
                  }`}>
                    <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                    <span className="text-[10px] text-white/30 block text-right mt-1.5">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
              {loadingChat && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/5 rounded-2xl rounded-tl-none p-3.5 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-nikeOrange animate-spin" />
                    <span className="text-xs text-white/40">Buscando en pgvector & consultando DeepSeek...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input form */}
            <form onSubmit={handleSendChat} className="flex gap-2">
              <input 
                type="text" 
                value={chatMessage}
                onChange={e => setChatMessage(e.target.value)}
                placeholder="Pregunta sobre stock, jordan, pegasus..."
                className="flex-1 bg-background border border-white/10 rounded-2xl px-4 py-3 text-sm focus:border-nikeOrange outline-none text-white"
              />
              <button 
                type="submit"
                disabled={loadingChat || !chatMessage.trim()}
                className="bg-nikeOrange text-white p-3.5 rounded-2xl hover:bg-nikeOrange/90 transition-colors disabled:opacity-40 disabled:hover:bg-nikeOrange"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </section>
      </main>

      {/* Audit Trail Section */}
      <div className="max-w-7xl mx-auto mt-8">
        <AuditTrail />
      </div>

      {/* Floating Demo Switched Widget */}
      <RoleSwitcher />
    </div>
  )
}

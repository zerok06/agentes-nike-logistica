import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from 'react-leaflet'
import L from 'leaflet'
import {
  Truck,
  Package,
  Clock,
  Warehouse as WarehouseIcon,
  User,
  Activity,
  CheckCircle2,
  AlertCircle,
  Bike,
  MapPin,
  Navigation,
} from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'

import 'leaflet/dist/leaflet.css'

interface Sede {
  id: number
  name: string
  city: string
  lat: number
  lng: number
  capacity: number
  manager: string
  phone: string
  stock: number
  status: 'active' | 'warning' | 'critical'
}

interface Vehicle {
  id: string
  type: 'truck' | 'van' | 'bike'
  driver: string
  origin: string
  destination: string
  originLat: number
  originLng: number
  destLat: number
  destLng: number
  cargo: string
  cargoQty: number
  status: 'en_transito' | 'pendiente' | 'entregado' | 'retrasado'
  progress: number
  eta: string
  plate: string
}

const SEDES: Sede[] = [
  { id: 1, name: 'Centro Logístico Lima', city: 'Lima', lat: -12.046373, lng: -77.042754, capacity: 8000, manager: 'Jorge Ramos Tafur', phone: '+51 1 619 0001', stock: 5370, status: 'active' },
  { id: 2, name: 'Hub Lima Norte', city: 'Lima', lat: -11.997399, lng: -77.070756, capacity: 4000, manager: 'Ana Quiroz López', phone: '+51 1 619 0002', stock: 2100, status: 'warning' },
  { id: 3, name: 'Centro Logístico Arequipa', city: 'Arequipa', lat: -16.409047, lng: -71.537451, capacity: 5000, manager: 'Carlos Salas Meza', phone: '+51 54 300 001', stock: 4200, status: 'active' },
  { id: 4, name: 'Depósito Cusco', city: 'Cusco', lat: -13.531950, lng: -71.967463, capacity: 2000, manager: 'María Quispe Ccoa', phone: '+51 84 220 001', stock: 480, status: 'critical' },
  { id: 5, name: 'Distribuidora Trujillo', city: 'Trujillo', lat: -8.112782, lng: -79.028370, capacity: 3000, manager: 'Luis Vargas Ríos', phone: '+51 44 210 001', stock: 1850, status: 'active' },
]

const INITIAL_VEHICLES: Vehicle[] = [
  { id: 'SHP-001', type: 'truck', driver: 'Carlos Mendoza', plate: 'NK-2024-A', origin: 'Lima', destination: 'Arequipa', originLat: -12.046373, originLng: -77.042754, destLat: -16.409047, destLng: -71.537451, cargo: 'Air Jordan 1 Mid', cargoQty: 150, status: 'en_transito', progress: 65, eta: '2h 30min' },
  { id: 'SHP-002', type: 'van', driver: 'Ana Quispe', plate: 'NK-1819-B', origin: 'Lima', destination: 'Trujillo', originLat: -12.046373, originLng: -77.042754, destLat: -8.112782, destLng: -79.028370, cargo: 'Nike Pegasus 40', cargoQty: 80, status: 'en_transito', progress: 35, eta: '4h 45min' },
  { id: 'SHP-003', type: 'truck', driver: 'José Rivas', plate: 'NK-3344-C', origin: 'Arequipa', destination: 'Cusco', originLat: -16.409047, originLng: -71.537451, destLat: -13.531950, destLng: -71.967463, cargo: 'Nike Air Max 90', cargoQty: 200, status: 'pendiente', progress: 0, eta: 'Pendiente' },
  { id: 'SHP-004', type: 'bike', driver: 'Pedro Solís', plate: 'NK-5566-D', origin: 'Lima', destination: 'Lima Norte', originLat: -12.046373, originLng: -77.042754, destLat: -11.997399, destLng: -77.070756, cargo: 'Nike Dunk Low', cargoQty: 25, status: 'en_transito', progress: 80, eta: '25min' },
  { id: 'SHP-005', type: 'truck', driver: 'María Flores', plate: 'NK-7788-E', origin: 'Lima', destination: 'Trujillo', originLat: -12.046373, originLng: -77.042754, destLat: -8.112782, destLng: -79.028370, cargo: 'Nike ZoomX Vaporfly', cargoQty: 120, status: 'entregado', progress: 100, eta: 'Entregado' },
  { id: 'SHP-006', type: 'van', driver: 'Luis Gómez', plate: 'NK-9900-F', origin: 'Arequipa', destination: 'Lima', originLat: -16.409047, originLng: -71.537451, destLat: -12.046373, destLng: -77.042754, cargo: 'Nike Metcon 7', cargoQty: 60, status: 'retrasado', progress: 45, eta: '6h 15min (retraso)' },
]

const statusConfig = {
  en_transito: { label: 'En Tránsito', variant: 'info' as const, color: '#3B82F6' },
  pendiente: { label: 'Pendiente', variant: 'warning' as const, color: '#FBBF24' },
  entregado: { label: 'Entregado', variant: 'success' as const, color: '#22C55E' },
  retrasado: { label: 'Retrasado', variant: 'danger' as const, color: '#EF4444' },
}

const sedeStatusConfig = {
  active: { color: '#22C55E', label: 'Operativo', variant: 'success' as const },
  warning: { color: '#FBBF24', label: 'Stock Bajo', variant: 'warning' as const },
  critical: { color: '#EF4444', label: 'Crítico', variant: 'danger' as const },
}

const vehicleIconMap = {
  truck: <Truck className="w-4 h-4" />,
  van: <Package className="w-4 h-4" />,
  bike: <Bike className="w-4 h-4" />,
}

function createSedeIcon(color: string, status: string) {
  const pulseClass = status !== 'critical' ? '' : 'animate-pulse'
  return L.divIcon({
    className: 'custom-sede-marker',
    html: `
      <div style="position: relative; width: 30px; height: 30px;">
        <div style="position: absolute; inset: 0; border-radius: 50%; background: ${color}; opacity: 0.2; transform: scale(2); ${pulseClass}"></div>
        <div style="position: absolute; inset: 0; border-radius: 50%; background: ${color}; border: 2px solid white; box-shadow: 0 0 10px ${color};"></div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  })
}

function createVehicleIcon(color: string, type: string) {
  const icons: Record<string, string> = {
    truck: '🚚',
    van: '🚐',
    bike: '🏍️',
  }
  return L.divIcon({
    className: 'custom-vehicle-marker',
    html: `
      <div style="position: relative; width: 36px; height: 36px;">
        <div style="position: absolute; inset: -4px; border-radius: 50%; background: ${color}; opacity: 0.15; animation: pulse 2s infinite;"></div>
        <div style="position: absolute; inset: 0; border-radius: 50%; background: ${color}; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
          ${icons[type] || '📦'}
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  })
}

function interpolatePosition(
  originLat: number, originLng: number,
  destLat: number, destLng: number,
  progress: number,
): [number, number] {
  const lat = originLat + (destLat - originLat) * (progress / 100)
  const lng = originLng + (destLng - originLng) * (progress / 100)
  return [lat, lng]
}

function AutoFit({ sedes }: { sedes: Sede[] }) {
  const map = useMap()
  useEffect(() => {
    const bounds = L.latLngBounds(sedes.map((s) => [s.lat, s.lng] as [number, number]))
    map.fitBounds(bounds, { padding: [40, 40] })
  }, [map, sedes])
  return null
}

export const TrackingPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES)
  const [selectedSede, setSelectedSede] = useState<Sede | null>(null)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 0.15; }
        50% { transform: scale(1.5); opacity: 0.05; }
      }
      .leaflet-container { background: #0E0E10; }
      .leaflet-popup-content-wrapper { background: #1C1C1E; color: white; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); }
      .leaflet-popup-tip { background: #1C1C1E; }
      .leaflet-popup-content { margin: 12px 16px; }
      .leaflet-bar a { background: #1C1C1E; color: white; border-color: rgba(255,255,255,0.1); }
      .leaflet-bar a:hover { background: #2C2C2E; }
    `
    document.head.appendChild(style)
    return () => { document.head.removeChild(style) }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setVehicles((prev) =>
        prev.map((v) => {
          if (v.status === 'entregado' || v.status === 'pendiente') return v
          const increment = v.type === 'bike' ? 2 : v.type === 'van' ? 1.5 : 1
          const newProgress = Math.min(v.progress + increment, 100)
          if (newProgress >= 100) {
            return { ...v, progress: 100, status: 'entregado' as const, eta: 'Entregado' }
          }
          const remainingMin = Math.round(((100 - newProgress) / 100) * 300)
          return {
            ...v,
            progress: newProgress,
            eta: remainingMin > 60
              ? `${Math.floor(remainingMin / 60)}h ${remainingMin % 60}min`
              : `${remainingMin}min`,
          }
        }),
      )
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const filteredVehicles = filter === 'all'
    ? vehicles
    : vehicles.filter((v) => v.status === filter)

  const stats = {
    total: vehicles.length,
    enTransito: vehicles.filter((v) => v.status === 'en_transito').length,
    entregados: vehicles.filter((v) => v.status === 'entregado').length,
    retrasados: vehicles.filter((v) => v.status === 'retrasado').length,
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Envíos', value: stats.total, icon: <Package className="w-5 h-5 text-nikeOrange" />, color: 'text-nikeOrange' },
          { label: 'En Tránsito', value: stats.enTransito, icon: <Truck className="w-5 h-5 text-blue-400" />, color: 'text-blue-400' },
          { label: 'Entregados', value: stats.entregados, icon: <CheckCircle2 className="w-5 h-5 text-green-500" />, color: 'text-green-500' },
          { label: 'Retrasados', value: stats.retrasados, icon: <AlertCircle className="w-5 h-5 text-red-500" />, color: 'text-red-500' },
        ].map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">{stat.label}</p>
                <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
              </div>
              <div className="p-2.5 rounded-2xl bg-white/5">{stat.icon}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Map + Sede details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leaflet Map */}
        <div className="lg:col-span-2">
          <Card
            title="Mapa de Sedes — Nike Perú"
            icon={<MapPin className="w-5 h-5 text-nikeOrange" />}
          >
            <div className="rounded-2xl overflow-hidden border border-white/5" style={{ height: '500px' }}>
              <MapContainer
                center={[-12.5, -75]}
                zoom={5}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                <AutoFit sedes={SEDES} />

                {/* Route polylines */}
                {vehicles
                  .filter((v) => v.status === 'en_transito' || v.status === 'retrasado')
                  .map((v) => {
                    const positions: [number, number][] = [
                      [v.originLat, v.originLng],
                      [v.destLat, v.destLng],
                    ]
                    return (
                      <Polyline
                        key={`route-${v.id}`}
                        positions={positions}
                        pathOptions={{
                          color: statusConfig[v.status].color,
                          weight: 2,
                          opacity: 0.5,
                          dashArray: '6, 6',
                        }}
                      />
                    )
                  })}

                {/* Sede markers */}
                {SEDES.map((sede) => (
                  <Marker
                    key={sede.id}
                    position={[sede.lat, sede.lng]}
                    icon={createSedeIcon(sedeStatusConfig[sede.status].color, sede.status)}
                    eventHandlers={{ click: () => setSelectedSede(sede) }}
                  >
                    <Popup>
                      <div style={{ minWidth: '180px' }}>
                        <strong style={{ fontSize: '14px' }}>{sede.name}</strong>
                        <br />
                        <span style={{ color: '#999', fontSize: '12px' }}>{sede.city}</span>
                        <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '8px 0' }} />
                        <div style={{ fontSize: '12px' }}>
                          <div>📦 Stock: <strong>{sede.stock.toLocaleString()}</strong> / {sede.capacity.toLocaleString()}</div>
                          <div>👤 {sede.manager}</div>
                          <div>📞 {sede.phone}</div>
                          <div style={{ marginTop: '4px' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: '10px',
                              fontSize: '11px',
                              background: sedeStatusConfig[sede.status].color + '20',
                              color: sedeStatusConfig[sede.status].color,
                            }}>
                              {sedeStatusConfig[sede.status].label}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}

                {/* Vehicle markers (animated) */}
                {vehicles
                  .filter((v) => v.status === 'en_transito' || v.status === 'retrasado')
                  .map((v) => {
                    const pos = interpolatePosition(
                      v.originLat, v.originLng,
                      v.destLat, v.destLng,
                      v.progress,
                    )
                    return (
                      <Marker
                        key={`vehicle-${v.id}`}
                        position={pos}
                        icon={createVehicleIcon(statusConfig[v.status].color, v.type)}
                        zIndexOffset={1000}
                      >
                        <Popup>
                          <div style={{ minWidth: '160px' }}>
                            <strong>{v.id}</strong> — {v.plate}
                            <br />
                            <span style={{ color: '#999', fontSize: '12px' }}>{v.origin} → {v.destination}</span>
                            <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '8px 0' }} />
                            <div style={{ fontSize: '12px' }}>
                              <div>👤 {v.driver}</div>
                              <div>📦 {v.cargo} ({v.cargoQty} u.)</div>
                              <div>⏱️ ETA: {v.eta}</div>
                              <div>📊 Progreso: {Math.round(v.progress)}%</div>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    )
                  })}
              </MapContainer>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-white/50">
              {Object.entries(sedeStatusConfig).map(([key, val]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: val.color }} />
                  {val.label}
                </div>
              ))}
              <div className="flex items-center gap-1.5">
                <Navigation className="w-3 h-3 text-blue-400" />
                Ruta de envío
              </div>
            </div>
          </Card>
        </div>

        {/* Sede details panel */}
        <div className="lg:col-span-1">
          <Card
            title={selectedSede ? selectedSede.name : 'Sedes de Nike Perú'}
            icon={<WarehouseIcon className="w-5 h-5 text-nikeOrange" />}
          >
            {selectedSede ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant={sedeStatusConfig[selectedSede.status].variant}>
                    {sedeStatusConfig[selectedSede.status].label}
                  </Badge>
                  <span className="text-xs text-white/40">{selectedSede.city}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-white/5">
                    <p className="text-xs text-white/40 uppercase tracking-wider">Stock</p>
                    <p className="text-lg font-bold text-white/90">{selectedSede.stock.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5">
                    <p className="text-xs text-white/40 uppercase tracking-wider">Capacidad</p>
                    <p className="text-lg font-bold text-white/90">{selectedSede.capacity.toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <User className="w-4 h-4 text-white/30" />
                    {selectedSede.manager}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <Package className="w-4 h-4 text-white/30" />
                    {selectedSede.phone}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <MapPin className="w-4 h-4 text-white/30" />
                    {selectedSede.lat.toFixed(4)}, {selectedSede.lng.toFixed(4)}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-white/40 mb-1">
                    <span>Utilización</span>
                    <span>{Math.round((selectedSede.stock / selectedSede.capacity) * 100)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(selectedSede.stock / selectedSede.capacity) * 100}%`,
                        background: sedeStatusConfig[selectedSede.status].color,
                      }}
                    />
                  </div>
                </div>

                <button
                  onClick={() => setSelectedSede(null)}
                  className="text-xs text-nikeOrange hover:text-white transition-colors uppercase font-bold tracking-wider"
                >
                  ← Volver
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-white/40">
                  Haz clic en un marcador del mapa o en una sede para ver detalles.
                </p>
                {SEDES.map((sede) => (
                  <button
                    key={sede.id}
                    onClick={() => setSelectedSede(sede)}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ background: sedeStatusConfig[sede.status].color }}
                      />
                      <div>
                        <p className="text-sm font-semibold text-white/90">{sede.city}</p>
                        <p className="text-xs text-white/40">{sede.stock.toLocaleString()} u.</p>
                      </div>
                    </div>
                    <MapPin className="w-4 h-4 text-white/30" />
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Vehicles list */}
      <Card
        title="Vehículos y Envíos"
        icon={<Truck className="w-5 h-5 text-nikeOrange" />}
      >
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { key: 'all', label: 'Todos' },
            { key: 'en_transito', label: 'En Tránsito' },
            { key: 'pendiente', label: 'Pendiente' },
            { key: 'entregado', label: 'Entregado' },
            { key: 'retrasado', label: 'Retrasado' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                filter === f.key
                  ? 'bg-nikeOrange text-white'
                  : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <AnimatePresence>
            {filteredVehicles.map((vehicle) => {
              const status = statusConfig[vehicle.status]
              return (
                <motion.div
                  key={vehicle.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onClick={() => setSelectedVehicle(vehicle)}
                  className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-white/5 text-nikeOrange">
                        {vehicleIconMap[vehicle.type]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-white/90">{vehicle.id}</span>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </div>
                        <p className="text-xs text-white/50 mt-0.5">
                          {vehicle.origin} → {vehicle.destination}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-xs text-white/40">
                        <Clock className="w-3 h-3" />
                        {vehicle.eta}
                      </div>
                      <span className="text-xs font-mono text-white/30 mt-0.5 block">{vehicle.plate}</span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: status.color }}
                        animate={{ width: `${vehicle.progress}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-white/40">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" /> {vehicle.driver}
                    </span>
                    <span className="flex items-center gap-1">
                      <Package className="w-3 h-3" /> {vehicle.cargo} ({vehicle.cargoQty} u.)
                    </span>
                    <span className="flex items-center gap-1">
                      <Activity className="w-3 h-3" /> {Math.round(vehicle.progress)}%
                    </span>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </Card>

      {/* Vehicle detail modal */}
      <AnimatePresence>
        {selectedVehicle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedVehicle(null)}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel rounded-3xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/5 text-nikeOrange">
                    {vehicleIconMap[selectedVehicle.type]}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white/90">{selectedVehicle.id}</h3>
                    <p className="text-xs text-white/40">{selectedVehicle.plate}</p>
                  </div>
                </div>
                <Badge variant={statusConfig[selectedVehicle.status].variant}>
                  {statusConfig[selectedVehicle.status].label}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-white/5">
                    <p className="text-xs text-white/40 uppercase tracking-wider">Origen</p>
                    <p className="text-sm font-semibold text-white/90">{selectedVehicle.origin}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5">
                    <p className="text-xs text-white/40 uppercase tracking-wider">Destino</p>
                    <p className="text-sm font-semibold text-white/90">{selectedVehicle.destination}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-white/5">
                    <p className="text-xs text-white/40 uppercase tracking-wider">Conductor</p>
                    <p className="text-sm font-semibold text-white/90">{selectedVehicle.driver}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5">
                    <p className="text-xs text-white/40 uppercase tracking-wider">ETA</p>
                    <p className="text-sm font-semibold text-white/90">{selectedVehicle.eta}</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/5">
                  <p className="text-xs text-white/40 uppercase tracking-wider">Carga</p>
                  <p className="text-sm font-semibold text-white/90">
                    {selectedVehicle.cargo} — {selectedVehicle.cargoQty} unidades
                  </p>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-white/40 mb-1">
                    <span>Progreso</span>
                    <span>{Math.round(selectedVehicle.progress)}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${selectedVehicle.progress}%`,
                        background: statusConfig[selectedVehicle.status].color,
                      }}
                    />
                  </div>
                </div>

                <button
                  onClick={() => setSelectedVehicle(null)}
                  className="w-full mt-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-semibold text-white/70 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

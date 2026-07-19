import React, { useState, useEffect, useRef } from 'react'
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
  User,
  Activity,
  CheckCircle2,
  AlertCircle,
  Bike,
  MapPin,
  Navigation,
  Gauge,
  Route as RouteIcon,
  Search,
  X,
} from 'lucide-react'
import { MetricCard } from '../../components/metrics/MetricCard'
import { Card } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../components/ui/dialog'
import { Progress } from '../../components/ui/progress'
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs'

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

type VehicleStatus = 'en_transito' | 'pendiente' | 'entregado' | 'retrasado'
type VehicleType = 'truck' | 'van' | 'bike'

interface Vehicle {
  id: string
  type: VehicleType
  driver: string
  origin: string
  destination: string
  cargo: string
  cargoQty: number
  status: VehicleStatus
  progress: number
  eta: string
  plate: string
  speed: number
  distanceKm: number
  traveledKm: number
  route: [number, number][]
  currentPos: [number, number]
  bearing: number
  departureTime: string
}

const SEDES: Sede[] = [
  { id: 1, name: 'Centro Logístico Lima', city: 'Lima', lat: -12.046373, lng: -77.042754, capacity: 8000, manager: 'Jorge Ramos Tafur', phone: '+51 1 619 0001', stock: 5370, status: 'active' },
  { id: 2, name: 'Hub Lima Norte', city: 'Lima', lat: -11.997399, lng: -77.070756, capacity: 4000, manager: 'Ana Quiroz López', phone: '+51 1 619 0002', stock: 2100, status: 'warning' },
  { id: 3, name: 'Centro Logístico Arequipa', city: 'Arequipa', lat: -16.409047, lng: -71.537451, capacity: 5000, manager: 'Carlos Salas Meza', phone: '+51 54 300 001', stock: 4200, status: 'active' },
  { id: 4, name: 'Depósito Cusco', city: 'Cusco', lat: -13.531950, lng: -71.967463, capacity: 2000, manager: 'María Quispe Ccoa', phone: '+51 84 220 001', stock: 480, status: 'critical' },
  { id: 5, name: 'Distribuidora Trujillo', city: 'Trujillo', lat: -8.112782, lng: -79.028370, capacity: 3000, manager: 'Luis Vargas Ríos', phone: '+51 44 210 001', stock: 1850, status: 'active' },
]

const VEHICLE_SPEEDS: Record<VehicleType, { min: number; max: number }> = {
  truck: { min: 60, max: 80 },
  van: { min: 50, max: 70 },
  bike: { min: 25, max: 40 },
}

const statusConfig: Record<VehicleStatus, { label: string; variant: 'info' | 'warning' | 'success' | 'danger'; color: string }> = {
  en_transito: { label: 'En Tránsito', variant: 'info', color: '#06b6d4' },
  pendiente: { label: 'Pendiente', variant: 'warning', color: '#f59e0b' },
  entregado: { label: 'Entregado', variant: 'success', color: '#10b981' },
  retrasado: { label: 'Retrasado', variant: 'danger', color: '#ef4444' },
}

// Función auxiliar para asignar estilos de color semántico a las barras y estados
const getStatusStyles = (status: VehicleStatus) => {
  switch (status) {
    case 'entregado':
      return {
        bar: 'bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]',
      }
    case 'en_transito':
      return {
        bar: 'bg-gradient-to-r from-cyan-600 to-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)]',
      }
    case 'pendiente':
      return {
        bar: 'bg-gradient-to-r from-amber-600 to-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]',
      }
    case 'retrasado':
      return {
        bar: 'bg-gradient-to-r from-red-600 to-red-400 shadow-[0_0_10px_rgba(239,68,68,0.6)] animate-pulse',
      }
    default:
      return {
        bar: 'bg-gradient-to-r from-orange-600 to-orange-400',
      }
  }
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

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function calculateBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const y = Math.sin(dLng) * Math.cos((lat2 * Math.PI) / 180)
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.cos(dLng)
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}

function buildRoute(waypoints: [number, number][]): { route: [number, number][]; totalDistance: number } {
  const route: [number, number][] = [waypoints[0]]
  let totalDistance = 0

  for (let i = 0; i < waypoints.length - 1; i++) {
    const [lat1, lng1] = waypoints[i]
    const [lat2, lng2] = waypoints[i + 1]
    const dist = haversineDistance(lat1, lng1, lat2, lng2)
    totalDistance += dist

    const segments = Math.max(Math.ceil(dist / 5), 1)
    for (let s = 1; s <= segments; s++) {
      const t = s / segments
      route.push([
        lat1 + (lat2 - lat1) * t,
        lng1 + (lng2 - lng1) * t,
      ])
    }
  }

  return { route, totalDistance }
}

function getPositionAlongRoute(route: [number, number][], progress: number): { pos: [number, number]; bearing: number; segmentIndex: number } {
  if (route.length === 0) return { pos: [0, 0], bearing: 0, segmentIndex: 0 }
  if (route.length === 1) return { pos: route[0], bearing: 0, segmentIndex: 0 }

  const totalSegments = route.length - 1
  const targetSegment = (progress / 100) * totalSegments
  const segmentIndex = Math.min(Math.floor(targetSegment), totalSegments - 1)
  const segmentT = targetSegment - segmentIndex

  const [lat1, lng1] = route[segmentIndex]
  const [lat2, lng2] = route[segmentIndex + 1]

  const pos: [number, number] = [
    lat1 + (lat2 - lat1) * segmentT,
    lng1 + (lng2 - lng1) * segmentT,
  ]

  const bearing = calculateBearing(lat1, lng1, lat2, lng2)

  return { pos, bearing, segmentIndex }
}

const LIMA: [number, number] = [-12.046373, -77.042754]
const LIMA_NORTE: [number, number] = [-11.997399, -77.070756]
const AREQUIPA: [number, number] = [-16.409047, -71.537451]
const CUSCO: [number, number] = [-13.531950, -71.967463]
const TRUJILLO: [number, number] = [-8.112782, -79.028370]

const LIMA_AREQUIPA_WAYPOINTS: [number, number][] = [
  LIMA, [-12.5, -77.2], [-13.5, -75.8], [-14.5, -74.5], [-15.5, -73.2], [-16.0, -72.2], AREQUIPA,
]
const LIMA_TRUJILLO_WAYPOINTS: [number, number][] = [
  LIMA, [-11.5, -77.5], [-10.8, -78.2], [-10.0, -78.6], [-9.2, -78.9], TRUJILLO,
]
const AREQUIPA_CUSCO_WAYPOINTS: [number, number][] = [
  AREQUIPA, [-15.8, -71.8], [-14.8, -71.9], [-14.2, -71.95], CUSCO,
]
const LIMA_LIMA_NORTE_WAYPOINTS: [number, number][] = [
  LIMA, [-12.02, -77.05], LIMA_NORTE,
]
const AREQUIPA_LIMA_WAYPOINTS: [number, number][] = [
  AREQUIPA, [-15.5, -73.2], [-14.5, -74.5], [-13.5, -75.8], [-12.5, -77.2], LIMA,
]

function createVehicleData(
  id: string,
  type: VehicleType,
  driver: string,
  plate: string,
  origin: string,
  destination: string,
  cargo: string,
  cargoQty: number,
  waypoints: [number, number][],
  initialProgress: number,
  status: VehicleStatus,
  departureTime: string,
): Vehicle {
  const { route, totalDistance } = buildRoute(waypoints)
  const { pos, bearing } = getPositionAlongRoute(route, initialProgress)
  const speedRange = VEHICLE_SPEEDS[type]
  const baseSpeed = (speedRange.min + speedRange.max) / 2
  const traveledKm = (totalDistance * initialProgress) / 100
  const remainingKm = totalDistance - traveledKm
  const remainingHours = remainingKm / baseSpeed
  const remainingMin = Math.round(remainingHours * 60)

  let eta: string
  if (status === 'entregado') {
    eta = 'Entregado'
  } else if (status === 'pendiente') {
    eta = 'Pendiente'
  } else if (remainingMin > 60) {
    eta = `${Math.floor(remainingMin / 60)}h ${remainingMin % 60}min`
  } else {
    eta = `${remainingMin}min`
  }

  return {
    id,
    type,
    driver,
    origin,
    destination,
    cargo,
    cargoQty,
    status,
    progress: initialProgress,
    eta,
    plate,
    speed: status === 'en_transito' ? baseSpeed : 0,
    distanceKm: totalDistance,
    traveledKm,
    route,
    currentPos: pos,
    bearing,
    departureTime,
  }
}

const INITIAL_VEHICLES: Vehicle[] = [
  createVehicleData('SHP-001', 'truck', 'Carlos Mendoza', 'NK-2024-A', 'Lima', 'Arequipa', 'Air Jordan 1 Mid', 150, LIMA_AREQUIPA_WAYPOINTS, 65, 'en_transito', '08:30'),
  createVehicleData('SHP-002', 'van', 'Ana Quispe', 'NK-1819-B', 'Lima', 'Trujillo', 'Nike Pegasus 40', 80, LIMA_TRUJILLO_WAYPOINTS, 35, 'en_transito', '09:15'),
  createVehicleData('SHP-003', 'truck', 'José Rivas', 'NK-3344-C', 'Arequipa', 'Cusco', 'Nike Air Max 90', 200, AREQUIPA_CUSCO_WAYPOINTS, 0, 'pendiente', '14:00'),
  createVehicleData('SHP-004', 'bike', 'Pedro Solís', 'NK-5566-D', 'Lima', 'Lima Norte', 'Nike Dunk Low', 25, LIMA_LIMA_NORTE_WAYPOINTS, 80, 'en_transito', '10:45'),
  createVehicleData('SHP-005', 'truck', 'María Flores', 'NK-7788-E', 'Lima', 'Trujillo', 'Nike ZoomX Vaporfly', 120, LIMA_TRUJILLO_WAYPOINTS, 100, 'entregado', '06:00'),
  createVehicleData('SHP-006', 'van', 'Luis Gómez', 'NK-9900-F', 'Arequipa', 'Lima', 'Nike Metcon 7', 60, AREQUIPA_LIMA_WAYPOINTS, 45, 'retrasado', '07:30'),
  createVehicleData('SHP-007', 'truck', 'Rosa Díaz', 'NK-1122-G', 'Lima', 'Cusco', 'Nike Blazer Mid', 90, [...LIMA_AREQUIPA_WAYPOINTS.slice(0, -1), ...AREQUIPA_CUSCO_WAYPOINTS], 20, 'en_transito', '11:00'),
  createVehicleData('SHP-008', 'van', 'Miguel Torres', 'NK-3344-H', 'Trujillo', 'Lima', 'Nike Air Force 1', 70, [...LIMA_TRUJILLO_WAYPOINTS].reverse(), 50, 'en_transito', '09:30'),
]

function createSedeIcon(color: string, status: string) {
  const pulseClass = status === 'critical' ? 'animate-pulse' : ''
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

function createVehicleIcon(color: string, type: string, bearing: number) {
  const icons: Record<string, string> = {
    truck: '🚚',
    van: '🚐',
    bike: '🏍️',
  }
  return L.divIcon({
    className: 'custom-vehicle-marker',
    html: `
      <div style="position: relative; width: 36px; height: 36px; transform: rotate(${bearing}deg);">
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

function AutoFit({ sedes }: { sedes: Sede[] }) {
  const map = useMap()
  useEffect(() => {
    const bounds = L.latLngBounds(sedes.map((s) => [s.lat, s.lng] as [number, number]))
    map.fitBounds(bounds, { padding: [40, 40] })
  }, [map, sedes])
  return null
}

function FlyToVehicle({ vehicle }: { vehicle: { currentPos: [number, number] } | null }) {
  const map = useMap()
  useEffect(() => {
    if (vehicle) {
      map.flyTo(vehicle.currentPos, 8, { duration: 1 })
    }
  }, [map, vehicle])
  return null
}

export const TrackingPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES)
  const [selectedSede, setSelectedSede] = useState<Sede | null>(null)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [flyToVehicle, setFlyToVehicle] = useState<Vehicle | null>(null)
  const updateCountRef = useRef(0)

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
      updateCountRef.current += 1
      setVehicles((prev) =>
        prev.map((v) => {
          if (v.status === 'entregado' || v.status === 'pendiente') return v

          const speedRange = VEHICLE_SPEEDS[v.type]
          const speedVariation = speedRange.min + Math.random() * (speedRange.max - speedRange.min)
          const isRetrasado = v.status === 'retrasado'
          const effectiveSpeed = isRetrasado ? speedVariation * 0.4 : speedVariation

          const distancePerTick = (effectiveSpeed * 3) / 3600
          const progressIncrement = (distancePerTick / v.distanceKm) * 100
          const newProgress = Math.min(v.progress + progressIncrement, 100)

          if (newProgress >= 100) {
            return {
              ...v,
              progress: 100,
              status: 'entregado' as const,
              eta: 'Entregado',
              speed: 0,
              traveledKm: v.distanceKm,
              currentPos: v.route[v.route.length - 1],
            }
          }

          const { pos, bearing } = getPositionAlongRoute(v.route, newProgress)
          const newTraveledKm = (v.distanceKm * newProgress) / 100
          const remainingKm = v.distanceKm - newTraveledKm
          const remainingHours = remainingKm / effectiveSpeed
          const remainingMin = Math.round(remainingHours * 60)

          const eta = remainingMin > 60
            ? `${Math.floor(remainingMin / 60)}h ${remainingMin % 60}min`
            : `${remainingMin}min`

          return {
            ...v,
            progress: newProgress,
            currentPos: pos,
            bearing,
            speed: Math.round(effectiveSpeed),
            traveledKm: newTraveledKm,
            eta: isRetrasado ? `${eta} (retraso)` : eta,
          }
        }),
      )
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const filteredVehicles = (filter === 'all'
    ? vehicles
    : vehicles.filter((v) => v.status === filter)
  ).filter((v) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      v.id.toLowerCase().includes(q) ||
      v.driver.toLowerCase().includes(q) ||
      v.cargo.toLowerCase().includes(q) ||
      v.plate.toLowerCase().includes(q)
    )
  })

  const stats = {
    total: vehicles.length,
    enTransito: vehicles.filter((v) => v.status === 'en_transito').length,
    entregados: vehicles.filter((v) => v.status === 'entregado').length,
    retrasados: vehicles.filter((v) => v.status === 'retrasado').length,
    pendientes: vehicles.filter((v) => v.status === 'pendiente').length,
  }

  const totalDistance = vehicles.reduce((sum, v) => sum + v.distanceKm, 0)
  const totalTraveled = vehicles.reduce((sum, v) => sum + v.traveledKm, 0)
  const avgSpeed = vehicles
    .filter((v) => v.status === 'en_transito')
    .reduce((sum, v, _, arr) => sum + v.speed / arr.length, 0)

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 lg:gap-3">
        {[
          { label: 'Total Envíos', value: stats.total, icon: <Package className="w-4 h-4" />, color: 'text-white', iconBg: 'bg-nikeOrange/10 border border-nikeOrange/20 text-nikeOrange' },
          { label: 'En Tránsito', value: stats.enTransito, icon: <Truck className="w-4 h-4" />, color: 'text-cyan-400', iconBg: 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400' },
          { label: 'Entregados', value: stats.entregados, icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-emerald-400', iconBg: 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' },
          { label: 'Retrasados', value: stats.retrasados, icon: <AlertCircle className="w-4 h-4" />, color: 'text-red-400', iconBg: 'bg-red-500/10 border border-red-500/20 text-red-400' },
          { label: 'Distancia Total', value: `${totalDistance.toFixed(0)} km`, icon: <RouteIcon className="w-4 h-4" />, color: 'text-white', iconBg: 'bg-purple-500/10 border border-purple-500/20 text-purple-400' },
          { label: 'Recorrido', value: `${totalTraveled.toFixed(0)} km`, icon: <Activity className="w-4 h-4" />, color: 'text-emerald-400', iconBg: 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' },
          { label: 'Vel. Promedio', value: `${Math.round(avgSpeed)} km/h`, icon: <Gauge className="w-4 h-4" />, color: 'text-cyan-400', iconBg: 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400' },
        ].map((s, i) => (
          <MetricCard
            key={s.label}
            label={s.label}
            value={s.value}
            icon={s.icon}
            color={s.color}
            iconBg={s.iconBg}
            index={i}
            compact
            animate
          />
        ))}
      </div>

      {/* Map + Sede details */}
      <div className="relative">
        <Card
          title="Mapa de Sedes — Nike Perú"
          icon={<MapPin className="w-5 h-5 text-nikeOrange" />}
        >
          <div className="rounded-2xl overflow-hidden border border-white/5" style={{ height: '550px' }}>
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
              <FlyToVehicle vehicle={flyToVehicle} />

              {vehicles
                .filter((v) => v.status === 'en_transito' || v.status === 'retrasado')
                .map((v) => (
                  <Polyline
                    key={`route-full-${v.id}`}
                    positions={v.route}
                    pathOptions={{
                      color: statusConfig[v.status].color,
                      weight: 2,
                      opacity: 0.2,
                      dashArray: '5, 8',
                    }}
                  />
                ))}

              {vehicles
                .filter((v) => v.status === 'en_transito' || v.status === 'retrasado')
                .map((v) => {
                  const { segmentIndex } = getPositionAlongRoute(v.route, v.progress)
                  const traveledPath = v.route.slice(0, segmentIndex + 1)
                  const { pos } = getPositionAlongRoute(v.route, v.progress)
                  traveledPath.push(pos)
                  return (
                    <Polyline
                      key={`route-traveled-${v.id}`}
                      positions={traveledPath}
                      pathOptions={{
                        color: statusConfig[v.status].color,
                        weight: 3,
                        opacity: 0.8,
                      }}
                    />
                  )
                })}

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

              {vehicles
                .filter((v) => v.status === 'en_transito' || v.status === 'retrasado')
                .map((v) => (
                  <Marker
                    key={`vehicle-${v.id}`}
                    position={v.currentPos}
                    icon={createVehicleIcon(statusConfig[v.status].color, v.type, v.bearing)}
                    zIndexOffset={1000}
                  >
                    <Popup>
                      <div style={{ minWidth: '180px' }}>
                        <strong>{v.id}</strong> — {v.plate}
                        <br />
                        <span style={{ color: '#999', fontSize: '12px' }}>{v.origin} → {v.destination}</span>
                        <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '8px 0' }} />
                        <div style={{ fontSize: '12px' }}>
                          <div>👤 {v.driver}</div>
                          <div>📦 {v.cargo} ({v.cargoQty} u.)</div>
                          <div>⏱️ ETA: {v.eta}</div>
                          <div>📊 Progreso: {Math.round(v.progress)}%</div>
                          <div>🛣️ {v.traveledKm.toFixed(1)}/{v.distanceKm.toFixed(0)} km</div>
                          <div>⚡ {v.speed} km/h</div>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
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
              <Navigation className="w-3 h-3 text-cyan-400" />
              Ruta de envío
            </div>
          </div>
        </Card>

        {/* Floating sede panel overlay */}
        <div className="absolute top-4 right-4 z-[1000] w-80 max-h-[510px] overflow-y-auto rounded-xl bg-black/80 backdrop-blur-md border border-white/10 shadow-xl">
          <div className="p-4">
            {selectedSede ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white/90">{selectedSede.name}</h3>
                  <Badge variant={sedeStatusConfig[selectedSede.status].variant}>
                    {sedeStatusConfig[selectedSede.status].label}
                  </Badge>
                </div>
                <p className="text-xs text-white/40">{selectedSede.city}</p>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl bg-white/5">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">Stock</p>
                    <p className="text-base font-bold text-white/90">{selectedSede.stock.toLocaleString()}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">Capacidad</p>
                    <p className="text-base font-bold text-white/90">{selectedSede.capacity.toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-white/60">
                    <User className="w-3 h-3 text-white/30" />
                    {selectedSede.manager}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/60">
                    <Package className="w-3 h-3 text-white/30" />
                    {selectedSede.phone}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-white/40 mb-1">
                    <span>Utilización</span>
                    <span>{Math.round((selectedSede.stock / selectedSede.capacity) * 100)}%</span>
                  </div>
                  <Progress
                    value={(selectedSede.stock / selectedSede.capacity) * 100}
                    indicatorClassName=""
                  />
                </div>

                <Button variant="ghost" size="sm" className="w-full" onClick={() => setSelectedSede(null)}>
                  ← Volver
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-white/40 mb-3">
                  Haz clic en un marcador del mapa o en una sede para ver detalles.
                </p>
                {SEDES.map((sede) => (
                  <button
                    key={sede.id}
                    onClick={() => setSelectedSede(sede)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ background: sedeStatusConfig[sede.status].color }}
                      />
                      <div>
                        <p className="text-xs font-semibold text-white/90">{sede.city}</p>
                        <p className="text-[10px] text-white/40">{sede.stock.toLocaleString()} u.</p>
                      </div>
                    </div>
                    <MapPin className="w-3.5 h-3.5 text-white/30 shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Vehicles list */}
      <Card
        title="Vehículos y Envíos"
        icon={<Truck className="w-5 h-5 text-nikeOrange" />}
        action={
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="Buscar por ID, conductor, carga..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-52 pl-9 pr-8 py-1.5 text-xs rounded-xl bg-white/5 border border-white/10 text-white/90 placeholder-white/30 focus:outline-none focus:border-nikeOrange/50 transition-colors"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        }
      >
        <Tabs defaultValue="all" onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="all">Todos ({stats.total})</TabsTrigger>
            <TabsTrigger value="en_transito">Tránsito ({stats.enTransito})</TabsTrigger>
            <TabsTrigger value="pendiente">Pendiente ({stats.pendientes})</TabsTrigger>
            <TabsTrigger value="entregado">Entregado ({stats.entregados})</TabsTrigger>
            <TabsTrigger value="retrasado">Retrasado ({stats.retrasados})</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-3 mt-4">
          {filteredVehicles.length === 0 && searchQuery && (
            <p className="text-xs text-white/40 text-center py-6">No se encontraron vehículos con esa búsqueda.</p>
          )}
          <AnimatePresence>
            {filteredVehicles.map((vehicle) => {
              const status = statusConfig[vehicle.status]
              const customStyles = getStatusStyles(vehicle.status)
              return (
                <motion.div
                  key={vehicle.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onClick={() => {
                    setSelectedVehicle(vehicle)
                    setFlyToVehicle(vehicle)
                  }}
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

                  <div className="mb-3 w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${customStyles.bar}`} 
                      style={{ width: `${vehicle.progress}%` }} 
                    />
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
                    <span className="flex items-center gap-1">
                      <RouteIcon className="w-3 h-3" /> {vehicle.traveledKm.toFixed(0)}/{vehicle.distanceKm.toFixed(0)} km
                    </span>
                    {vehicle.speed > 0 && (
                      <span className="flex items-center gap-1">
                        <Gauge className="w-3 h-3" /> {vehicle.speed} km/h
                      </span>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </Card>

      {/* Vehicle detail modal */}
      <Dialog open={!!selectedVehicle} onOpenChange={(open) => !open && setSelectedVehicle(null)}>
        <DialogContent className="max-w-md">
          {selectedVehicle && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-white/5 text-nikeOrange">
                      {vehicleIconMap[selectedVehicle.type]}
                    </div>
                    <div>
                      <DialogTitle>{selectedVehicle.id}</DialogTitle>
                      <DialogDescription>{selectedVehicle.plate}</DialogDescription>
                    </div>
                  </div>
                  <Badge variant={statusConfig[selectedVehicle.status].variant}>
                    {statusConfig[selectedVehicle.status].label}
                  </Badge>
                </div>
              </DialogHeader>

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
                    <p className="text-xs text-white/40 uppercase tracking-wider">Salida</p>
                    <p className="text-sm font-semibold text-white/90">{selectedVehicle.departureTime}</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/5">
                  <p className="text-xs text-white/40 uppercase tracking-wider">Carga</p>
                  <p className="text-sm font-semibold text-white/90">
                    {selectedVehicle.cargo} — {selectedVehicle.cargoQty} unidades
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-white/5 text-center">
                    <p className="text-xs text-white/40 uppercase tracking-wider">ETA</p>
                    <p className="text-sm font-semibold text-white/90">{selectedVehicle.eta}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 text-center">
                    <p className="text-xs text-white/40 uppercase tracking-wider">Distancia</p>
                    <p className="text-sm font-semibold text-white/90">{selectedVehicle.distanceKm.toFixed(0)} km</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 text-center">
                    <p className="text-xs text-white/40 uppercase tracking-wider">Velocidad</p>
                    <p className="text-sm font-semibold text-white/90">{selectedVehicle.speed} km/h</p>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-white/40 mb-1">
                    <span>Progreso del viaje</span>
                    <span>{Math.round(selectedVehicle.progress)}% — {selectedVehicle.traveledKm.toFixed(1)} km recorridos</span>
                  </div>
                  <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${getStatusStyles(selectedVehicle.status).bar}`} 
                      style={{ width: `${selectedVehicle.progress}%` }} 
                    />
                  </div>
                </div>

                <Button variant="secondary" className="w-full" onClick={() => setSelectedVehicle(null)}>
                  Cerrar
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
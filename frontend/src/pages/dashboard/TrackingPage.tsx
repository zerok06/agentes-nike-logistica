import React from 'react'
import { MapPin, Truck, Package, Clock, Navigation } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'

const MOCK_SHIPMENTS = [
  {
    id: 'SHP-001',
    origin: 'Almacén Central Lima',
    destination: 'Retail Miraflores',
    status: 'en_transito',
    eta: '2h 30min',
    progress: 65,
    driver: 'Carlos Mendoza',
    vehicle: 'Camión NK-2024',
  },
  {
    id: 'SHP-002',
    origin: 'Almacén Callao',
    destination: 'Retail Arequipa',
    status: 'pendiente',
    eta: '8h 15min',
    progress: 0,
    driver: 'Ana Quispe',
    vehicle: 'Furgoneta NK-1819',
  },
  {
    id: 'SHP-003',
    origin: 'Almacén Central Lima',
    destination: 'Retail Trujillo',
    status: 'entregado',
    eta: 'Completado',
    progress: 100,
    driver: 'José Rivas',
    vehicle: 'Camión NK-3344',
  },
  {
    id: 'SHP-004',
    origin: 'Almacén Callao',
    destination: 'Retail Chiclayo',
    status: 'en_transito',
    eta: '4h 45min',
    progress: 35,
    driver: 'María Flores',
    vehicle: 'Furgoneta NK-5566',
  },
]

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'neutral' }> = {
  en_transito: { label: 'En Tránsito', variant: 'info' },
  pendiente: { label: 'Pendiente', variant: 'warning' },
  entregado: { label: 'Entregado', variant: 'success' },
}

export const TrackingPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Map placeholder */}
      <Card
        title="Mapa de Tracking en Tiempo Real"
        icon={<MapPin className="w-5 h-5 text-nikeOrange" />}
      >
        <div className="relative h-[400px] rounded-2xl bg-gradient-to-br from-white/5 to-white/2 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="w-full h-full" style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: '40px 40px',
            }} />
          </div>
          <div className="text-center z-10">
            <Navigation className="w-16 h-16 text-nikeOrange/30 mx-auto mb-4" />
            <p className="text-white/40 text-sm">
              Integración con Leaflet/Mapbox pendiente
            </p>
            <p className="text-white/30 text-xs mt-2">
              Visualización GPS de envíos en tiempo real
            </p>
          </div>

          {/* Mock markers */}
          <div className="absolute top-1/4 left-1/4 w-4 h-4 rounded-full bg-nikeOrange animate-pulse" />
          <div className="absolute top-1/2 right-1/3 w-4 h-4 rounded-full bg-green-500 animate-pulse" />
          <div className="absolute bottom-1/4 left-1/2 w-4 h-4 rounded-full bg-yellow-500 animate-pulse" />
        </div>
      </Card>

      {/* Shipments list */}
      <Card
        title="Envíos Activos"
        icon={<Truck className="w-5 h-5 text-nikeOrange" />}
      >
        <div className="space-y-4">
          {MOCK_SHIPMENTS.map((shipment) => {
            const status = statusConfig[shipment.status]
            return (
              <div
                key={shipment.id}
                className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Package className="w-4 h-4 text-nikeOrange" />
                      <span className="font-mono text-sm font-bold text-white/90">
                        {shipment.id}
                      </span>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                    <p className="text-xs text-white/50">
                      {shipment.origin} → {shipment.destination}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-xs text-white/40">
                      <Clock className="w-3 h-3" />
                      {shipment.eta}
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-nikeOrange transition-all"
                      style={{ width: `${shipment.progress}%` }}
                    />
                  </div>
                </div>

                {/* Driver info */}
                <div className="flex items-center gap-4 text-xs text-white/40">
                  <span>Conductor: <strong className="text-white/70">{shipment.driver}</strong></span>
                  <span>Vehículo: <strong className="text-white/70">{shipment.vehicle}</strong></span>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

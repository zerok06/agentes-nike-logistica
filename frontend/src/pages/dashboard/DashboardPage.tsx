import React, { useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import { DashboardFilterBar } from '../../components/dashboard/DashboardFilterBar'
import { KpiGrid } from '../../components/dashboard/KpiGrid'
import { TrendChart } from '../../components/dashboard/TrendChart'
import { StockChart } from '../../components/dashboard/StockChart'
import { AlertsPanel } from '../../components/dashboard/AlertsPanel'
import { ShipmentDonut } from '../../components/dashboard/ShipmentDonut'
import { DashboardFilterProvider } from '../../context/DashboardFilterContext'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
}

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.4, 0.25, 1] },
  },
}

const DashboardContent: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false)
  const [nextRefresh, setNextRefresh] = useState(30)

  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1500)
  }, [])

  useEffect(() => {
    const countdown = setInterval(() => {
      setNextRefresh((n) => Math.max(0, n - 1))
    }, 1000)
    return () => clearInterval(countdown)
  }, [])

  return (
    <motion.div
      variants={containerVariants}
      initial={false}
      animate="visible"
      className="space-y-6 lg:space-y-8"
    >
      {/* Cabecera del Dashboard */}
      <motion.div
        variants={sectionVariants}
        className="flex items-center justify-between border-b border-white/10 pb-5"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse shadow-[0_0_10px_#f97316]" />
            <span className="text-xs font-bold tracking-widest text-orange-400 uppercase">Centro de Inteligencia Logística</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white">Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">Métricas estratégicas de inventario, flujos y control operativo en tiempo real</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-[10px] text-white/40 font-mono">
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-orange-400' : ''}`} />
            {nextRefresh > 0 ? `${nextRefresh}s` : 'refrescando...'}
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all disabled:opacity-50 border border-white/10"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </motion.div>

      {/* Barra de Filtros */}
      <motion.div variants={sectionVariants}>
        <DashboardFilterBar refreshing={refreshing} onRefresh={handleRefresh} nextRefresh={nextRefresh} />
      </motion.div>

      {/* Tarjetas KPI Superiores */}
      <motion.div variants={sectionVariants} key={`kpi-${refreshing}`}>
        <KpiGrid />
      </motion.div>

      {/* Fila 1: Gráfico de Tendencia (TrendChart) en ancho completo o adaptado */}
      <motion.div variants={sectionVariants}>
        <TrendChart />
      </motion.div>

      {/* Fila 2: Nuestro nuevo StockChart interactivo (Ocupa todo el ancho para que respire con el gráfico circular) */}
      <motion.div variants={sectionVariants}>
        <StockChart />
      </motion.div>

      {/* Fila 3: Alertas y Donut de Envíos en dos columnas equilibradas */}
      <motion.div
        variants={sectionVariants}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <AlertsPanel />
        <ShipmentDonut />
      </motion.div>
    </motion.div>
  )
}

export const DashboardPage: React.FC = () => {
  return (
    <DashboardFilterProvider>
      <DashboardContent />
    </DashboardFilterProvider>
  )
}
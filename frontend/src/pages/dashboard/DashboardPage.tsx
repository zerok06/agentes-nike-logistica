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
      className="space-y-4 lg:space-y-6"
    >
      <motion.div
        variants={sectionVariants}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Dashboard Ejecutivo</h1>
          <p className="text-sm text-white/40 mt-1">Métricas estratégicas de inventario y logística</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-[10px] text-white/30">
            <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
            {nextRefresh > 0 ? `${nextRefresh}s` : 'refrescando...'}
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </motion.div>

      <motion.div variants={sectionVariants}>
        <DashboardFilterBar refreshing={refreshing} onRefresh={handleRefresh} nextRefresh={nextRefresh} />
      </motion.div>

      <motion.div variants={sectionVariants} key={`kpi-${refreshing}`}>
        <KpiGrid />
      </motion.div>

      <motion.div
        variants={sectionVariants}
        className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6"
      >
        <TrendChart />
        <StockChart />
      </motion.div>

      <motion.div
        variants={sectionVariants}
        className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6"
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

import React from 'react'
import { motion } from 'framer-motion'
import { Card } from '../ui/card'
import { cn } from '../../lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { AnimatedCounter } from './AnimatedCounter'
import { Sparkline } from './Sparkline'

interface MetricCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  color?: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  subtitle?: string
  iconBg?: string
  animate?: boolean
  sparklineData?: { value: number }[]
  index?: number
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.06,
      duration: 0.5,
      ease: [0.25, 0.4, 0.25, 1],
    },
  }),
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  icon,
  color = 'text-white/90',
  trend,
  trendValue,
  subtitle,
  iconBg = 'bg-white/5',
  animate = true,
  sparklineData,
  index = 0,
}) => {
  const numericValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]/g, ''))
  const isNumeric = !isNaN(numericValue)

  const content = (
    <Card className="p-4 lg:p-5 group hover:scale-[1.02] transition-transform duration-300">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] lg:text-xs text-white/40 uppercase tracking-wider font-semibold truncate">
            {label}
          </p>
          <p className={cn('text-xl lg:text-3xl font-bold mt-1', color)}>
            {isNumeric && animate ? (
              <AnimatedCounter value={numericValue} format={typeof value === 'string' && value.includes('$')} />
            ) : (
              value
            )}
          </p>
          {subtitle && (
            <p className="text-[10px] text-white/30 mt-0.5">{subtitle}</p>
          )}
          {trend && trendValue && (
            <div className="flex items-center gap-1 mt-2">
              {trend === 'up' && <TrendingUp className="w-3 h-3 text-green-400" />}
              {trend === 'down' && <TrendingDown className="w-3 h-3 text-red-400" />}
              {trend === 'neutral' && <Minus className="w-3 h-3 text-white/30" />}
              <span
                className={cn(
                  'text-[10px] font-semibold',
                  trend === 'up' && 'text-green-400',
                  trend === 'down' && 'text-red-400',
                  trend === 'neutral' && 'text-white/30',
                )}
              >
                {trendValue}
              </span>
            </div>
          )}
          {sparklineData && (
            <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Sparkline data={sparklineData} color={color === 'text-red-400' ? '#FF6B6B' : '#FA5400'} />
            </div>
          )}
        </div>
        <div className={cn('w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center shrink-0', iconBg)}>
          {icon}
        </div>
      </div>
    </Card>
  )

  if (animate) {
    return (
      <motion.div
        custom={index}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
      >
        {content}
      </motion.div>
    )
  }

  return content
}

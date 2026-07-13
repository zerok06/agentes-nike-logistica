import React from 'react'
import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'success' | 'danger' | 'warning' | 'info' | 'neutral'
  className?: string
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  className,
}) => {
  const variantClasses = {
    success: 'bg-green-500/10 text-green-400 border border-green-500/20',
    danger: 'bg-red-500/10 text-red-400 border border-red-500/20',
    warning: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
    info: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    neutral: 'bg-white/5 text-white/60 border border-white/10',
  }

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold',
          variantClasses[variant],
        ),
        className,
      )}
    >
      {children}
    </span>
  )
}

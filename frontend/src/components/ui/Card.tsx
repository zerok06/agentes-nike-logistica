import React from 'react'
import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'

interface CardProps {
  children: React.ReactNode
  className?: string
  title?: string
  icon?: React.ReactNode
  action?: React.ReactNode
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  title,
  icon,
  action,
}) => {
  return (
    <div
      className={twMerge(
        clsx('rounded-3xl glass-panel p-6 shadow-xl relative overflow-hidden'),
        className,
      )}
    >
      {(title || action) && (
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            {icon}
            {title && (
              <h2 className="text-lg font-bold tracking-tight text-white/90">
                {title}
              </h2>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  )
}

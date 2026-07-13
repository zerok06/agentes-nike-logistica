import React from 'react'
import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-xs text-white/40 uppercase tracking-wider font-semibold">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={twMerge(
              clsx(
                'w-full bg-background border border-white/10 rounded-xl p-2.5 text-sm text-white focus:border-nikeOrange outline-none transition-colors',
                icon && 'pl-10',
                error && 'border-red-500/50',
              ),
              className,
            )}
            {...props}
          />
        </div>
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>
    )
  }
)

Input.displayName = 'Input'

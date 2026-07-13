import React from 'react'
import { Loader2 } from 'lucide-react'
import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-bold uppercase tracking-widest rounded-xl transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed'

  const variantClasses = {
    primary:
      'bg-nikeOrange hover:bg-nikeOrange/90 text-white hover:shadow-lg hover:shadow-nikeOrange/20',
    secondary:
      'bg-white/5 border border-white/10 hover:bg-white/10 text-white/90',
    ghost: 'hover:bg-white/5 text-white/70 hover:text-white',
    danger:
      'bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400',
  }

  const sizeClasses = {
    sm: 'text-xs px-3 py-2',
    md: 'text-sm px-4 py-3',
    lg: 'text-base px-6 py-4',
  }

  return (
    <button
      className={twMerge(
        clsx(baseClasses, variantClasses[variant], sizeClasses[size], className),
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  )
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost'
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  const base =
    'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
  const variants = {
    primary:
      'bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200',
    ghost:
      'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800',
  }
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />
}

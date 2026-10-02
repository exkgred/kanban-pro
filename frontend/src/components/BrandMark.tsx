interface BrandMarkProps {
  size?: number
  className?: string
  wordmark?: boolean
}

export function BrandMark({ size = 32, className, wordmark = true }: BrandMarkProps) {
  return (
    <span className={['inline-flex items-center gap-2 font-semibold tracking-tight', className].filter(Boolean).join(' ')}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        aria-hidden="true"
        className="shrink-0"
        style={{ width: size, height: size }}
      >
        <rect width="32" height="32" rx="8" fill="#6d28d9" />
        <rect x="6.2" y="8" width="5.2" height="16" rx="1.4" fill="white" opacity="0.95" />
        <rect x="13.4" y="8" width="5.2" height="10.5" rx="1.4" fill="#ddd6fe" />
        <rect x="20.6" y="8" width="5.2" height="13.4" rx="1.4" fill="white" opacity="0.8" />
      </svg>
      {wordmark ? <span>KanbanPro</span> : null}
    </span>
  )
}

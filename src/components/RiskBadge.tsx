import type { RiskLevel } from '../types'

interface Props { level: RiskLevel; showLabel?: boolean }

const config = {
  high:   { dot: 'bg-risk-high',  bg: 'bg-risk-high-bg  text-risk-high',  label: 'Alto riesgo',  icon: '●' },
  medium: { dot: 'bg-risk-med',   bg: 'bg-risk-med-bg   text-risk-med',   label: 'Riesgo medio', icon: '◐' },
  low:    { dot: 'bg-risk-low',   bg: 'bg-risk-low-bg   text-risk-low',   label: 'Estable',      icon: '●' },
}

export default function RiskBadge({ level, showLabel = true }: Props) {
  if (!level) return <span className="text-usb-faint text-xs font-mono">—</span>
  const c = config[level]
  return (
    <span className={`pill-badge ${c.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {showLabel && c.label}
    </span>
  )
}

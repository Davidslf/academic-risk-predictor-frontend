import type { GradeComponent, RiskLevel } from '../types'

export function calcWeightedTotal(
  gradeMap: Record<string, number | null>,
  components: GradeComponent[]
): number | null {
  const totalPct = components.reduce((s, c) => s + c.percentage, 0)
  if (totalPct === 0) return null
  let weighted = 0, covered = 0
  for (const c of components) {
    const g = gradeMap[c.id]
    if (g !== null && g !== undefined) {
      weighted += g * (c.percentage / totalPct)
      covered += c.percentage
    }
  }
  if (covered === 0) return null
  return Math.round(weighted * 100) / 100
}

export function getRisk(total: number | null): RiskLevel {
  if (total === null) return null
  if (total < 3.0) return 'high'
  if (total <= 3.7) return 'medium'
  return 'low'
}

export function gradeColor(value: number | null): string {
  if (value === null) return 'text-usb-faint'
  if (value < 3.0) return 'text-risk-high'
  if (value < 4.0) return 'text-amber-600'
  return 'text-risk-low'
}

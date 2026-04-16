import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react'
import type { GradeComponent } from '../types'

interface Props {
  components: GradeComponent[]
  onChange: (c: GradeComponent[]) => void
}

export default function ComponentsConfig({ components, onChange }: Props) {
  const total = components.reduce((s, c) => s + c.percentage, 0)
  const valid = total === 40

  const update = (id: string, field: keyof GradeComponent, val: string | number) =>
    onChange(components.map(c => c.id === id ? { ...c, [field]: field === 'percentage' ? Number(val) : val } : c))

  const remove = (id: string) => onChange(components.filter(c => c.id !== id))

  const add = () => onChange([...components, {
    id: `comp-${Date.now()}`,
    name: 'Nuevo componente',
    percentage: Math.max(0, 40 - total),
  }])

  const fillPct = Math.min(100, (total / 40) * 100)
  const over = total > 40

  return (
    <div className="space-y-4">
      {/* Validation banner */}
      <div className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm ${
        valid ? 'bg-risk-low-bg text-risk-low border border-green-200'
        : over ? 'bg-risk-high-bg text-risk-high border border-red-200'
        : 'bg-risk-med-bg text-risk-med border border-amber-200'
      }`}>
        <div className="flex items-center gap-2 font-semibold">
          {valid ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          {valid ? 'Distribución válida: suma exactamente 40%'
          : over ? `Excede el límite: ${total}% (máximo 40%)`
          : `Faltan ${40 - total}% por asignar (total: ${total}/40%)`}
        </div>
        <div className="flex items-center gap-2">
          <div className="w-28 h-2 bg-white/60 rounded-full overflow-hidden">
            <motion.div
              animate={{ width: `${fillPct}%` }}
              className={`h-full rounded-full ${valid ? 'bg-risk-low' : over ? 'bg-risk-high' : 'bg-risk-med'}`}
            />
          </div>
          <span className="font-bold font-mono text-xs">{total}/40</span>
        </div>
      </div>

      {/* Components list */}
      <div className="space-y-2">
        <AnimatePresence>
          {components.map((comp) => (
            <motion.div
              key={comp.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-3 bg-usb-canvas rounded-xl px-4 py-3 border border-usb-border"
            >
              <div className="w-2 h-8 bg-usb-orange/30 rounded-full" />
              <input
                type="text"
                value={comp.name}
                onChange={e => update(comp.id, 'name', e.target.value)}
                className="flex-1 bg-transparent text-[0.85rem] font-medium text-usb-subtle focus:outline-none"
              />
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={0} max={40} step={1}
                  value={comp.percentage}
                  onChange={e => update(comp.id, 'percentage', e.target.value)}
                  className="w-14 text-center font-mono font-bold text-[0.85rem] border border-usb-border rounded-lg py-1 bg-white focus:outline-none focus:border-usb-orange focus:ring-2 focus:ring-usb-orange/20"
                />
                <span className="text-usb-muted text-xs font-semibold">%</span>
              </div>
              <button
                onClick={() => remove(comp.id)}
                className="p-1.5 text-usb-faint hover:text-risk-high hover:bg-risk-high-bg rounded-lg transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <button
        onClick={add}
        className="flex items-center gap-2 text-sm font-semibold text-usb-orange hover:text-usb-orange-hover border-2 border-dashed border-usb-orange/30 hover:border-usb-orange/60 rounded-xl px-4 py-3 w-full justify-center transition-all"
      >
        <Plus size={15} />
        Agregar componente de evaluación
      </button>
    </div>
  )
}

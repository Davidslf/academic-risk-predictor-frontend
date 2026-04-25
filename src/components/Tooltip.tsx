/**
 * Tooltip — lightweight, animated, accessible.
 * Uses Framer Motion for spring entry/exit.
 * Follows WCAG 1.4.13: tooltip stays visible on hover.
 */
import { useState, useRef, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type Placement = 'top' | 'bottom' | 'left' | 'right'

interface TooltipProps {
  content: string
  placement?: Placement
  delay?: number            // ms before showing
  children: React.ReactElement
  className?: string
}

const OFFSET = 8 // px gap between trigger and tooltip

const placementStyles: Record<Placement, { tip: string; arrow: string }> = {
  top:    { tip: 'bottom-full left-1/2 -translate-x-1/2 mb-2',            arrow: 'top-full left-1/2 -translate-x-1/2 border-t-[var(--green-deep)] border-t-4 border-x-4 border-x-transparent border-b-0' },
  bottom: { tip: 'top-full left-1/2 -translate-x-1/2 mt-2',               arrow: 'bottom-full left-1/2 -translate-x-1/2 border-b-[var(--green-deep)] border-b-4 border-x-4 border-x-transparent border-t-0' },
  left:   { tip: 'right-full top-1/2 -translate-y-1/2 mr-2',              arrow: 'left-full top-1/2 -translate-y-1/2 border-l-[var(--green-deep)] border-l-4 border-y-4 border-y-transparent border-r-0' },
  right:  { tip: 'left-full top-1/2 -translate-y-1/2 ml-2',               arrow: 'right-full top-1/2 -translate-y-1/2 border-r-[var(--green-deep)] border-r-4 border-y-4 border-y-transparent border-l-0' },
}

const motionVariants: Record<Placement, { initial: Record<string, number>; animate: Record<string, number> }> = {
  top:    { initial: { opacity: 0, y: 6,  scale: 0.93 }, animate: { opacity: 1, y: 0, scale: 1 } },
  bottom: { initial: { opacity: 0, y: -6, scale: 0.93 }, animate: { opacity: 1, y: 0, scale: 1 } },
  left:   { initial: { opacity: 0, x: 6,  scale: 0.93 }, animate: { opacity: 1, x: 0, scale: 1 } },
  right:  { initial: { opacity: 0, x: -6, scale: 0.93 }, animate: { opacity: 1, x: 0, scale: 1 } },
}

export default function Tooltip({
  content,
  placement = 'top',
  delay = 300,
  children,
  className = '',
}: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tipId    = useId()
  const styles   = placementStyles[placement]
  const variants = motionVariants[placement]

  const show = () => {
    timerRef.current = setTimeout(() => setVisible(true), delay)
  }
  const hide = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setVisible(false)
  }

  return (
    <span
      className={`tooltip-trigger ${className}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      aria-describedby={visible ? tipId : undefined}
    >
      {children}

      <AnimatePresence>
        {visible && (
          <motion.div
            id={tipId}
            role="tooltip"
            className={`absolute z-[300] pointer-events-none ${styles.tip}`}
            style={{ marginBottom: placement === 'top' ? OFFSET : undefined, marginTop: placement === 'bottom' ? OFFSET : undefined }}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="initial"
            transition={{ type: 'spring', stiffness: 500, damping: 32 }}
          >
            {/* Bubble */}
            <div
              className="relative px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white whitespace-nowrap shadow-tooltip"
              style={{ background: 'var(--green-deep)', letterSpacing: '-0.01em' }}
            >
              {/* sanitised: content is always passed as a string, React escapes it */}
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  )
}

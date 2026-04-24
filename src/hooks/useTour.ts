import { useState, useEffect } from 'react'

/**
 * useTour
 * -------
 * Manages the lifecycle of a role-specific guided tour.
 *
 * - Auto-starts after 1.2 s on first visit (key not in localStorage).
 * - Listens for the global DOM event `ar:start-tour` so the Header
 *   "?" button can re-trigger the tour from anywhere.
 * - Marks the tour as seen in localStorage when finished or skipped.
 */
export function useTour(key: string) {
  const storageKey = `ar-tour-${key}`
  const [run, setRun] = useState(false)

  useEffect(() => {
    // Auto-start on first visit
    const timer = setTimeout(() => {
      if (!localStorage.getItem(storageKey)) {
        setRun(true)
      }
    }, 1200)

    // Allow the Header "?" button to re-trigger
    const handler = () => setRun(true)
    window.addEventListener('ar:start-tour', handler)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('ar:start-tour', handler)
    }
  }, [storageKey])

  const onTourEnd = () => {
    localStorage.setItem(storageKey, '1')
    setRun(false)
  }

  return { run, setRun, onTourEnd }
}

/**
 * usePWAInstall — detecta si la app puede instalarse en pantalla de inicio
 * y expone una función para disparar el prompt nativo del navegador.
 */

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled,   setIsInstalled]   = useState(false)

  useEffect(() => {
    // Ya instalada como standalone
    const mq = window.matchMedia('(display-mode: standalone)')
    if (mq.matches) { setIsInstalled(true); return }

    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)

    // iOS Safari: detectar si ya está en standalone
    if ((navigator as { standalone?: boolean }).standalone === true) {
      setIsInstalled(true)
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const install = async (): Promise<boolean> => {
    if (!installPrompt) return false
    await installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') {
      setIsInstalled(true)
      setInstallPrompt(null)
    }
    return outcome === 'accepted'
  }

  return {
    canInstall: !!installPrompt && !isInstalled,
    isInstalled,
    install,
  }
}

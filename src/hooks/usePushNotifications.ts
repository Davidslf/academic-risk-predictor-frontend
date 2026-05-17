/**
 * usePushNotifications — gestiona la suscripción a push notifications web.
 *
 * Flujo:
 *  1. El usuario hace clic en "Activar alertas"
 *  2. El navegador pide permiso
 *  3. Si acepta, se crea la suscripción VAPID y se envía al backend
 *  4. El backend guarda la suscripción y la usa para enviar notificaciones
 */

import { useState, useEffect } from 'react'
import { API_BASE } from '../config/env'
import { tokenStore } from '../services/api'

const VAPID_PUBLIC_KEY = (import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined) ?? ''

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const array   = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) array[i] = rawData.charCodeAt(i)
  return array.buffer as ArrayBuffer
}

export function usePushNotifications() {
  const [permission,  setPermission]  = useState<NotificationPermission>('default')
  const [subscribed,  setSubscribed]  = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [supported,   setSupported]   = useState(false)

  useEffect(() => {
    const ok = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
    setSupported(ok)
    if (!ok) return

    setPermission(Notification.permission)

    // Verificar si ya hay suscripción activa
    navigator.serviceWorker.ready
      .then(reg => reg.pushManager.getSubscription())
      .then(sub => setSubscribed(!!sub))
      .catch(() => {/* sin SW aún */})
  }, [])

  const subscribe = async (): Promise<void> => {
    if (!supported || !VAPID_PUBLIC_KEY) return
    setLoading(true)
    try {
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') return

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })

      // Enviar suscripción al backend
      const token = tokenStore.getAccess()
      const res = await fetch(`${API_BASE}/api/v1/push/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(sub.toJSON()),
      })
      if (res.ok) setSubscribed(true)
    } finally {
      setLoading(false)
    }
  }

  const unsubscribe = async (): Promise<void> => {
    if (!supported) return
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (!sub) return

      await sub.unsubscribe()

      // Eliminar del backend
      const token = tokenStore.getAccess()
      await fetch(`${API_BASE}/api/v1/push/unsubscribe`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      })
      setSubscribed(false)
    } finally {
      setLoading(false)
    }
  }

  return { supported, permission, subscribed, loading, subscribe, unsubscribe }
}

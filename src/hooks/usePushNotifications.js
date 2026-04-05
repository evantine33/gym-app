import { useEffect, useState, useRef } from 'react'

const APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID || '61db1733-7173-4ddc-8ed4-b3a246671d0a'

// ─── Load OneSignal SDK once ───────────────────────────────────────────────────
let sdkLoaded = false
function loadOneSignal() {
  if (sdkLoaded || !APP_ID || typeof window === 'undefined') return
  sdkLoaded = true
  window.OneSignalDeferred = window.OneSignalDeferred || []
  const s = document.createElement('script')
  s.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js'
  s.defer = true
  document.head.appendChild(s)
}

export function usePushNotifications() {
  const [status, setStatus] = useState('loading') // 'loading' | 'unsupported' | 'default' | 'granted' | 'denied'
  const ready = useRef(false)

  useEffect(() => {
    if (!APP_ID) { setStatus('unsupported'); return }
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported'); return
    }

    loadOneSignal()

    window.OneSignalDeferred = window.OneSignalDeferred || []
    window.OneSignalDeferred.push(async (OneSignal) => {
      if (ready.current) return
      ready.current = true
      try {
        await OneSignal.init({
          appId: APP_ID,
          notifyButton: { enable: false },
          allowLocalhostAsSecureOrigin: true,
        })
        const perm = await OneSignal.Notifications.permission
        const opted = await OneSignal.User.PushSubscription.optedIn
        setStatus(opted && perm ? 'granted' : perm === false ? 'denied' : 'default')
      } catch {
        setStatus('unsupported')
      }
    })
  }, [])

  const subscribe = async () => {
    if (!window.OneSignal) return
    try {
      await window.OneSignal.Notifications.requestPermission()
      const perm = await window.OneSignal.Notifications.permission
      const opted = await window.OneSignal.User.PushSubscription.optedIn
      setStatus(opted && perm ? 'granted' : 'denied')
    } catch {
      setStatus('denied')
    }
  }

  const unsubscribe = async () => {
    if (!window.OneSignal) return
    await window.OneSignal.User.PushSubscription.optOut()
    setStatus('default')
  }

  return { status, subscribe, unsubscribe }
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ToastProvider } from './components/common/Toast'

// Register Service Worker
import { registerSW } from 'virtual:pwa-register'
let updateSW: ((reloadPage?: boolean) => Promise<void>) | undefined
updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    updateSW?.(true)
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>,
)

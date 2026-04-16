import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { GradesProvider } from './context/GradesContext'
import { ToastProvider } from './components/Toast'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <GradesProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </GradesProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)

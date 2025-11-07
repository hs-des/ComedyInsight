import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/settings.css'
import 'antd/dist/reset.css'
import { ThemeProvider } from './contexts/ThemeContext'
import { NotificationProvider } from './contexts/NotificationContext'
import Toaster from './components/ui/Toaster'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <NotificationProvider>
        <App />
        <Toaster />
      </NotificationProvider>
    </ThemeProvider>
  </React.StrictMode>,
)


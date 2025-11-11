import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.jsx'
import { SettingsProvider } from './contexts/SettingsContext'

// Import design system (order matters!)
import './styles/design-system.css'      // Base tokens
// Theme colors loaded dynamically by SettingsContext
import './index.css'                     // App-specific styles

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <SettingsProvider>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </SettingsProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
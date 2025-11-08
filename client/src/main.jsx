import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.jsx'

// Import design system (order matters!)
import './styles/design-system.css'      // Base tokens
import './styles/themes/emerald.css'     // Theme colors
import './index.css'                     // App-specific styles

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

// Create router with future flags enabled
const router = createBrowserRouter([
  {
    path: "/*",
    element: <App />
  }
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>,
)
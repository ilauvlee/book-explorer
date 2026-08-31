import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('The root element was not found in index.html.')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

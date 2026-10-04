import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import MiComponente from './components/contador/counter.jsx'
import Game from './components/Tutorial/triqui.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <MiComponente/>
    <Game/>

  </StrictMode>,
)

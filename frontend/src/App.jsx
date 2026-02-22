import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './components/LandingCanvas'
import Dashboard from './components/Dashboard'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

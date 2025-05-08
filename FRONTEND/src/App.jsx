import {BrowserRouter, Routes, Route} from 'react-router-dom'
import {RolPage} from './pages/RolPage'
import {RolFormPage} from './pages/RolFormPage'
import {Header} from './components/Header'
import {Home} from './pages/Home'
import { Toaster } from 'react-hot-toast'

function App() {
  
  return (
    <BrowserRouter>
      <Header />

      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/rol" element={<RolPage />} />
        <Route path="/rol-create" element={<RolFormPage />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  )
}

export default App

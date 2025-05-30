import React from 'react'
import {BrowserRouter, Routes, Route} from 'react-router-dom'
import {RolPage} from './pages/RolPage'
import {RolFormPage} from './pages/RolFormPage'
import {Header} from './components/Header'
import {Footer} from './components/Footer'
import {Home} from './pages/Home'
import {Sesion} from './pages/Sesion'
import { Toaster } from 'react-hot-toast'
import { RecuperarContrasena } from './pages/FormRecuperacion'
import { InventarioPage } from './pages/InventarioPage'
import {AdminProveedores} from './pages/AdminProveedores'
import { ListaProductos } from './pages/ListaProductos'
import { ProductosForm } from './components/ProductosForm'
import { Catalogo } from './pages/Catalogo'
import { Carrito } from './pages/Carrito'

function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/rol" element={<RolPage />} />
        <Route path="/rol-create" element={<RolFormPage />} />
        <Route path="/sesion" element={<Sesion />} />
        <Route path="/sesion/recuperar_contrasena" element={<RecuperarContrasena />} />
        <Route path="/proveedores" element={<AdminProveedores />} />
        <Route path="/inventario" element={<InventarioPage />} />
        <Route path="/producto" element={<ListaProductos />} />
        <Route path="/producto/crear" element={<ProductosForm />} />
        <Route path="/producto/editar/:id" element={<ProductosForm />} />
        <Route path="/catalogo" element={<Catalogo />} />
        <Route path="/carrito" element={<Carrito />} />
      </Routes>
      <Toaster />
      <Footer />
    </BrowserRouter>
  )
}

export default App;

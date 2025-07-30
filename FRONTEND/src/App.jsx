import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RolPage } from "./pages/RolPage";
import { RolFormPage } from "./pages/RolFormPage";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Home } from "./pages/Home";
import { Sesion } from "./pages/Sesion";
import { Toaster } from "react-hot-toast";
import { RecuperarContrasena } from "./pages/FormRecuperacion";
import { InventarioPage } from "./pages/InventarioPage";
import { AdminProveedores } from "./pages/AdminProveedores";
import ProveedoresRegistrados from "./pages/ProveedoresRegistrados";
import { fetchProveedores, deleteProveedor } from "./api/Proveedor.api.js"
import { CategoriaForm } from './components/GDCandS/Categorias'
import { ListaProductos } from './pages/ListaProductos'
import { ProductosForm } from './components/ProductosForm'
import Catalogo from './components/Catalogo/Catalogo';
import { Carrito } from './pages/Carrito'
import {AdminUsuarios} from  './pages/AdminUsuarios';
import Tallas from './pages/Tallas';
import GrupoTalla from './pages/GrupoTalla';


function App() {
  const [proveedores, setProveedores] = useState([]);

  useEffect(() => {
    const cargarProveedores = async () => {
      try {
        const response = await fetchProveedores();
        setProveedores(response.data);
      } catch (error) {
        console.error("Error al cargar proveedores:", error);
      }
    };

    cargarProveedores();
  }, []);

  const handleEliminar = async (id) => {
    try {
      await deleteProveedor(id);
      setProveedores(proveedores.filter((prov) => prov.id !== id));
    } catch (error) {
      console.error("Error al eliminar proveedor:", error);
    }
  };

  const handleEditar = (proveedor) => {
    console.log("Editar proveedor", proveedor);
  };

  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/categorias" element={<CategoriaForm />} />
        <Route path="/rol" element={<RolPage />} />
        <Route path="/rol-create" element={<RolFormPage />} />
        <Route path="/sesion" element={<Sesion />} />
        <Route path="/sesion/recuperar_contrasena" element={<RecuperarContrasena />} />
        <Route path="/proveedores" element={<AdminProveedores />} />
        <Route path="/inventario" element={<InventarioPage />} />
        <Route
          path="/proveedores_registrados"
          element={
            <ProveedoresRegistrados
              proveedores={proveedores}
              onEliminar={handleEliminar}
              onEditar={handleEditar}
            />
          }
        />
        <Route path="/producto" element={<ListaProductos />} />
        <Route path="/producto/crear" element={<ProductosForm />} />
        <Route path="/producto/editar/:id" element={<ProductosForm />} />
        <Route path="/catalogo" element={<Catalogo />} />
        <Route path="/carrito" element={<Carrito />} />
        <Route path="/usuario" element={<AdminUsuarios/>} />
        <Route path="/tallas" element={<Tallas/>} />
        <Route path="/grupo-talla" element={<GrupoTalla/>} />
      </Routes>
      <Toaster />
      <Footer />
    </BrowserRouter>
  );
}

export default App;

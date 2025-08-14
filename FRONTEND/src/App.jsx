import React, { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { RolListaPage } from "./pages/RolListaPage.jsx";
import { RolFormPage } from "./pages/RolFormPage.jsx";
import { Header } from "./components/Singlepage/Header.jsx";
import { Footer } from "./components/Singlepage/Footer.jsx";
import { Home } from "./components/Singlepage/Home.jsx";
import { SesionPage } from "./pages/SesionPage.jsx";
import { Toaster } from "react-hot-toast";
import { SesionRecuperacionPage } from "./pages/SesionRecuperacion.jsx";
import { InventarioPage } from "./pages/InventarioPage";
import { AdminProvedoresPage } from "./pages/AdminProvedoresPage.jsx";
import { ProveedoresRegistradosPage } from "./pages/ProvedoresRegistradosPage.jsx";
import { fetchProveedores, deleteProveedor } from "./api/Proveedor.api.js";
import { CategoriasPage } from './pages/Categoriaspage';
import { ListaProductosPage } from './pages/ListaproductosPage.jsx';
import { ProductosFormPage } from './pages/ProductosFormPage.jsx';
import Catalogopage from "./pages/Catalogopage.jsx"; 
import { AdminUsuariosPage } from './pages/AdminUsuariosPage.jsx';
import { TallasPage } from './pages/Tallaspage.jsx';
import { GrupoTallaPage } from './pages/GrupoTallePage.jsx';
import 'bootstrap/dist/css/bootstrap.min.css';
import "../src/assets/css/Layout/Layout.css";


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
  <div className="app-container">
    <Header />
    <main className="main-content">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/categorias" element={<CategoriasPage />} />
        <Route path="/rol" element={<RolListaPage />} />
        <Route path="/rol-create" element={<RolFormPage />} />
        <Route path="/sesion" element={<SesionPage />} />
        <Route path="/sesion/recuperar_contrasena" element={<SesionRecuperacionPage />} />
        <Route path="/proveedores" element={<AdminProvedoresPage />} />
        <Route path="/inventario" element={<InventarioPage />} />
        <Route
          path="/proveedores_registrados"
          element={
            <ProveedoresRegistradosPage
              proveedores={proveedores}
              onEliminar={handleEliminar}
              onEditar={handleEditar}
            />
          }
        />
        <Route path="/producto" element={<ListaProductosPage />} />
        <Route path="/producto/crear" element={<ProductosFormPage />} />
        <Route path="/producto/editar/:id" element={<ProductosFormPage />} />
        <Route path="/catalogo" element={<Catalogopage />} />
        <Route path="/usuario" element={<AdminUsuariosPage />} />
        <Route path="/tallas" element={<TallasPage />} />
        <Route path="/grupo-talla" element={<GrupoTallaPage />} />
      </Routes>
      <Toaster />
    </main>
    <Footer />
  </div>
);
}

export default App;

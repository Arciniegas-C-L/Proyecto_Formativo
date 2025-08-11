import React, { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import 'bootstrap/dist/css/bootstrap.min.css';

import { Header } from "./components/Singlepage/Header.jsx";
import { Footer } from "./components/Singlepage/Footer.jsx";
import { Home } from "./components/Singlepage/Home.jsx";
import { SesionPage } from "./pages/SesionPage.jsx";
import { SesionRecuperacionPage } from "./pages/SesionRecuperacion.jsx";
import { NoAutorizadoPage } from "./pages/NoAutorizadoPage.jsx";

import { RolListaPage } from "./pages/RolListaPage.jsx";
import { RolFormPage } from "./pages/RolFormPage.jsx";
import { InventarioPage } from "./pages/InventarioPage.jsx";
import { AdminProvedoresPage } from "./pages/AdminProvedoresPage.jsx";
import { ProveedoresRegistradosPage } from "./pages/ProvedoresRegistradosPage.jsx";
import { CategoriasPage } from './pages/Categoriaspage';
import { ListaProductosPage } from './pages/ListaproductosPage.jsx';
import { ProductosFormPage } from './pages/ProductosFormPage.jsx';
import { CatalogoPage } from './pages/Catalogopage';
import { AdminUsuariosPage } from './pages/AdminUsuariosPage.jsx';
import { TallasPage } from './pages/Tallaspage.jsx';
import { GrupoTallaPage } from './pages/GrupoTallePage.jsx';

import { fetchProveedores, deleteProveedor } from "./api/Proveedor.api.js";
import { RutaPrivada } from "./routes/RutaPrivada.jsx";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx"; // 👈 importamos useAuth

function AppContent() {
  const { token } = useAuth(); // 👈 accedemos al estado de sesión
  const [proveedores, setProveedores] = useState([]);

  // useEffect(() => {
//   const cargarProveedores = async () => {
//     if (!token) return;

//     try {
//       const response = await fetchProveedores(token);
//       setProveedores(response.data);
//     } catch (error) {
//       console.error("Error al cargar proveedores:", error);
//     }
//   };

//   cargarProveedores();
// }, [token]);


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
    <>
      <Header />

      <Routes>
        {/* Públicas */}
        <Route path="/" element={<Home />} />
        <Route path="/sesion" element={<SesionPage />} />
        <Route path="/sesion/recuperar_contrasena" element={<SesionRecuperacionPage />} />
        <Route path="/no-autorizado" element={<NoAutorizadoPage />} />

        {/* Protegidas por rol */}
        <Route
          path="/catalogo"
          element={
            <RutaPrivada role="cliente">
              <CatalogoPage />
            </RutaPrivada>
          }
        />
        <Route
          path="/proveedores"
          element={
            <RutaPrivada role="administrador">
              <AdminProvedoresPage />
            </RutaPrivada>
          }
        />
        <Route
          path="/administrador"
          element={
            <RutaPrivada role="administrador">
              <ProveedoresRegistradosPage
                proveedores={proveedores}
                onEliminar={handleEliminar}
                onEditar={handleEditar}
              />
            </RutaPrivada>
          }
        />
        <Route
          path="/inventario"
          element={
            <RutaPrivada role="administrador">
              <InventarioPage />
            </RutaPrivada>
          }
        />
        <Route
          path="/producto"
          element={
            <RutaPrivada role="administrador">
              <ListaProductosPage />
            </RutaPrivada>
          }
        />
        <Route
          path="/producto/crear"
          element={
            <RutaPrivada role="administrador">
              <ProductosFormPage />
            </RutaPrivada>
          }
        />
        <Route
          path="/producto/editar/:id"
          element={
            <RutaPrivada role="administrador">
              <ProductosFormPage />
            </RutaPrivada>
          }
        />
        <Route
          path="/usuario"
          element={
            <RutaPrivada role="administrador">
              <AdminUsuariosPage />
            </RutaPrivada>
          }
        />
        <Route
          path="/tallas"
          element={
            <RutaPrivada role="administrador">
              <TallasPage />
            </RutaPrivada>
          }
        />
        <Route
          path="/grupo-talla"
          element={
            <RutaPrivada role="administrador">
              <GrupoTallaPage />
            </RutaPrivada>
          }
        />
        <Route
          path="/categorias"
          element={
            <RutaPrivada role={["cliente", "administrador"]}>
              <CategoriasPage />
            </RutaPrivada>
          }
        />
        <Route
          path="/rol"
          element={
            <RutaPrivada role="administrador">
              <RolListaPage />
            </RutaPrivada>
          }
        />
        <Route
          path="/rol-create"
          element={
            <RutaPrivada role="administrador">
              <RolFormPage />
            </RutaPrivada>
          }
        />
      </Routes>

      <Toaster />
      <Footer />
    </>
  );
}

// 👇 Envolvemos AppContent con AuthProvider
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

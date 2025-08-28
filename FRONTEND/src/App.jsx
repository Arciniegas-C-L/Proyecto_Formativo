import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "bootstrap/dist/css/bootstrap.min.css";

import { Header } from "./components/Singlepage/Header.jsx";
import AdminDashboard from "./components/Admin/AdminDashboard.jsx";
import { Footer } from "./components/Singlepage/Footer.jsx";
import { Home } from "./components/Singlepage/Home.jsx";
import { SesionPage } from "./pages/SesionPage.jsx";
import { SesionRecuperacionPage } from "./pages/SesionRecuperacion.jsx";
import { NoAutorizadoPage } from "./pages/NoAutorizadoPage.jsx";

import { RolListaPage } from "./pages/RolListaPage.jsx";
import { RolFormPage } from "./pages/RolFormPage.jsx";
import { InventarioPage } from "./pages/InventarioPage.jsx";
import { AdminProvedoresPage } from "./pages/AdminProvedoresPage.jsx";
import { ProveedoresRegistradosPage } from "./pages/ProveedoresRegistradosPage.jsx";
import { CategoriasPage } from "./pages/Categoriaspage";
import { ListaProductosPage } from "./pages/ListaproductosPage.jsx";
import { ProductosFormPage } from "./pages/ProductosFormPage.jsx";
import { Catalogopage } from "./pages/Catalogopage";
import { Carritopage } from "./pages/Carritopage";
import { AdminUsuariosPage } from "./pages/AdminUsuariosPage.jsx";
import { TallasPage } from "./pages/Tallaspage.jsx";
import { GrupoTallaPage } from "./pages/GrupoTallePage.jsx";
import { PerfilPage } from "./pages/PerfilPage.jsx";
import "bootstrap/dist/css/bootstrap.min.css";

import { RutaPrivada } from "./routes/RutaPrivada.jsx";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";

function AppContent() {
  const location = useLocation();
  const { autenticado, rol } = useAuth();

  const esAdminAutenticado = autenticado && rol === "administrador";

  // No mostrar en la página de sesión o de recuperación
  const noEsPaginaDeSesion =
    location.pathname !== "/sesion" &&
    location.pathname !== "/sesion/recuperar_contrasena";

  return (
    <>
      <Header />

      {/* Renderiza el dashboard si el usuario es admin y no está en la página de sesión */}
      {esAdminAutenticado && noEsPaginaDeSesion && <AdminDashboard />}

      <Routes>
        {/* Públicas */}
        <Route path="/" element={<Home />} />
        <Route path="/sesion" element={<SesionPage />} />
        <Route
          path="/sesion/recuperar_contrasena"
          element={<SesionRecuperacionPage />}
        />
        <Route path="/catalogo" element={<Catalogopage />} />
        <Route path="/no-autorizado" element={<NoAutorizadoPage />} />
        <Route path="/carrito" element={<Carritopage />} />

        {/* Protegidas por rol */}
        <Route
          path="/proveedores"
          element={
            <RutaPrivada role="administrador">
              <AdminProvedoresPage />
            </RutaPrivada>
          }
        />
        <Route
          path="/proveedores/registrados"
          element={
            <RutaPrivada role="administrador">
              <ProveedoresRegistradosPage />
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
        <Route
          path="/perfil"
          element={
            <RutaPrivada role={["cliente", "administrador"]}>
              <PerfilPage />
            </RutaPrivada>
          }
        />
        <Route
          path="/carrito"
          element={
            <RutaPrivada role={["cliente", "administrador"]}>
              <Carritopage />
            </RutaPrivada>
          }
        />
      </Routes>

      <Toaster />
      <Footer />
    </>
  );
}

//  Envolvemos AppContent con AuthProvider
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

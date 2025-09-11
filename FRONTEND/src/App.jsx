import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "bootstrap/dist/css/bootstrap.min.css";

// Layout público
import { Header } from "./components/Singlepage/Header.jsx";
import { Footer } from "./components/Singlepage/Footer.jsx";

// Páginas públicas
import { Home } from "./components/Singlepage/Home.jsx";
import { SesionPage } from "./pages/SesionPage.jsx";
import { SesionRecuperacionPage } from "./pages/SesionRecuperacion.jsx";
import { RecuperarContrasenapage } from "./pages/Recuperarcontrasenapage.jsx";
import { NoAutorizadoPage } from "./pages/NoAutorizadoPage.jsx";
import { PerfilPage } from "./pages/PerfilPage.jsx";
import { Catalogopage } from "./pages/Catalogopage.jsx";
import { Carritopage } from "./pages/Carritopage.jsx";
import { CategoriasPage } from "./pages/CategoriasPage.jsx";

// Páginas Admin
import { AdminProvedoresPage } from "./pages/AdminProvedoresPage.jsx";
import { ProveedoresRegistradosPage } from "./pages/ProveedoresRegistradosPage.jsx";
import { AdminUsuariosPage } from "./pages/AdminUsuariosPage.jsx";
import { InventarioPage } from "./pages/InventarioPage.jsx";
import { ProductosFormPage } from "./pages/ProductosFormPage.jsx";
import { ListaProductosPage } from "./pages/ListaProductosPage.jsx";
import { RolFormPage } from "./pages/RolFormPage.jsx";
import { RolListaPage } from "./pages/RolListaPage.jsx";
import { GrupoTallaPage } from "./pages/GrupoTallePage.jsx";
import { TallasPage } from "./pages/TallasPage.jsx";
import { RetornoMPpage } from "./pages/RetornoMPpage";
import {MisPedidosPage} from "./pages/MisPedidosPage"

// Layout y contexto Admin
import AdminLayout from "./components/Admin/AdminLayout.jsx";

// Contexto y rutas privadas
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { RutaPrivada } from "./routes/RutaPrivada.jsx";

function AppContent() {
  const location = useLocation();
  const { rol } = useAuth();
  const mainKey = rol || "guest";
  

  return (
    <>
      {!location.pathname.startsWith("/admin") && <Header />}

      <main key={mainKey}>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<Home />} />
          <Route path="/catalogo" element={<Catalogopage />} />
          <Route path="/carrito" element={<Carritopage />} />
          <Route path="/no-autorizado" element={<NoAutorizadoPage />} />
          <Route path="/sesion" element={<SesionPage />} />
          <Route
            path="/sesion/recuperar_contrasena"
            element={<SesionRecuperacionPage />}
          />
          <Route path="/recuperar" element={<RecuperarContrasenapage />} />

          {/* Rutas privadas cliente/administrador */}
          <Route
            path="/perfil"
            element={
              <RutaPrivada role={["cliente", "administrador"]}>
                <PerfilPage />
              </RutaPrivada>
            }
          />
          <Route
            path="/categorias"
            element={
              <RutaPrivada role={["administrador"]}>
                <CategoriasPage />
              </RutaPrivada>
            }
          />
          <Route
            path="/Mispedidos"
            element={
              <RutaPrivada role={["administrador", "cliente"]}>
                <MisPedidosPage />
              </RutaPrivada>
            }
          />
          <Route
            path="/RetornoMP"
            element={
              <RutaPrivada role={["cliente", "administrador"]}>
                <RetornoMPpage />
              </RutaPrivada>
            }
          />


          {/* Admin con layout */}
          <Route
            path="/admin/*"
            element={
              <RutaPrivada role={["administrador"]}>
                <AdminLayout />
              </RutaPrivada>
            }
          >
            <Route path="dashboard" element={<AdminProvedoresPage />} />
            <Route path="proveedores" element={<AdminProvedoresPage />} />
            <Route
              path="proveedores/registrados"
              element={<ProveedoresRegistradosPage />}
            />
            <Route path="usuarios" element={<AdminUsuariosPage />} />
            <Route path="inventario" element={<InventarioPage />} />
            <Route path="productos" element={<ListaProductosPage />} />
            <Route path="productos/crear" element={<ProductosFormPage />} />
            <Route
              path="productos/editar/:id"
              element={<ProductosFormPage />}
            />
            <Route path="roles" element={<RolFormPage />} />
            <Route path="roles/lista" element={<RolListaPage />} />
            <Route path="tallas/grupo" element={<GrupoTallaPage />} />
            <Route path="tallas/grupo/crear" element={<GrupoTallaPage />} />
            <Route
              path="tallas/grupo/editar/:id"
              element={<GrupoTallaPage />}
            />
            <Route path="tallas" element={<TallasPage />} />
            <Route path="categorias" element={<CategoriasPage />} />
          </Route>

          {/* Redirección por defecto */}
          <Route path="*" element={<Home />} />
        </Routes>
      </main>

      {!location.pathname.startsWith("/admin") && <Footer />}

      <Toaster />
    </>
  );
}

//  Envolvemos AppContent con AuthProvider
export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

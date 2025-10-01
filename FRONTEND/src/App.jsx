import React, { useEffect, useState } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
// import { Toaster } from "react-hot-toast";
import AutoAvatarInitializer from './components/Perfil/AutoAvatarInitializer.jsx';

import {AdminStockNotifications} from "./components/Notificaciones/AdminStockNotifications.jsx"

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
import CategoriasPage from "./pages/Categoriaspage.jsx";

// Páginas Admin
import { AdminProvedoresPage } from "./pages/AdminProvedoresPage.jsx";
import { ProveedoresRegistradosPage } from "./pages/ProveedoresRegistradosPage.jsx";
import { AdminUsuariosPage } from "./pages/AdminUsuariosPage.jsx";
import { InventarioPage } from "./pages/InventarioPage.jsx";
import { ProductosFormPage } from "./pages/ProductosFormPage.jsx";
import { TallasPage } from "./pages/Tallaspage.jsx";
import { GrupoTallaPage } from "./pages/GrupoTallePage.jsx";
import { RolListaPage } from "./pages/RolListaPage.jsx";
import { RolFormPage } from "./pages/RolFormPage.jsx";
import { AdminDashboard } from "./components/Admin/AdminDashboard.jsx";
import { AdminLayout } from "./components/Admin/AdminLayout.jsx";
import { ListaProductosPage } from "./pages/ListaproductosPage.jsx";
import { FacturasPage } from "./pages/FacturasPage.jsx";
import { PedidosPage } from "./pages/PedidosPage.jsx";
import AdminHome from "./components/Admin/AdminHome.jsx";
import {ReporteVentasRangoAdminPage} from "./pages/ReporteVentasRangoAdminPage.jsx";
import "bootstrap/dist/css/bootstrap.min.css";

import { RutaPrivada } from "./routes/RutaPrivada.jsx";
import { RetornoMPpage } from "./pages/RetornoMPpage";
import { MisPedidosPage } from "./pages/MisPedidosPage";
import {ListaUsuariosPage} from "./pages/ListausuariosPage.jsx"

// Contexto y rutas privadas
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";

//  Componente principal
function AppContent() {
  const location = useLocation();
  const { autenticado, rol } = useAuth();
  const [mostrarAdminPanel, setMostrarAdminPanel] = useState(false);

  const esAdminAutenticado = autenticado && rol === "administrador";

  // No mostrar en la página de sesión o de recuperación
  const noEsPaginaDeSesion =
    location.pathname !== "/sesion" &&
    location.pathname !== "/sesion/recuperar_contrasena";

  // Redirección instantánea a la ruta original si existe en sessionStorage
  useEffect(() => {
    const restoring = window.sessionStorage.getItem('restoringPath');
    const originalPath = window.sessionStorage.getItem('originalPath');
    if (restoring && originalPath && location.pathname === '/') {
      window.sessionStorage.removeItem('restoringPath');
      window.sessionStorage.removeItem('originalPath');
      window.history.replaceState(null, '', originalPath);
      // Si usas react-router v6+, fuerza la navegación:
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  }, [location]);

  // Verificar si estamos en rutas de admin
  const esRutaAdmin = location.pathname.startsWith("/admin");

  // Control automático del AdminDashboard
  useEffect(() => {
    if (esRutaAdmin) {
      // Si estamos en ruta admin, no mostrar el dashboard flotante
      setMostrarAdminPanel(false);
    } else if (location.pathname === "/" && esAdminAutenticado) {
      // Si volvemos al home siendo admin, mantener cerrado por defecto
      setMostrarAdminPanel(false);
    }
  }, [location.pathname, esAdminAutenticado, esRutaAdmin]);

  // Función para alternar el panel (desde el header o donde sea necesario)
  const toggleAdminPanel = () => {
    setMostrarAdminPanel((prev) => !prev);
  };

  return (
    <>
      {/* Solo mostrar Header si NO es una ruta de admin */}
      {!esRutaAdmin && <Header toggleAdminPanel={toggleAdminPanel} />}

      {/* MAIN AGREGADO - contenido que se expande */}
      <main>
        {/* Renderiza el dashboard completo solo si se solicita explícitamente y no estamos en admin */}
        {esAdminAutenticado &&
          noEsPaginaDeSesion &&
          !esRutaAdmin &&
          mostrarAdminPanel && <AdminDashboard />}

        {/* Siempre mostrar AdminDashboard para admin cuando NO está en rutas admin (para que se vea el botón hamburguesa) */}
        {esAdminAutenticado &&
          noEsPaginaDeSesion &&
          !esRutaAdmin &&
          !mostrarAdminPanel && <AdminDashboard />}

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
          path="/facturas"
          element={
            <RutaPrivada role={["cliente", "administrador"]}>
              <FacturasPage />
            </RutaPrivada>
          }
          />
          {/*  Ver factura por ID reutilizando RetornoMPpage */}
          <Route
            path="/facturas/:id"
            element={
              <RutaPrivada role={["cliente", "administrador"]}>
                <RetornoMPpage />
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
              <RutaPrivada role={["cliente"]}>
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
          {/*  Retorno de Mercado Pago (ruta clara) */}
          <Route
            path="/pago/retorno"
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
            {/* ========== DASHBOARD PRINCIPAL ========== */}
            <Route index element={<AdminHome />} />
            <Route path="home" element={<AdminHome />} />
            <Route path="dashboard" element={<AdminProvedoresPage />} />
            <Route path="perfil" element={<PerfilPage />} />

            {/* ========== GESTIÓN DE USUARIOS (Sin mostrar en panel) ========== */}
            <Route path="usuarios" element={<AdminUsuariosPage />} />
            <Route path="roles" element={<RolFormPage />} />
            <Route path="roles/lista" element={<RolListaPage />} />

            {/* ========== GESTIÓN DE PRODUCTOS ========== */}
            <Route path="categorias" element={<CategoriasPage />} />
            <Route path="productos" element={<ListaProductosPage />} />
            <Route path="productos/crear" element={<ProductosFormPage />} />
            <Route path="productos/editar/:id" element={<ProductosFormPage />} />
            <Route path="catalogo" element={<Catalogopage />} />
            
            {/* ========== GESTIÓN DE TALLAS ========== */}
            <Route path="tallas" element={<TallasPage />} />
            <Route path="tallas/grupo" element={<GrupoTallaPage />} />
            <Route path="tallas/grupo/crear" element={<GrupoTallaPage />} />
            <Route path="tallas/grupo/editar/:id" element={<GrupoTallaPage />} />

            {/* ========== GESTIÓN DE INVENTARIO ========== */}
            <Route path="inventario" element={<InventarioPage />} />

            {/* ========== GESTIÓN DE PROVEEDORES ========== */}
            <Route path="proveedores" element={<AdminProvedoresPage />} />
            <Route path="proveedores/registrados" element={<ProveedoresRegistradosPage />} />

            {/* ========== GESTIÓN DE VENTAS ========== */}
            <Route path="pedidos" element={<PedidosPage />} />
            <Route path="facturas" element={<FacturasPage />} />
            <Route path="facturas/:id" element={<RetornoMPpage />} />
            <Route path="retornoMP" element={<RetornoMPpage />} />
            <Route path="reportes/ventas" element={<ReporteVentasRangoAdminPage />} />
            <Route path="ListaUsuarios" element={<ListaUsuariosPage/>} />
          </Route>

          {/* Redirección por defecto */}
          <Route path="*" element={<Home />} />
        </Routes>
        <AdminStockNotifications
        isAdmin={esAdminAutenticado}      
        pollMs={60000}
        umbralGlobal={5}
        onGoToInventario={({ categoriaId, subcategoriaId, productoId }) => {
          navigate(
            `/admin/inventario?cat=${categoriaId}&sub=${subcategoriaId}&prod=${productoId}`
          );                                
        }}
      />
      </main>

      {!location.pathname.startsWith("/admin") && <Footer />}

  {/* <Toaster /> */}
    </>
  );
}

// Envolvemos AppContent con AuthProvider
//Agregamos la funcion que crea un avatar de manera automatica
export function App() {
  return (
    <AuthProvider>
      <AutoAvatarInitializer /> 
      <AppContent />
    </AuthProvider>
  );
}
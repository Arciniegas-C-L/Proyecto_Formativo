import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import {ProveedoresRegistradosPage} from "./pages/ProvedoresRegistradosPage.jsx";
import { fetchProveedores, deleteProveedor } from "./api/Proveedor.api.js"
import { CategoriasPage } from './pages/Categoriaspage'
import { ListaProductosPage } from './pages/ListaproductosPage.jsx'
import { ProductosFormPage } from './pages/ProductosFormPage.jsx'
import { CatalogoPage } from './pages/Catalogopage'
//import { Carrito } from './pages/Carrito'
import {AdminUsuariosPage} from  './pages/AdminUsuariosPage.jsx';
import {TallasPage} from './pages/Tallaspage.jsx';
import {GrupoTallaPage} from './pages/GrupoTallePage.jsx';
import 'bootstrap/dist/css/bootstrap.min.css';



function App() {
  // Estado local para almacenar la lista de proveedores
  const [proveedores, setProveedores] = useState([]);

  // Hook useEffect para cargar los proveedores cuando se monta el componente
  useEffect(() => {
    const cargarProveedores = async () => {
      try {
        // Llamada a la API para obtener los proveedores
        const response = await fetchProveedores();
        // Se actualiza el estado con los proveedores recibidos
        setProveedores(response.data);
      } catch (error) {
        // Manejo de errores si la petición falla
        console.error("Error al cargar proveedores:", error);
      }
    };

    // Se ejecuta la función de carga al montar el componente
    cargarProveedores();
  }, []); // El array vacío asegura que solo se ejecute una vez al montar

  // Función para eliminar un proveedor por su ID
  const handleEliminar = async (id) => {
    try {
      // Se llama a la API para eliminar el proveedor
      await deleteProveedor(id);
      // Se actualiza el estado filtrando el proveedor eliminado
      setProveedores(proveedores.filter((prov) => prov.id !== id));
    } catch (error) {
      console.error("Error al eliminar proveedor:", error);
    }
  };

  // Función para manejar la edición de un proveedor (aún sin implementación)
  const handleEditar = (proveedor) => {
    console.log("Editar proveedor", proveedor);
  };

  return (
    // Se configura el enrutador de la aplicación
    <>
      {/* Cabecera común para todas las rutas */}
      <Header />

      {/* Declaración de rutas */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/categorias" element={<CategoriasPage />} />
        <Route path="/rol" element={<RolListaPage />} />
        <Route path="/rol-create" element={<RolFormPage />} />
        <Route path="/sesion" element={<SesionPage />} />
        <Route path="/sesion/recuperar_contrasena" element={<SesionRecuperacionPage />} />
        <Route path="/proveedores" element={<AdminProvedoresPage />} />
        <Route path="/inventario" element={<InventarioPage />} />

        {/* Ruta que muestra la lista de proveedores registrados, 
            pasando funciones para eliminar y editar */}
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
        <Route path="/catalogo" element={<CatalogoPage />} />
        <Route path="/usuario" element={<AdminUsuariosPage />} />
        <Route path="/tallas" element={<TallasPage />} />
        <Route path="/grupo-talla" element={<GrupoTallaPage />} />
      </Routes>

      {/* Componente para mostrar notificaciones tipo toast */}
      <Toaster />

      {/* Pie de página común para todas las rutas */}
      <Footer />
    </>
  );
}

export default App;

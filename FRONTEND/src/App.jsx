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
import { fetchProveedores, deleteProveedor } from "./api/Proveedor.api.js";

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
      </Routes>
      <Toaster />
      <Footer />
    </BrowserRouter>
  );
}

export default App;

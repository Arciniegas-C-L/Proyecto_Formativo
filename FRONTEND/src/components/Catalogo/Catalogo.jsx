import React, { useEffect, useState } from "react";
import { getALLProductos } from "../../api/Producto.api"; 
import FiltrosCatalogo from "./FiltrosCatalogo";
import ProductoCard from "./ProductoCard";
import { useAuth } from "../../context/AuthContext"; 
import "bootstrap/dist/css/bootstrap.min.css";
import "../../assets/css/Catalogo/Catalogo.css"; 

export function Catalogo() {
  const { authState } = useAuth();
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subcategoriasPorCategoria, setSubcategoriasPorCategoria] = useState({});
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [subcategoriasSeleccionadas, setSubcategoriasSeleccionadas] = useState([]);
  const [chipsActivos, setChipsActivos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [errorProductos, setErrorProductos] = useState("");

  const capitalizar = (texto = "") =>
    texto ? texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase() : "";

  // Cargar productos
  const cargarProductos = async () => {
    try {
      const res = await getALLProductos(); // Llamada pública
      const productosData = res?.data ?? res ?? [];

      const productosValidos = productosData.filter(
        (p) => p?.categoria_nombre && p?.subcategoria_nombre && Array.isArray(p?.inventario_tallas)
      );
      setProductos(productosValidos);
      setErrorProductos("");

      // Crear mapa de subcategorías
      const subMap = {};
      productosValidos.forEach((p) => {
        const cat = p.categoria_nombre;
        const sub = p.subcategoria_nombre;
        if (!subMap[cat]) subMap[cat] = new Set();
        subMap[cat].add(sub);
      });
      const subFinal = {};
      Object.keys(subMap).forEach((cat) => {
        subFinal[cat] = Array.from(subMap[cat]).sort();
      });
      setSubcategoriasPorCategoria(subFinal);

      // Categorías
      const catSet = new Set(productosValidos.map(p => p.categoria_nombre).filter(Boolean));
      setCategorias(Array.from(catSet).sort());

    } catch (error) {
      setErrorProductos("Error al cargar productos.");
      console.error("Error al cargar productos:", error);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  // Selección de categoría y subcategoría
  const seleccionarCategoria = (cat) => {
    setCategoriaSeleccionada(cat);
    setSubcategoriasSeleccionadas([]);
    setChipsActivos((prev) => (prev.includes(cat) ? prev : [...prev, cat]));
  };
  const seleccionarSubcategoria = (sub) => {
    setSubcategoriasSeleccionadas([sub]);
    setChipsActivos((prev) => (prev.includes(sub) ? prev : [...prev, sub]));
  };
  const limpiarFiltros = () => {
    setCategoriaSeleccionada("");
    setSubcategoriasSeleccionadas([]);
    setBusqueda("");
    setChipsActivos([]);
  };

  // Filtrado de productos
  const productosFiltrados = productos.filter((producto) => {
    const nombre = (producto?.nombre ?? "").toLowerCase();

    if (categoriaSeleccionada && producto.categoria_nombre !== categoriaSeleccionada) return false;
    if (subcategoriasSeleccionadas.length > 0 && producto.subcategoria_nombre !== subcategoriasSeleccionadas[0]) return false;
    if (busqueda && !nombre.includes(busqueda.toLowerCase())) return false;

    return true;
  });

  return (
    <div className="catalogo-container container-fluid py-4">
      <div className="row">
        <div className="col-md-2 mb-4">
          <FiltrosCatalogo
            categorias={categorias}
            categoriaSeleccionada={categoriaSeleccionada}
            subcategoriasPorCategoria={subcategoriasPorCategoria}
            subcategoriaSeleccionada={subcategoriasSeleccionadas[0] || ""} 
            capitalizar={capitalizar}
            seleccionarCategoria={seleccionarCategoria}
            seleccionarSubcategoria={seleccionarSubcategoria}
            limpiarFiltros={limpiarFiltros}
          />
        </div>

        <div className="col-md-10">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3">
            <h2 className="catalogo-titulo mb-2 mb-md-0">Catálogo de Productos</h2>
            <div className="catalogo-buscador">
              <input
                type="text"
                placeholder="Buscar producto..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          </div>

          {errorProductos && (
            <div className="alert alert-warning">{errorProductos}</div>
          )}

          <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-4">
            {productosFiltrados.length === 0 ? (
              <div className="col text-center">
                <div className="alert alert-info w-100">
                  No hay productos para mostrar.
                </div>
              </div>
            ) : (
              productosFiltrados.map((producto) => (
                <ProductoCard
                  key={producto.id}
                  producto={producto}
                  capitalizar={capitalizar}
                  mostrarAgregarCarrito={authState?.rol === "cliente"} // Solo cliente ve botón
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

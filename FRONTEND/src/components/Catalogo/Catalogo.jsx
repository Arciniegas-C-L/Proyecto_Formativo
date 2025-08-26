// Catalogo.jsx
import React, { useEffect, useState } from "react";
import { getALLProductos } from "../../api/Producto.api"; // ⚠️ verifica nombre real
import { getAllCategorias } from "../../api/Categoria.api";
import { auth } from "../../auth/authService";
import FiltrosCatalogo from "./FiltrosCatalogo";
import ProductoCard from "./ProductoCard";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../assets/css/Catalogo/Catalogo.css"; 

export function Catalogo() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subcategoriasPorCategoria, setSubcategoriasPorCategoria] = useState({});
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [subcategoriasSeleccionadas, setSubcategoriasSeleccionadas] = useState([]);
  const [chipsActivos, setChipsActivos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroTemporal, setFiltroTemporal] = useState(null);
  const [errorProductos, setErrorProductos] = useState("");

  const capitalizar = (texto = "") =>
    texto ? texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase() : "";

  // Cargar productos
  const cargarProductos = async () => {
    const token = auth?.obtenerToken?.();
    if (!token) {
      setErrorProductos("Debes iniciar sesión para ver los productos.");
      return;
    }
    try {
      // Si tu cliente no añade token por interceptor, pásalo aquí.
      const res = await getALLProductos(/* token */);
      const productosData = res?.data ?? res ?? [];

      const productosValidos = productosData.filter(
        (p) =>
          p?.categoria_nombre &&
          p?.subcategoria_nombre &&
          Array.isArray(p?.inventario_tallas)
      );
      setProductos(productosValidos);
      setErrorProductos("");

      const subMap = {};
      for (const p of productosValidos) {
        const cat = p.categoria_nombre;
        const sub = p.subcategoria_nombre;
        if (!subMap[cat]) subMap[cat] = new Set();
        subMap[cat].add(sub);
      }
      const subFinal = {};
      Object.keys(subMap).forEach((cat) => {
        subFinal[cat] = Array.from(subMap[cat]).sort();
      });
      setSubcategoriasPorCategoria(subFinal);
    } catch (error) {
      setErrorProductos(
        error?.response?.status === 401
          ? "Tu sesión ha expirado. Vuelve a iniciar sesión."
          : "Error al cargar productos."
      );
      console.error("Error al cargar productos:", error);
    }
  };

  // Cargar categorías
  const cargarCategorias = async () => {
    try {
      const res = await getAllCategorias();
      const data = res?.data ?? res ?? [];
      const nombres = data.map((cat) => cat?.nombre).filter(Boolean);
      setCategorias(nombres.sort());
    } catch (error) {
      console.error("Error al cargar categorías:", error);
    }
  };

  useEffect(() => {
    cargarCategorias();
    cargarProductos();

    // refresco opcional (menos agresivo)
    const interval = setInterval(() => {
      cargarCategorias();
      cargarProductos();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const seleccionarCategoria = (cat) => {
    setCategoriaSeleccionada(cat);
    setSubcategoriasSeleccionadas([]);
    setFiltroTemporal(null);
    setChipsActivos((prev) => (prev.includes(cat) ? prev : [...prev, cat]));
  };

  const seleccionarSubcategoria = (sub) => {
    setSubcategoriasSeleccionadas([sub]);
    setFiltroTemporal(sub);
    setChipsActivos((prev) => (prev.includes(sub) ? prev : [...prev, sub]));
  };

  const limpiarFiltros = () => {
    setCategoriaSeleccionada("");
    setSubcategoriasSeleccionadas([]);
    setBusqueda("");
    setFiltroTemporal(null);
    setChipsActivos([]);
  };

  const productosFiltrados = productos.filter((producto) => {
    const nombre = (producto?.nombre ?? "").toLowerCase();

    if (filtroTemporal) {
      if (categorias.includes(filtroTemporal)) {
        if (producto.categoria_nombre !== filtroTemporal) return false;
      } else {
        if (producto.subcategoria_nombre !== filtroTemporal) return false;
      }
    } else {
      if (
        categoriaSeleccionada &&
        producto.categoria_nombre !== categoriaSeleccionada
      )
        return false;

      if (
        subcategoriasSeleccionadas.length > 0 &&
        producto.subcategoria_nombre !== subcategoriasSeleccionadas[0]
      )
        return false;
    }

    if (busqueda && !nombre.includes(busqueda.toLowerCase())) return false;

    return true;
  });

  return (
    <div className="catalogo-container container-fluid py-4">
      <div className="row">
        {/* Filtros lateral */}
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

        {/* Buscador y productos */}
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

          {/* Chips acumulativos */}
          {chipsActivos.length > 0 && (
            <div className="catalogo-chips-container">
              {chipsActivos.map((chip) => {
                const esCategoria = categorias.includes(chip);
                const activo = filtroTemporal === chip;
                return (
                  <span
                    key={chip}
                    className={`${esCategoria ? "chip-categoria" : "chip-subcategoria"} ${activo ? "activo" : ""}`}
                  >
                    <span
                      className="chip-nombre"
                      style={{ cursor: "pointer", marginRight: "6px" }}
                      onClick={() => setFiltroTemporal(chip)}
                    >
                      {capitalizar(chip)}
                    </span>
                    <span
                      className="chip-cerrar"
                      style={{ cursor: "pointer", fontWeight: "bold" }}
                      onClick={() => {
                        setChipsActivos((prev) => prev.filter((c) => c !== chip));
                        if (filtroTemporal === chip) setFiltroTemporal(null);
                        if (categoriaSeleccionada === chip) setCategoriaSeleccionada("");
                        if (subcategoriasSeleccionadas.includes(chip))
                          setSubcategoriasSeleccionadas([]);
                      }}
                    >
                      ×
                    </span>
                  </span>
                );
              })}
            </div>
          )}

          {/* Mensaje de error */}
          {errorProductos && (
            <div className="alert alert-warning">{errorProductos}</div>
          )}

          {/* Productos */}
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
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

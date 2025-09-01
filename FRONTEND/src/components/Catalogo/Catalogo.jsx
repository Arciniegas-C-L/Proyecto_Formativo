import React, { useEffect, useState } from "react";
import { getALLProductos } from "../../api/Producto.api";
import { getAllCategorias } from "../../api/Categoria.api";
import FiltrosCatalogo from "./FiltrosCatalogo";
import ProductoCard from "./ProductoCard";
import "../../assets/css/Catalogo/Catalogo.css";
import "bootstrap/dist/css/bootstrap.min.css";

export default function Catalogo() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subcategoriasPorCategoria, setSubcategoriasPorCategoria] = useState({});
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [subcategoriasSeleccionadas, setSubcategoriasSeleccionadas] = useState([]);
  const [chipsActivos, setChipsActivos] = useState([]); // chips acumulativos
  const [busqueda, setBusqueda] = useState("");
  const [filtroTemporal, setFiltroTemporal] = useState(null); // filtro temporal al tocar chip
  const [carritoActualizado, setCarritoActualizado] = useState(0); // para forzar re-render

  const capitalizar = (texto) =>
    texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();

  // Función para manejar cuando se agrega un producto al carrito
  const handleProductoAgregado = () => {
    setCarritoActualizado(prev => prev + 1);
    // Aquí podrías agregar lógica adicional como mostrar un indicador del carrito
    console.log("Producto agregado al carrito, carrito actualizado");
  };

  // Cargar productos desde API
  const cargarProductos = async () => {
    try {
      const res = await getALLProductos();
      const productosData = res.data || [];

      const productosValidos = productosData.filter(
        (p) =>
          p.categoria_nombre &&
          p.subcategoria_nombre &&
          Array.isArray(p.inventario_tallas)
      );
      setProductos(productosValidos);

      const subMap = {};
      productosValidos.forEach((p) => {
        const cat = p.categoria_nombre;
        const sub = p.subcategoria_nombre;
        if (!subMap[cat]) subMap[cat] = new Set();
        subMap[cat].add(sub);
      });

      const subFinal = {};
      Object.keys(subMap).forEach((cat) => {
        subFinal[cat] = Array.from(subMap[cat]);
      });
      setSubcategoriasPorCategoria(subFinal);
    } catch (error) {
      console.error("Error al cargar productos:", error);
    }
  };

  // Cargar categorías desde API
  const cargarCategorias = async () => {
    try {
      const data = await getAllCategorias();
      const nombres = data.map((cat) => cat.nombre);
      setCategorias(nombres);
    } catch (error) {
      console.error("Error al cargar categorías:", error);
    }
  };

  useEffect(() => {
    cargarCategorias();
    cargarProductos();
    const interval = setInterval(() => {
      cargarCategorias();
      cargarProductos();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Selección de categoría
  const seleccionarCategoria = (cat) => {
    setCategoriaSeleccionada(cat);
    setSubcategoriasSeleccionadas([]); // resetea subcategorías
    setFiltroTemporal(null); // quita filtro temporal
    if (!chipsActivos.includes(cat)) setChipsActivos((prev) => [...prev, cat]);
  };

  // Selección de subcategoría
  const seleccionarSubcategoria = (sub) => {
    setSubcategoriasSeleccionadas([sub]); // solo un filtro activo de subcategoría
    setFiltroTemporal(sub); // filtro visual temporal
    if (!chipsActivos.includes(sub)) setChipsActivos((prev) => [...prev, sub]);
  };

  // Limpiar todos los filtros
  const limpiarFiltros = () => {
    setCategoriaSeleccionada("");
    setSubcategoriasSeleccionadas([]);
    setBusqueda("");
    setFiltroTemporal(null);
    setChipsActivos([]);
  };

  // Filtrado de productos
  const productosFiltrados = productos.filter((producto) => {
    // Validar que el producto tenga todos los datos necesarios
    if (!producto || !producto.nombre || !producto.imagen || !producto.precio) {
      return false;
    }

    // Aplicar filtros de categoría y subcategoría
    if (categoriaSeleccionada && producto.categoria_nombre !== categoriaSeleccionada) {
      return false;
    }

    if (subcategoriasSeleccionadas.length > 0 && 
        !subcategoriasSeleccionadas.includes(producto.subcategoria_nombre)) {
      return false;
    }

    // Aplicar filtro de búsqueda
    if (busqueda && !producto.nombre.toLowerCase().includes(busqueda.toLowerCase())) {
      return false;
    }

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
            subcategoriaSeleccionada={subcategoriasSeleccionadas}
            capitalizar={capitalizar}
            seleccionarCategoria={seleccionarCategoria}
            seleccionarSubcategoria={seleccionarSubcategoria}
            limpiarFiltros={limpiarFiltros}
          />
        </div>

        {/* Buscador y productos */}
        <div className="col-md-10">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3">
            <h2 className="catalogo-titulo mb-2 mb-md-0">
              Catálogo de Productos
            </h2>
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
                const esCategoria = categorias.includes(chip); // distingue categoría o subcategoría
                return (
                  <span
                    key={chip}
                    className={`${esCategoria ? "chip-categoria" : "chip-subcategoria"} ${
                      filtroTemporal === chip ? "activo" : ""
                    }`}
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
                      X
                    </span>
                  </span>
                );
              })}
            </div>
          )}

          {/* Productos */}
          <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-4">
            {productosFiltrados.length === 0 ? (
              <div className="col-12 text-center">
                <div className="alert alert-info w-100">
                  {productos.length === 0 ? (
                    "No hay productos disponibles en este momento."
                  ) : (
                    "No se encontraron productos que coincidan con los filtros seleccionados."
                  )}
                  <br />
                  <small className="text-muted">
                    Intenta ajustar los filtros o la búsqueda.
                  </small>
                </div>
              </div>
            ) : (
              productosFiltrados.map((producto) => (
                <ProductoCard
                  key={producto.id}
                  producto={producto}
                  capitalizar={capitalizar}
                  onProductoAgregado={handleProductoAgregado}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
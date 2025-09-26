import React, { useEffect, useState } from "react";
import { getALLProductos } from "../../api/Producto.api";
import FiltrosCatalogo from "./FiltrosCatalogo";
import ProductoCard from "./ProductoCard";
import { useAuth } from "../../context/AuthContext";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../assets/css/Catalogo/Catalogo.css";

export function Catalogo() {
  //  HOOKS Y ESTADO
  const { authState } = useAuth();

  // Estados para productos y datos
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subcategoriasPorCategoria, setSubcategoriasPorCategoria] = useState(
    {}
  );

  // Estados para filtros
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [subcategoriasSeleccionadas, setSubcategoriasSeleccionadas] = useState(
    []
  );
  const [tallaSeleccionada, setTallaSeleccionada] = useState("");
  const [busqueda, setBusqueda] = useState("");

  // Estados de UI
  const [errorProductos, setErrorProductos] = useState("");

  //  FUNCIÓN UTILITARIA
  const capitalizar = (texto = "") =>
    texto ? texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase() : "";

  //  CARGAR DATOS
  const cargarProductos = async () => {
    try {
      const res = await getALLProductos();
      const productosData = res?.data ?? res ?? [];

      // Filtrar solo productos válidos
      const productosValidos = productosData.filter(
        (p) =>
          p?.categoria_nombre &&
          p?.subcategoria_nombre &&
          Array.isArray(p?.inventario_tallas)
      );

      setProductos(productosValidos);
      setErrorProductos("");

      // Organizar subcategorías por categoría
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

      // Extraer categorías únicas
      const catSet = new Set(
        productosValidos.map((p) => p.categoria_nombre).filter(Boolean)
      );
      setCategorias(Array.from(catSet).sort());
    } catch (error) {
      setErrorProductos("Error al cargar productos.");
      console.error("Error al cargar productos:", error);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  //  FUNCIONES DE FILTRADO
  const seleccionarCategoria = (cat) => {
    setCategoriaSeleccionada(cat);
    setSubcategoriasSeleccionadas([]);
    setTallaSeleccionada("");
  };

  const seleccionarSubcategoria = (sub) => {
    setSubcategoriasSeleccionadas([sub]);
    setTallaSeleccionada("");
  };

  const seleccionarTalla = (talla) => {
    setTallaSeleccionada(talla);
  };

  const limpiarFiltros = () => {
    setCategoriaSeleccionada("");
    setSubcategoriasSeleccionadas([]);
    setTallaSeleccionada("");
    setBusqueda("");
  };

  //  FILTRADO DE PRODUCTOS
  const productosFiltrados = productos.filter((producto) => {
    const nombre = (producto?.nombre ?? "").toLowerCase();
    const descripcion = (producto?.descripcion ?? "").toLowerCase();
    const categoria = (producto?.categoria_nombre ?? "").toLowerCase();
    const subcategoria = (producto?.subcategoria_nombre ?? "").toLowerCase();
    const busquedaLower = busqueda.toLowerCase();

    // Filtro de búsqueda inteligente
    if (busqueda) {
      // Separar la búsqueda en palabras
      const palabrasBusqueda = busquedaLower
        .split(" ")
        .filter((p) => p.length > 0);

      // Buscar cada palabra por separado
      const cumpleBusqueda = palabrasBusqueda.every((palabra) => {
        return (
          nombre.includes(palabra) ||
          descripcion.includes(palabra) ||
          categoria.includes(palabra) ||
          subcategoria.includes(palabra)
        );
      });

      if (!cumpleBusqueda) return false;
    }

    // Filtro de categoría
    if (
      categoriaSeleccionada &&
      producto.categoria_nombre !== categoriaSeleccionada
    )
      return false;

    // Filtro de subcategoría
    if (
      subcategoriasSeleccionadas.length > 0 &&
      producto.subcategoria_nombre !== subcategoriasSeleccionadas[0]
    )
      return false;

    // Filtro de talla
    if (tallaSeleccionada) {
      const tieneTalla = producto.inventario_tallas.some(
        (inv) => inv.talla === tallaSeleccionada && inv.stock > 0
      );
      if (!tieneTalla) return false;
    }

    return true;
  });

  //  OBTENER TALLAS DISPONIBLES DINÁMICAMENTE
  const obtenerTallasDisponibles = () => {
    const tallasSet = new Set();

    productosFiltrados.forEach((producto) => {
      if (producto.inventario_tallas) {
        producto.inventario_tallas.forEach((inv) => {
          if (inv.stock > 0 && inv.talla) {
            tallasSet.add(inv.talla);
          }
        });
      }
    });

    return Array.from(tallasSet).sort();
  };

  const tallasDisponibles = obtenerTallasDisponibles();

  // --- CAMBIO MINIMO: permitir anónimo y 'invitado' ---
  const rol = authState?.rol?.toLowerCase?.() ?? "";
  const puedeAgregar = !rol || rol === "cliente" || rol === "invitado";

  return (
    <div className="catalogo-container container-fluid py-4">
      <div className="catalogo-main-content">
        {/*  HEADER CON TÍTULO Y BUSCADOR  */}
        <div className="catalogo-header d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
          <h2 className="catalogo-titulo mb-3 mb-md-0">
            Catálogo de Productos
          </h2>

          <div className="catalogo-controles d-flex align-items-center">
            <div className="catalogo-buscador">
              <input
                type="text"
                placeholder="Buscar producto..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/*  BOTÓN FILTROS + PANEL FLOTANTE  */}
        <div className="mb-3">
          <FiltrosCatalogo
            categorias={categorias}
            categoriaSeleccionada={categoriaSeleccionada}
            subcategoriasPorCategoria={subcategoriasPorCategoria}
            subcategoriaSeleccionada={subcategoriasSeleccionadas[0] || ""}
            tallasDisponibles={tallasDisponibles}
            tallaSeleccionada={tallaSeleccionada}
            capitalizar={capitalizar}
            seleccionarCategoria={seleccionarCategoria}
            seleccionarSubcategoria={seleccionarSubcategoria}
            seleccionarTalla={seleccionarTalla}
            limpiarFiltros={limpiarFiltros}
          />
        </div>

        {/*  MENSAJE DE ERROR  */}
        {errorProductos && (
          <div className="alert alert-warning mb-4">{errorProductos}</div>
        )}

        {/*  GRID DE PRODUCTOS  */}
        <div className="productos-grid">
          {productosFiltrados.length === 0 ? (
            <div className="no-productos">
              <div className="alert alert-info">
                No hay productos para mostrar.
              </div>
            </div>
          ) : (
            productosFiltrados.map((producto) => (
              <ProductoCard
                key={producto.id}
                producto={producto}
                capitalizar={capitalizar}
                // aquí está el ajuste para permitir anónimo/invitado
                mostrarAgregarCarrito={puedeAgregar}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

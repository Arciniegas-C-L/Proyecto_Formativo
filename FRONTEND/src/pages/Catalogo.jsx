import React, { useEffect, useState } from "react";
import { getALLProductos } from "../api/Producto.api";
import { getAllCategorias } from "../api/Categoria.api";
import "../assets/css/Catalogo.css";
import "bootstrap/dist/css/bootstrap.min.css";

export function Catalogo() {
  // Estados principales
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subcategoriasPorCategoria, setSubcategoriasPorCategoria] = useState({});
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [subcategoriaSeleccionada, setSubcategoriaSeleccionada] = useState("");
  const [tallaSeleccionada, setTallaSeleccionada] = useState({});

  // primera letra en mayúscula, resto en minúscula
  const capitalizar = (texto) =>
    texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();

  // Cargar productos y agrupar subcategorías por categoría
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

  // Cargar todas las categorías desde la API
  const cargarCategorias = async () => {
    try {
      const data = await getAllCategorias();
      const nombres = data.map((cat) => cat.nombre);
      setCategorias(nombres);
    } catch (error) {
      console.error("Error al cargar categorías:", error);
    }
  };

  // Ejecutar al montar el componente + actualizar cada 5s
  useEffect(() => {
    cargarCategorias();
    cargarProductos();

    const interval = setInterval(() => {
      cargarCategorias();
      cargarProductos();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Funciones de selección y limpieza de filtros
  const seleccionarCategoria = (cat) => {
    setCategoriaSeleccionada(cat);
    setSubcategoriaSeleccionada("");
  };

  const seleccionarSubcategoria = (sub) => {
    setSubcategoriaSeleccionada(sub);
  };

  const limpiarFiltros = () => {
    setCategoriaSeleccionada("");
    setSubcategoriaSeleccionada("");
  };

  const mostrarStock = (productoId, talla, stock) => {
    setTallaSeleccionada((prev) => ({
      ...prev,
      [productoId]: { talla, stock },
    }));
  };

  // Filtro dinámico según categoría y subcategoría seleccionada
  const productosFiltrados = productos.filter((producto) => {
    if (!categoriaSeleccionada) return true;
    if (!subcategoriaSeleccionada) {
      return producto.categoria_nombre === categoriaSeleccionada;
    }
    return (
      producto.categoria_nombre === categoriaSeleccionada &&
      producto.subcategoria_nombre === subcategoriaSeleccionada
    );
  });

  return (
    <div className="catalogo-layout container-fluid py-4">
      {/* Filtros */}
      <div className="filtros-limpios mb-4 text-center">
        <h5 className="filtro-titulo">Categorías</h5>
        <div className="filtro-grupo mb-2">
          {categorias.map((cat) => (
            <button
              key={cat}
              className={`btn btn-categoria ${categoriaSeleccionada === cat ? "active" : ""}`}
              onClick={() => seleccionarCategoria(cat)}
            >
              {capitalizar(cat)}
            </button>
          ))}
        </div>

        {/* Subcategorías si se seleccionó una categoría */}
        {categoriaSeleccionada && subcategoriasPorCategoria[categoriaSeleccionada] && (
          <>
            <h6 className="filtro-titulo">Subcategorías</h6>
            <div className="filtro-grupo mb-2">
              {subcategoriasPorCategoria[categoriaSeleccionada]?.map((sub) => (
                <button
                  key={sub}
                  className={`btn btn-subcategoria ${subcategoriaSeleccionada === sub ? "active" : ""}`}
                  onClick={() => seleccionarSubcategoria(sub)}
                >
                  {capitalizar(sub)}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Botón para limpiar filtros */}
        {(categoriaSeleccionada || subcategoriaSeleccionada) && (
          <div className="mt-2">
            <button className="btn btn-limpiar" onClick={limpiarFiltros}>
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* Catalogo de productos */}
      <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4">
        {productosFiltrados.length === 0 ? (
          <div className="col text-center">
            <div className="alert alert-warning w-100">
              No hay productos para mostrar.
            </div>
          </div>
        ) : (
          productosFiltrados.map((producto) => (
            <div className="col d-flex" key={producto.id}>
              <div className="card shadow-sm producto-card w-100 d-flex flex-column">
                <div className="img-container">
                  <img
                    src={producto.imagen}
                    alt={producto.nombre}
                    className="card-img-top"
                  />
                </div>
                <div className="card-body d-flex flex-column">
                  <h6 className="card-title fw-bold text-center">
                    {capitalizar(producto.nombre)}
                  </h6>
                  <p className="card-text descripcion text-center small">{producto.descripcion}</p>
                  <p className="card-text mb-1"><strong>Precio:</strong> ${producto.precio}</p>
                  <p className="card-text mb-1"><strong>Subcategoría:</strong> {capitalizar(producto.subcategoria_nombre)}</p>

                  <div className="mt-2">
                    <strong>Tallas:</strong>
                    <div className="d-flex flex-wrap gap-2 mt-1">
                      {producto.inventario_tallas.map((inv, i) => (
                        <button
                          key={i}
                          className={`talla-btn ${tallaSeleccionada[producto.id]?.talla === inv.talla ? "selected" : ""}`}
                          onClick={() => mostrarStock(producto.id, inv.talla, inv.stock)}
                        >
                          {inv.talla}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Mostrar stock si se seleccionó una talla */}
                  {tallaSeleccionada[producto.id] && (
                    <div className="alert alert-info mt-2 p-1 text-center">
                      Productos disponibles: <strong>{tallaSeleccionada[producto.id].stock}</strong>
                    </div>
                  )}

                  <button className="btn btn-warning mt-auto fw-semibold">
                    Agregar al carrito
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
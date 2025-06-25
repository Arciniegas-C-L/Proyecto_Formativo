import React, { useEffect, useState } from "react";
import { getALLProductos } from "../api/Producto.api";
import { getAllCategorias } from "../api/Categoria.api";
import "../assets/css/Catalogo.css";
import "bootstrap/dist/css/bootstrap.min.css";

export function Catalogo() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subcategoriasPorCategoria, setSubcategoriasPorCategoria] = useState({});
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [subcategoriaSeleccionada, setSubcategoriaSeleccionada] = useState("");
  const [tallaSeleccionada, setTallaSeleccionada] = useState({});

  //  Cargar productos y subcategorías
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

      // Armar subcategorías por categoría desde productos
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
      console.error(" Error al cargar productos:", error);
    }
  };

  //  Cargar todas las categorías 
  const cargarCategorias = async () => {
    try {
      const data = await getAllCategorias();
      const nombres = data.map((cat) => cat.nombre);
      setCategorias(nombres);
    } catch (error) {
      console.error(" Error al cargar categorías:", error);
    }
  };

  useEffect(() => {
    cargarCategorias();
    cargarProductos();

    //  recargar automáticamente cada 5 segundos
    const interval = setInterval(() => {
      cargarCategorias();
      cargarProductos();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

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
      <div className="row">
        {/*  FILTROS */}
        <div className="col-md-3 mb-4">
          <div className="card shadow-sm p-3 filtros">
            <h5 className="mb-3">Categorías</h5>
            {categorias.map((cat) => (
              <button
                key={cat}
                className={`btn btn-categoria mb-1 ${categoriaSeleccionada === cat ? "active" : ""}`}
                onClick={() => seleccionarCategoria(cat)}
              >
                {cat}
              </button>
            ))}

            {categoriaSeleccionada && subcategoriasPorCategoria[categoriaSeleccionada] && (
              <>
                <hr />
                <h6 className="mt-2">Subcategorías</h6>
                {subcategoriasPorCategoria[categoriaSeleccionada]?.map((sub) => (
                  <button
                    key={sub}
                    className={`btn btn-subcategoria mb-1 ${
                      subcategoriaSeleccionada === sub ? "btn-warning" : ""
                    }`}
                    onClick={() => seleccionarSubcategoria(sub)}
                  >
                    {sub.toUpperCase()}
                  </button>
                ))}
              </>
            )}

            {(categoriaSeleccionada || subcategoriaSeleccionada) && (
              <button className="btn btn-limpiar mt-3" onClick={limpiarFiltros}>
                LIMPIAR FILTROS
              </button>
            )}
          </div>
        </div>

        {/*  CATÁLOGO */}
        <div className="col-md-9">
          <h2 className="text-center mb-4">Catálogo de Productos</h2>
          <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-4">
            {productosFiltrados.length === 0 ? (
              <div className="col text-center">
                <div className="alert alert-warning w-100">
                  No hay productos para mostrar.
                </div>
              </div>
            ) : (
              productosFiltrados.map((producto) => (
                <div className="col d-flex" key={producto.id}>
                  <div className="card shadow producto-card w-100">
                    <div className="img-container">
                      <img
                        src={producto.imagen}
                        alt={producto.nombre}
                        className="card-img-top"
                      />
                    </div>
                    <div className="card-body d-flex flex-column">
                      <h5 className="card-title">{producto.nombre}</h5>
                      <p className="card-text descripcion">{producto.descripcion}</p>
                      <p className="card-text">
                        <strong>Precio:</strong> ${producto.precio}
                      </p>
                      <p className="card-text">
                        <strong>Subcategoría:</strong> {producto.subcategoria_nombre}
                      </p>

                      <div className="mt-2">
                        <strong>Tallas:</strong>
                        <div className="d-flex flex-wrap gap-2 mt-1">
                          {producto.inventario_tallas.map((inv, i) => (
                            <button
                              key={i}
                              className={`talla-btn ${
                                tallaSeleccionada[producto.id]?.talla === inv.talla ? "selected" : ""
                              }`}
                              onClick={() => mostrarStock(producto.id, inv.talla, inv.stock)}
                            >
                              {inv.talla}
                            </button>
                          ))}
                        </div>
                      </div>

                      {tallaSeleccionada[producto.id] && (
                        <div className="alert alert-info mt-2 p-1 text-center">
                          Productos disponibles:{" "}
                          <strong>{tallaSeleccionada[producto.id].stock}</strong>
                        </div>
                      )}

                      <button className="btn btn-dark mt-auto">AGREGAR AL CARRITO</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
import React, { useEffect, useState } from "react";
import { getALLProductos } from "../../api/Producto.api";
import { getAllCategorias } from "../../api/Categoria.api";
import Filtros from "./Filtros";
import ProductoCard from "./ProductoCard";
import "../../assets/css/Catalogo.css";
import "bootstrap/dist/css/bootstrap.min.css";

function Catalogo() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subcategoriasPorCategoria, setSubcategoriasPorCategoria] = useState({});
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [subcategoriaSeleccionada, setSubcategoriaSeleccionada] = useState("");
  const [tallaSeleccionada, setTallaSeleccionada] = useState({});

  const capitalizar = (texto) =>
    texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();

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
    <div className="container-fluid py-4 catalogo-container">
      <div className="row">
        <div className="col-md-3 mb-4">
          <Filtros
            categorias={categorias}
            subcategoriasPorCategoria={subcategoriasPorCategoria}
            categoriaSeleccionada={categoriaSeleccionada}
            subcategoriaSeleccionada={subcategoriaSeleccionada}
            seleccionarCategoria={seleccionarCategoria}
            seleccionarSubcategoria={seleccionarSubcategoria}
            limpiarFiltros={limpiarFiltros}
          />
        </div>

        <div className="col-md-9">
          <h2 className="text-center mb-4 catalogo-titulo">Catálogo de Productos</h2>
          <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-4">
            {productosFiltrados.length === 0 ? (
              <div className="col text-center">
                <div className="alert alert-warning w-100">
                  No hay productos para mostrar.
                </div>
              </div>
            ) : (
              productosFiltrados.map((producto) => (
                <ProductoCard
                  key={producto.id}
                  producto={producto}
                  tallaSeleccionada={tallaSeleccionada[producto.id]}
                  mostrarStock={mostrarStock}
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

export default Catalogo;
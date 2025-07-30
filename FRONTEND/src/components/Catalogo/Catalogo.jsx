import React, { useState, useEffect } from 'react';
import { getALLProductos } from '../../api/Producto.api';
import { getAllCategorias } from '../../api/Categoria.api';
import { createCarrito, agregarProducto, fetchCarritos } from '../../api/CarritoApi';
import Filtros from './Filtros';
import { FaMinus, FaPlus, FaShoppingCart } from 'react-icons/fa';
import '../../assets/css/Catalogo.css';
import { toast } from 'react-hot-toast';
import "bootstrap/dist/css/bootstrap.min.css";

function Catalogo() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subcategoriasPorCategoria, setSubcategoriasPorCategoria] = useState({});
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [subcategoriaSeleccionada, setSubcategoriaSeleccionada] = useState("");
  const [tallaSeleccionada, setTallaSeleccionada] = useState({});
  const [carrito, setCarrito] = useState(null);
  const [cantidades, setCantidades] = useState({});
  const [loading, setLoading] = useState(true);
  const [agregandoProducto, setAgregandoProducto] = useState(false);

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

      const cantidadesIniciales = {};
      productosValidos.forEach((producto) => {
        cantidadesIniciales[producto.idProducto] = 1;
      });
      setCantidades(cantidadesIniciales);
    } catch (error) {
      console.error("Error al cargar productos:", error);
      toast.error("Error al cargar productos");
    } finally {
      setLoading(false);
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

  const inicializarCarrito = async () => {
    try {
      const response = await fetchCarritos();
      const carritosActivos = response.data.filter(carrito => carrito.estado === true);

      if (carritosActivos.length > 0) {
        setCarrito(carritosActivos[0]);
      } else {
        const nuevoCarrito = await createCarrito({ estado: true });
        setCarrito(nuevoCarrito.data);
      }
    } catch (error) {
      console.error('Error al inicializar el carrito:', error);
      toast.error('Error al inicializar el carrito');
    }
  };

  useEffect(() => {
    cargarCategorias();
    cargarProductos();
    inicializarCarrito();

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

  const handleCambiarCantidad = (productoId, nuevaCantidad) => {
    if (nuevaCantidad < 1) return;
    setCantidades(prev => ({
      ...prev,
      [productoId]: nuevaCantidad
    }));
  };

  const handleAgregarAlCarrito = async (producto) => {
    try {
      if (!carrito) {
        await inicializarCarrito();
      }

      if (!carrito) {
        toast.error('No se pudo inicializar el carrito');
        return;
      }

      if (cantidades[producto.idProducto] <= 0) {
        toast.error('La cantidad debe ser mayor a 0');
        return;
      }

      if (cantidades[producto.idProducto] > producto.stock) {
        toast.error(`No hay suficiente stock disponible. Stock actual: ${producto.stock}`);
        return;
      }

      const response = await agregarProducto(carrito.idCarrito, {
        producto: producto.idProducto,
        cantidad: cantidades[producto.idProducto]
      });

      if (response.data) {
        const productoActualizado = response.data.items.find(item => item.producto.idProducto === producto.idProducto)?.producto;
        if (productoActualizado) {
          setProductos(prev =>
            prev.map(p =>
              p.idProducto === productoActualizado.idProducto
                ? { ...p, stock: productoActualizado.stock }
                : p
            )
          );
        }
        setCarrito(response.data);
        toast.success('Producto agregado al carrito');
      }
    } catch (error) {
      console.error('Error al agregar al carrito:', error);
      let mensajeError = 'Error al agregar el producto al carrito';

      if (error.response) {
        switch (error.response.status) {
          case 400:
            mensajeError = error.response.data.error || 'Datos inválidos';
            break;
          case 404:
            mensajeError = 'Producto o carrito no encontrado';
            break;
          case 409:
            mensajeError = 'El producto ya está en el carrito';
            break;
          default:
            mensajeError = 'Error al agregar el producto al carrito';
        }
      }

      toast.error(mensajeError);
    }
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

  if (loading) {
    return (
      <div className="catalogo-container">
        <div className="loading">Cargando productos...</div>
      </div>
    );
  }

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
                <div key={producto.idProducto} className="producto-card">
                  <div className="producto-imagen">
                    <img
                      src={producto.imagen || "https://via.placeholder.com/200"}
                      alt={producto.nombre}
                    />
                  </div>

                  <div className="producto-info">
                    <h3>{producto.nombre}</h3>
                    <p className="producto-descripcion">{producto.descripcion}</p>
                    <p className="producto-precio">${producto.precio}</p>
                    <p className="producto-categoria">{producto.categoria_nombre}</p>
                  </div>

                  <div className="producto-acciones">
                    <div className="cantidad-selector">
                      <button
                        className="btn-cantidad"
                        onClick={() => handleCambiarCantidad(producto.idProducto, cantidades[producto.idProducto] - 1)}
                        disabled={cantidades[producto.idProducto] <= 1}
                      >
                        <FaMinus />
                      </button>
                      <span>{cantidades[producto.idProducto]}</span>
                      <button
                        className="btn-cantidad"
                        onClick={() => handleCambiarCantidad(producto.idProducto, cantidades[producto.idProducto] + 1)}
                      >
                        <FaPlus />
                      </button>
                    </div>

                    <button
                      className="btn-agregar"
                      onClick={() => handleAgregarAlCarrito(producto)}
                      disabled={agregandoProducto}
                    >
                      <FaShoppingCart />
                      {agregandoProducto ? 'Agregando...' : 'Agregar al Carrito'}
                    </button>
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

export default Catalogo;
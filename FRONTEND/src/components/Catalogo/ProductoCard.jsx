// src/components/Catalogo/ProductoCard.jsx
import React, { useState } from "react";
import { Cloudinary } from "@cloudinary/url-gen";
import { fill } from "@cloudinary/url-gen/actions/resize";

import { toast } from "react-hot-toast";
import {
  agregarProducto,
  fetchCarritos,
  createCarrito,
} from "../../api/CarritoApi";
import { useAuth } from "../../context/AuthContext";
import "../../assets/css/Catalogo/ProductoCard.css";
import TallasDisponibles from "./TallasDisponibles";

export default function ProductoCard({ producto, capitalizar, onProductoAgregado }) {
  const [cantidad, setCantidad] = useState(0);
  const [tallaSeleccionada, setTallaSeleccionada] = useState(null);
  const [agregando, setAgregando] = useState(false);
  const { usuario, rol } = useAuth();

  // Validar que el producto tenga los datos esenciales (nombre)
  if (!producto || !producto.nombre) {
    console.warn("Producto con datos incompletos:", producto);
    return null;
  }

  const aumentarCantidad = () => {
    if (tallaSeleccionada) {
      const stock = tallaSeleccionada.stock || 0;
      if (cantidad < stock) setCantidad(cantidad + 1);
    } else {
      setCantidad(cantidad + 1);
    }
  };

  const disminuirCantidad = () => {
    if (cantidad > 0) setCantidad(cantidad - 1);
  };

  const mostrarStock = (_productoId, _idTalla, _stock, inventarioCompleto) => {
    setTallaSeleccionada(inventarioCompleto);
    setCantidad(0);
  };

  // Obtiene o crea carrito (protegido si hay sesión; público si no)
  const obtenerOCrearCarrito = async () => {
    // autenticado
    if (usuario?.idUsuario) {
      const carritosResponse = await fetchCarritos();
      const rows = Array.isArray(carritosResponse?.data)
        ? carritosResponse.data
        : carritosResponse?.data?.results ?? [];
      const carritosActivos = rows.filter((c) => c.estado === true || c.estado === "activo");
      if (carritosActivos.length > 0) return carritosActivos[0];

      const nuevoCarritoResponse = await createCarrito({
        usuario: usuario.idUsuario,
        estado: true,
      });
      return nuevoCarritoResponse.data;
    }

    // anónimo
    let cartId = localStorage.getItem("cartId");
    if (cartId) return { idCarrito: cartId, estado: true };

    // `createCarrito` ya usa el cliente público cuando no hay token/rol
    const nuevoCarrito = await createCarrito({ estado: true });
    const nuevoId =
      nuevoCarrito?.data?.idCarrito ??
      nuevoCarrito?.data?.id ??
      nuevoCarrito?.data?.pk ??
      null;

    if (nuevoId) {
      localStorage.setItem("cartId", String(nuevoId));
      return { ...(nuevoCarrito.data || {}), idCarrito: nuevoId, estado: true };
    }

    throw new Error("No fue posible crear el carrito anónimo");
  };

  // Agrega con retry si el carrito fue borrado (404)
  const agregarConRetrySi404 = async (carritoId, datos) => {
    try {
      // `agregarProducto` ya decide público/protegido internamente
      return await agregarProducto(carritoId, datos);
    } catch (err) {
      if (err?.response?.status === 404) {
        localStorage.removeItem("cartId");
        const nuevo = await obtenerOCrearCarrito();
        return await agregarProducto(nuevo.idCarrito, datos);
      }
      throw err;
    }
  };

  const agregarAlCarrito = async () => {
    if (!tallaSeleccionada) return toast.error("Debes seleccionar una talla");
    if (cantidad <= 0)      return toast.error("Debes seleccionar al menos una unidad");
    if (cantidad > (tallaSeleccionada?.stock || 0))
      return toast.error("La cantidad excede el stock disponible");
    if (agregando) return;

    try {
      setAgregando(true);
      const carrito = await obtenerOCrearCarrito();

      const datosParaEnviar = {
        producto: producto.id,
        cantidad: parseInt(cantidad, 10),
        talla: tallaSeleccionada.idTalla,
      };

      const response = await agregarConRetrySi404(carrito.idCarrito, datosParaEnviar);

      // persiste id de carrito anónimo si backend lo devuelve diferente
      if (response?.data && !usuario?.idUsuario) {
        const persistId = response?.data?.idCarrito || carrito.idCarrito;
        if (persistId) localStorage.setItem("cartId", String(persistId));
      }

      toast.success(`${cantidad} ${producto.nombre} agregado al carrito`);
      setCantidad(0);
      setTallaSeleccionada(null);
      window.dispatchEvent(new CustomEvent("carritoActualizado"));
      onProductoAgregado?.();
    } catch (error) {
      let mensaje = "Error al agregar al carrito";
      const st = error?.response?.status;
      if (st === 400) mensaje = error.response?.data?.error || "Datos inválidos";
      else if (st === 404) mensaje = "Producto o carrito no encontrado";
      else if (st === 409) mensaje = "El producto ya está en el carrito";
      toast.error(mensaje);
      console.error("Agregar carrito error:", error);
    } finally {
      setAgregando(false);
    }
  };

  // Cloudinary resize para imágenes subidas
  const cld = new Cloudinary({ cloud: { cloudName: "dkwr4gcpl" } });
  let imagenUrl = producto.imagen;
  if (imagenUrl && imagenUrl.includes('res.cloudinary.com')) {
    const matches = imagenUrl.match(/upload\/(?:v\d+\/)?(.+)$/);
    const publicId = matches ? matches[1] : null;
    if (publicId) {
      imagenUrl = cld.image(publicId).resize(fill().width(300).height(300)).toURL();
    }
  }

  return (
    <div className="product-card">
      <div className="product-image-container">
        {imagenUrl && (
          <img
            src={imagenUrl}
            alt={producto.nombre || "Producto"}
            className="product-image"
            onError={e => {
              e.target.onerror = null;
              e.target.style.display = 'none';
            }}
          />
        )}
      </div>

      <div className="product-info">
        {/* Nombre y precio en la misma línea */}
        <div className="product-row">
          <span className="product-title">
            {capitalizar(producto.nombre || "Sin nombre")}
          </span>
          <span className="current-price">
            ${parseFloat(producto.precio || 0).toLocaleString("es-CO", { maximumFractionDigits: 0 })}
          </span>
        </div>
         <p className="product-description">
          {producto.descripcion || "Sin descripción"}
        </p>

        {/* Tallas y talla seleccionada en la misma línea */}
        {producto.inventario_tallas && producto.inventario_tallas.length > 0 && (
          <div className="product-sizes-row">
            <span className="product-sizes-label">
            </span>
            
            <div className="product-sizes">
              <TallasDisponibles
                productoId={producto.id}
                inventarioTallas={producto.inventario_tallas}
                tallaSeleccionada={tallaSeleccionada}
                mostrarStock={mostrarStock}
              />
            </div>
            {tallaSeleccionada && (
              <span className="product-sizes-label talla-seleccionada">{tallaSeleccionada.talla}</span>
            )}
          </div>
        )}

        
        {/* Cantidad solo se muestra si hay talla seleccionada */}
        {tallaSeleccionada && (
          <div className="quantity-controls">
            <div className="quantity-selector">
              <button onClick={disminuirCantidad} className="quantity-btn" disabled={cantidad <= 0}>−</button>
              <span className="quantity-display">{cantidad}</span>
              <button
                onClick={aumentarCantidad}
                className="quantity-btn"
                disabled={cantidad >= (tallaSeleccionada.stock || 0)}
              >
                +
              </button>
            </div>
            <div className="stock-indicator">
              <small>Stock disponible: {tallaSeleccionada.stock || 0}</small>
            </div>
          </div>
        )}

        {/* Ocultar botón si el rol es administrador */}
        {rol !== "administrador" && (
          <button
            className={`add-to-cart-btn ${!tallaSeleccionada || cantidad <= 0 ? "disabled" : "active"}`}
            onClick={agregarAlCarrito}
            disabled={!tallaSeleccionada || cantidad <= 0 || agregando}
          >
            {agregando ? "Agregando..." : "Agregar al carrito"}
          </button>
        )}
      </div>
    </div>
  );
}

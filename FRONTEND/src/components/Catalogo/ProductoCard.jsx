// src/components/Catalogo/ProductoCard.jsx
import React, { useState } from "react";
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
  const { usuario } = useAuth();

  if (!producto || !producto.nombre || !producto.imagen) {
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

  return (
    <div className="product-card">
      <div className="product-image-container">
        <img
          src={producto.imagen || "https://via.placeholder.com/250x350?text=Imagen+no+disponible"}
          alt={producto.nombre || "Producto"}
          className="product-image"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "https://via.placeholder.com/250x350?text=Imagen+no+disponible";
          }}
        />
      </div>

      <div className="product-info">
        <h3 className="product-title">{capitalizar(producto.nombre || "Sin nombre")}</h3>
        <p className="product-description">{producto.descripcion || "Sin descripción"}</p>
        <div className="product-category">
          <span>{capitalizar(producto.subcategoria_nombre || "Sin categoría")}</span>
        </div>
        <div className="product-price">
          <span className="current-price">
            ${parseFloat(producto.precio || 0).toLocaleString("es-CO", { maximumFractionDigits: 0 })}
          </span>
        </div>

        {producto.inventario_tallas?.length > 0 && (
          <div className="product-sizes">
            <TallasDisponibles
              productoId={producto.id}
              inventarioTallas={producto.inventario_tallas}
              tallaSeleccionada={tallaSeleccionada}
              mostrarStock={mostrarStock}
            />
          </div>
        )}

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

        <button
          className={`add-to-cart-btn ${!tallaSeleccionada || cantidad <= 0 ? "disabled" : "active"}`}
          onClick={agregarAlCarrito}
          disabled={!tallaSeleccionada || cantidad <= 0 || agregando}
        >
          {agregando ? "Agregando..." : "Agregar al carrito"}
        </button>
      </div>
    </div>
  );
}

// src/components/Catalogo/ProductoCard.jsx
import React, { useState } from "react";
import { toast } from "react-hot-toast";
import {
  agregarProducto,        // protegido → /BACKEND/api/...
  agregarProductoAnon,    // público   → /BACKEND/...
  fetchCarritos,          // protegido
  createCarrito,          // protegido
  createCarritoAnon,      // público
} from "../../api/CarritoApi";
import { useAuth } from "../../context/AuthContext";
import "../../assets/css/Catalogo/ProductoCard.css";
import TallasDisponibles from "./TallasDisponibles";

export default function ProductoCard({
  producto,
  capitalizar,
  onProductoAgregado,
}) {
  const [cantidad, setCantidad] = useState(0);
  const [tallaSeleccionada, setTallaSeleccionada] = useState(null);
  const [agregando, setAgregando] = useState(false);
  const { usuario } = useAuth();

  // Validar datos mínimos del producto
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

  // Obtiene o crea un carrito; soporta usuario autenticado y anónimo
  const obtenerOCrearCarrito = async () => {
    // ——— Autenticado: usa endpoints protegidos
    if (usuario?.idUsuario) {
      const carritosResponse = await fetchCarritos();
      const data = carritosResponse?.data;
      const rows = Array.isArray(data) ? data : (data?.results ?? []);
      const carritosActivos = rows.filter((c) => c.estado === true);

      if (carritosActivos.length > 0) {
        return carritosActivos[0]; // ya hay carrito activo
      }

      // Crear nuevo carrito ligado al usuario
      const nuevoCarritoResponse = await createCarrito({
        usuario: usuario.idUsuario,
        estado: true,
      });
      return nuevoCarritoResponse.data;
    }

    // ——— Anónimo: usa localStorage + endpoints públicos
    let cartId = localStorage.getItem("cartId");
    if (cartId) {
      return { idCarrito: cartId, estado: true };
    }

    // Crear carrito anónimo (sin usuario) en router público
    const nuevoCarritoAnon = await createCarritoAnon({ estado: true });
    const nuevoId =
      nuevoCarritoAnon?.data?.idCarrito ??
      nuevoCarritoAnon?.data?.id ??
      null;

    if (nuevoId) {
      localStorage.setItem("cartId", String(nuevoId));
      // normaliza forma esperada
      return { ...(nuevoCarritoAnon.data || {}), idCarrito: nuevoId, estado: true };
    }

    throw new Error("No fue posible crear el carrito anónimo");
  };

  // Agregar con reintento si 404 (carrito expirado/no existe)
  const agregarConRetrySi404 = async (carritoId, datos) => {
    // Elige endpoint según si hay usuario
    const addFn = usuario?.idUsuario ? agregarProducto : agregarProductoAnon;

    try {
      return await addFn(carritoId, datos);
    } catch (err) {
      if (err?.response?.status === 404) {
        console.warn("Carrito no encontrado. Se creará uno nuevo y se reintentará.");
        localStorage.removeItem("cartId");
        const nuevoCarrito = await obtenerOCrearCarrito();
        return await addFn(nuevoCarrito.idCarrito, datos);
      }
      throw err;
    }
  };

  const agregarAlCarrito = async () => {
    if (!tallaSeleccionada) {
      toast.error("Debes seleccionar una talla");
      return;
    }
    if (cantidad <= 0) {
      toast.error("Debes seleccionar al menos una unidad");
      return;
    }
    if (cantidad > (tallaSeleccionada?.stock || 0)) {
      toast.error("La cantidad excede el stock disponible");
      return;
    }
    if (agregando) return;

    try {
      setAgregando(true);

      // 1) Obtener/crear carrito (auth o anónimo)
      let carrito;
      try {
        carrito = await obtenerOCrearCarrito();
      } catch (error) {
        console.error("Error al obtener/crear carrito:", error);
        toast.error("Error al acceder al carrito");
        return;
      }

      // 2) Datos para agregar
      const datosParaEnviar = {
        producto: producto.id,
        cantidad: parseInt(cantidad, 10),
        talla: tallaSeleccionada.idTalla,
      };

      // 3) Agregar usando endpoint correcto (según auth)
      const response = await agregarConRetrySi404(carrito.idCarrito, datosParaEnviar);

      // 4) Si soy anónimo, persistir id por si el backend devolvió otro
      if (!usuario?.idUsuario) {
        const idPersistente =
          response?.data?.idCarrito ??
          response?.data?.id ??
          carrito.idCarrito;
        if (idPersistente) localStorage.setItem("cartId", String(idPersistente));
      }

      toast.success(`${cantidad} ${producto.nombre} agregado al carrito`);
      setCantidad(0);
      setTallaSeleccionada(null);

      // Actualizar header/notificadores
      window.dispatchEvent(new CustomEvent("carritoActualizado"));
      if (onProductoAgregado) onProductoAgregado();
    } catch (error) {
      console.error("Error completo al agregar al carrito:", error);
      let mensajeError = "Error al agregar al carrito";
      if (error?.response) {
        switch (error.response.status) {
          case 400:
            mensajeError = error.response.data?.error || "Datos inválidos";
            break;
          case 404:
            mensajeError = "Producto o carrito no encontrado";
            break;
          case 409:
            mensajeError = "El producto ya está en el carrito";
            break;
          default:
            mensajeError = "Error al agregar al carrito";
        }
      }
      toast.error(mensajeError);
    } finally {
      setAgregando(false);
    }
  };

  return (
    <div className="product-card">
      <div className="product-image-container">
        <img
          src={
            producto.imagen ||
            "https://via.placeholder.com/250x350?text=Imagen+no+disponible"
          }
          alt={producto.nombre || "Producto"}
          className="product-image"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src =
              "https://via.placeholder.com/250x350?text=Imagen+no+disponible";
          }}
        />
      </div>

      <div className="product-info">
        <h3 className="product-title">
          {capitalizar(producto.nombre || "Sin nombre")}
        </h3>

        <p className="product-description">
          {producto.descripcion || "Sin descripción"}
        </p>

        <div className="product-category">
          <span>
            {capitalizar(producto.subcategoria_nombre || "Sin categoría")}
          </span>
        </div>

        <div className="product-price">
          <span className="current-price">
            $
            {parseFloat(producto.precio || 0).toLocaleString("es-CO", {
              maximumFractionDigits: 0,
            })}
          </span>
        </div>

        {/* Tallas */}
        {producto.inventario_tallas &&
          producto.inventario_tallas.length > 0 && (
            <div className="product-sizes">
              <TallasDisponibles
                productoId={producto.id}
                inventarioTallas={producto.inventario_tallas}
                tallaSeleccionada={tallaSeleccionada}
                mostrarStock={mostrarStock}
              />
            </div>
          )}

        {/* Cantidad solo si hay talla seleccionada */}
        {tallaSeleccionada && (
          <div className="quantity-controls">
            <div className="quantity-selector">
              <button
                onClick={disminuirCantidad}
                className="quantity-btn"
                disabled={cantidad <= 0}
              >
                −
              </button>
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
          className={`add-to-cart-btn ${
            !tallaSeleccionada || cantidad <= 0 ? "disabled" : "active"
          }`}
          onClick={agregarAlCarrito}
          disabled={!tallaSeleccionada || cantidad <= 0 || agregando}
        >
          {agregando ? "Agregando..." : "Agregar al carrito"}
        </button>
      </div>
    </div>
  );
}

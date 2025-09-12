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

export default function ProductoCard({
  producto,
  capitalizar,
  onProductoAgregado,
}) {
  const [cantidad, setCantidad] = useState(0);
  const [tallaSeleccionada, setTallaSeleccionada] = useState(null);
  const [agregando, setAgregando] = useState(false);
  const { usuario } = useAuth();

  // Validar que el producto tenga todos los datos necesarios
  if (!producto || !producto.nombre || !producto.imagen) {
    console.warn("Producto con datos incompletos:", producto);
    return null; // No renderizar si faltan datos esenciales
  }

  const aumentarCantidad = () => {
    if (tallaSeleccionada) {
      const stock = tallaSeleccionada.stock || 0;
      if (cantidad < stock) setCantidad((prev) => prev + 1);
    } else {
      setCantidad((prev) => prev + 1);
    }
  };

  const disminuirCantidad = () => {
    if (cantidad > 0) setCantidad((prev) => prev - 1);
  };

  const mostrarStock = (productoId, idTalla, stock, inventarioCompleto) => {
    setTallaSeleccionada(inventarioCompleto);
    setCantidad(0);
  };

  const agregarAlCarrito = async () => {
    if (!usuario) {
      toast.error("Debes iniciar sesión para agregar productos al carrito");
      return;
    }

    if (!tallaSeleccionada) {
      toast.error("Debes seleccionar una talla");
      return;
    }

    if (cantidad <= 0) {
      toast.error("Debes seleccionar al menos una unidad");
      return;
    }

    if (cantidad > tallaSeleccionada.stock) {
      toast.error("La cantidad excede el stock disponible");
      return;
    }

    try {
      setAgregando(true);

      // Obtener o crear carrito
      let carrito = null;
      try {
        const carritosResponse = await fetchCarritos();
        const carritosActivos = carritosResponse.data.filter(
          (c) => c.estado === true
        );

        if (carritosActivos.length > 0) {
          carrito = carritosActivos[0];
        } else {
          // Crear nuevo carrito si no existe uno activo
          const nuevoCarritoResponse = await createCarrito({
            usuario: usuario.idUsuario,
            estado: true,
          });
          carrito = nuevoCarritoResponse.data;
        }
      } catch (error) {
        console.error("Error al obtener/crear carrito:", error);
        toast.error("Error al acceder al carrito");
        return;
      }

      // Agregar producto al carrito
      const response = await agregarProducto(carrito.idCarrito, {
        producto: producto.id,
        cantidad: cantidad,
        talla: tallaSeleccionada.idTalla,
      });

      if (response.data) {
        toast.success(`${cantidad} ${producto.nombre} agregado al carrito`);
        setCantidad(0);
        setTallaSeleccionada(null);

        // Disparar evento personalizado para actualizar el header
        window.dispatchEvent(new CustomEvent("carritoActualizado"));

        // Notificar al componente padre que se agregó un producto
        if (onProductoAgregado) {
          onProductoAgregado();
        }
      }
    } catch (error) {
      console.error("Error al agregar al carrito:", error);
      let mensajeError = "Error al agregar al carrito";

      if (error.response) {
        switch (error.response.status) {
          case 400:
            mensajeError = error.response.data.error || "Datos inválidos";
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

        {/* Cantidad solo se muestra si hay talla seleccionada */}
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

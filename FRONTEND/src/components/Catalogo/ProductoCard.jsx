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

  // Validar que el producto tenga los datos esenciales (nombre)
  if (!producto || !producto.nombre) {
    console.warn("Producto con datos incompletos:", producto);
    return null; // No renderizar si faltan datos esenciales
  }

  const aumentarCantidad = () => {
    if (tallaSeleccionada) {
      const stock = tallaSeleccionada.stock || 0;
      if (cantidad < stock) {
        const nuevaCantidad = cantidad + 1;
        console.log('Aumentando cantidad de', cantidad, 'a', nuevaCantidad);
        setCantidad(nuevaCantidad);
      }
    } else {
      const nuevaCantidad = cantidad + 1;
      console.log('Aumentando cantidad (sin talla) de', cantidad, 'a', nuevaCantidad);
      setCantidad(nuevaCantidad);
    }
  };

  const disminuirCantidad = () => {
    if (cantidad > 0) {
      const nuevaCantidad = cantidad - 1;
      console.log('Disminuyendo cantidad de', cantidad, 'a', nuevaCantidad);
      setCantidad(nuevaCantidad);
    }
  };

  const mostrarStock = (productoId, idTalla, stock, inventarioCompleto) => {
    setTallaSeleccionada(inventarioCompleto);
    setCantidad(0);
  };

  const agregarAlCarrito = async () => {
    // AGREGAR DEBUG LOGGING
    console.log('=== INICIO agregarAlCarrito ===');
    console.log('Usuario:', usuario?.idUsuario);
    console.log('Producto ID:', producto.id);
    console.log('Cantidad seleccionada:', cantidad);
    console.log('Talla seleccionada:', tallaSeleccionada);
    console.log('Estado agregando:', agregando);

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

    // PREVENIR MÚLTIPLES EJECUCIONES
    if (agregando) {
      console.log('Ya está agregando, saliendo...');
      return;
    }

    try {
      console.log('Iniciando proceso de agregar...');
      setAgregando(true);

      // Obtener o crear carrito
      let carrito = null;
      try {
        console.log('Obteniendo carritos...');
        const carritosResponse = await fetchCarritos();
        console.log('Carritos obtenidos:', carritosResponse.data);
        
        const carritosActivos = carritosResponse.data.filter(
          (c) => c.estado === true
        );

        if (carritosActivos.length > 0) {
          carrito = carritosActivos[0];
          console.log('Carrito activo encontrado:', carrito.idCarrito);
        } else {
          // Crear nuevo carrito si no existe uno activo
          console.log('Creando nuevo carrito...');
          const nuevoCarritoResponse = await createCarrito({
            usuario: usuario.idUsuario,
            estado: true,
          });
          carrito = nuevoCarritoResponse.data;
          console.log('Nuevo carrito creado:', carrito.idCarrito);
        }
      } catch (error) {
        console.error("Error al obtener/crear carrito:", error);
        toast.error("Error al acceder al carrito");
        return;
      }

      // Preparar datos para enviar
      const datosParaEnviar = {
        producto: producto.id,
        cantidad: parseInt(cantidad),
        talla: tallaSeleccionada.idTalla,
      };

      console.log('Datos a enviar:', datosParaEnviar);
      console.log('ID del carrito:', carrito.idCarrito);

      // Agregar producto al carrito
      console.log('Llamando a agregarProducto...');
      const response = await agregarProducto(carrito.idCarrito, datosParaEnviar);
      
      console.log('Respuesta de agregarProducto:', response);

      if (response.data) {
        console.log('Producto agregado exitosamente');
        toast.success(`${cantidad} ${producto.nombre} agregado al carrito`);
        setCantidad(0);
        setTallaSeleccionada(null);

        // Disparar evento personalizado para actualizar el header
        window.dispatchEvent(new CustomEvent("carritoActualizado"));

        // Notificar al componente padre que se agregó un producto
        if (onProductoAgregado) {
          console.log('Llamando a onProductoAgregado...');
          onProductoAgregado();
        }
      }
    } catch (error) {
      console.error("Error completo al agregar al carrito:", error);
      
      // Log detallado de la respuesta del servidor
      if (error.response) {
        console.error("Respuesta del servidor:", error.response.data);
        console.error("Status:", error.response.status);
        console.error("Headers:", error.response.headers);
      }
      
      let mensajeError = "Error al agregar al carrito";

      if (error.response) {
        switch (error.response.status) {
          case 400:
            mensajeError = error.response.data.error || "Datos inválidos";
            console.error("Mensaje específico del servidor:", error.response.data);
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
      console.log('Finalizando proceso de agregar...');
      setAgregando(false);
      console.log('=== FIN agregarAlCarrito ===');
    }
  };

  return (
    <div className="product-card">
      <div className="product-image-container">
        {producto.imagen && (
          <img
            src={producto.imagen}
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
// src/components/Carrito/Carrito.jsx
import ProductoCard from '../Catalogo/ProductoCard';
import { useAuth } from '../../context/AuthContext';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FaTrash, FaMinus, FaPlus, FaShoppingCart, FaEye, FaMapMarkerAlt, FaPhone } from 'react-icons/fa';

import {
  fetchCarritos,
  getCarrito,            // <<<<<<<<<<<<<< NUEVO
  actualizarCantidad,
  eliminarProducto,
  limpiarCarrito,
  crearPreferenciaPago,
  adoptarCarritoAnon,
} from '../../api/CarritoApi';
import { getALLProductos } from '../../api/Producto.api';
import '../../assets/css/Carrito/Carrito.css';

const API_BASE_URL = "http://127.0.0.1:8000";
const MP_PUBLIC_KEY_TEST = import.meta?.env?.VITE_MP_PUBLIC_KEY || "TEST-PUBLIC-KEY-AQUI";

// No tocar stock en acciones de carrito
const NO_STOCK_TOUCH = { skip_stock: true, reserve: false };

function useMercadoPagoLoader(publicKey) {
  const [loaded, setLoaded] = useState(!!window.MercadoPago);

  useEffect(() => {
    if (window.MercadoPago) {
      setLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = "https://sdk.mercadopago.com/js/v2";
    script.async = true;
    script.onload = () => setLoaded(true);
    script.onerror = () => {
      console.error('No se pudo cargar el SDK de Mercado Pago');
      setLoaded(false);
    };
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (loaded && window.MercadoPago && publicKey) {
      // const mp = new window.MercadoPago(publicKey, { locale: 'es-CO' });
    }
  }, [loaded, publicKey]);

  return loaded;
}

export function Carrito() {
  const navigate = useNavigate();
  const { autenticado, usuario } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [carrito, setCarrito] = useState(null);
  const [items, setItems] = useState([]);
  const [productosRecomendados, setProductosRecomendados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creatingPreference, setCreatingPreference] = useState(false);

  // NUEVOS CAMPOS
  const [ciudad, setCiudad]   = useState("");
  const [barrio, setBarrio]   = useState("");
  const [calle,  setCalle]    = useState("");

  // Teléfono y dirección (string opcional como complemento)
  const [telefono, setTelefono] = useState(usuario?.telefono || "");
  const [direccion, setDireccion] = useState(usuario?.direccion || "");
  const [formErrors, setFormErrors] = useState({});
  const didTryAdopt = useRef(false);

  const mpLoaded = useMercadoPagoLoader(MP_PUBLIC_KEY_TEST);

  useEffect(() => {
    cargarCarrito();
    cargarProductosRecomendados();

    const onCarritoActualizado = () => cargarCarrito();
    window.addEventListener("carritoActualizado", onCarritoActualizado);
    return () => window.removeEventListener("carritoActualizado", onCarritoActualizado);
  }, []);

  useEffect(() => {
    const tryAdopt = async () => {
      if (!autenticado) return;
      if (didTryAdopt.current) return;
      didTryAdopt.current = true;

      const cartId = localStorage.getItem("cartId");
      if (!cartId) return;
      try {
        await adoptarCarritoAnon(cartId);
        localStorage.removeItem("cartId");
        window.dispatchEvent(new CustomEvent("carritoActualizado"));
        toast.success("Se migró tu carrito a tu cuenta");
      } catch (e) {
        // Silenciar
      }
    };

    tryAdopt();
  }, [autenticado]);

  // Normaliza response.data (array | {results: []} | objeto)
  const cargarCarrito = async () => {
    try {
      setLoading(true);
      setError(null);

      let data;

      if (!autenticado) {
        const lsId = localStorage.getItem("cartId");
        if (!lsId) {
          setCarrito(null);
          setItems([]);
          setLoading(false);
          return;
        }
        try {
          const resp = await getCarrito(lsId);
          data = resp?.data;
        } catch (e) {
          if (e?.response?.status === 404) {
            localStorage.removeItem("cartId");
            setCarrito(null);
            setItems([]);
            setLoading(false);
            return;
          }
          throw e;
        }
      } else {
        const response = await fetchCarritos();
        data = response?.data;
      }

      const carritos = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
        ? data.results
        : data
        ? [data]
        : [];

      const carritosActivos = carritos.filter(
        c => c?.estado === true || c?.estado === 'activo'
      );

      if (carritosActivos.length) {
        const carritoActivo = carritosActivos[0];
        setCarrito(carritoActivo);

        const listaItems = Array.isArray(carritoActivo?.items)
          ? carritoActivo.items
          : Array.isArray(carritoActivo?.carrito_items)
          ? carritoActivo.carrito_items
          : [];

        setItems(listaItems);
      } else {
        setCarrito(null);
        setItems([]);
      }
    } catch (e) {
      console.error('Error al cargar el carrito:', e);
      setError('Error al cargar el carrito');
      toast.error('Error al cargar el carrito');
      setCarrito(null);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const cargarProductosRecomendados = async () => {
    try {
      const response = await getALLProductos();
      const productos = response.data || [];
      const productosValidos = productos.filter(p =>
        p && p.nombre && p.imagen && p.precio && p.inventario_tallas?.length > 0
      );
      const productosAleatorios = productosValidos
        .sort(() => 0.5 - Math.random())
        .slice(0, 10);
      setProductosRecomendados(productosAleatorios);
    } catch (e) {
      console.error('Error al cargar productos recomendados:', e);
    }
  };

  const handleActualizarCantidad = async (itemId, nuevaCantidad) => {
    try {
      if (!carrito) return;
      const response = await actualizarCantidad(
        carrito.idCarrito,
        itemId,
        nuevaCantidad,
        NO_STOCK_TOUCH
      );
      const data = response.data;
      if (data?.items && Array.isArray(data.items)) {
        const itemsActualizados = data.items
          .map(item => item?.producto ? {
            ...item,
            producto: { ...item.producto, imagen: item.producto.imagen || "https://via.placeholder.com/100" }
          } : null)
          .filter(Boolean);
        setCarrito({ ...data, items: itemsActualizados });
        setItems(itemsActualizados);
        toast.success('Cantidad actualizada');
      } else {
        toast.error('Error al actualizar la cantidad: datos inválidos');
      }
    } catch (e) {
      console.error('Error al actualizar cantidad:', e);
      const status = e?.response?.status;
      const msg =
        status === 400 ? (e.response.data?.error || 'Datos inválidos') :
        status === 404 ? 'Producto no encontrado en el carrito' :
        'Error al actualizar la cantidad';
      toast.error(msg);
    }
  };

  const handleEliminarProducto = async (itemId) => {
    try {
      if (!carrito) return;
      const response = await eliminarProducto(carrito.idCarrito, itemId, NO_STOCK_TOUCH);
      setCarrito(response.data);
      setItems(response.data?.items || []);
      toast.success('Producto eliminado del carrito');
    } catch (e) {
      console.error('Error al eliminar producto:', e);
      toast.error('Error al eliminar el producto');
    }
  };

  const handleLimpiarCarrito = async () => {
    try {
      if (!carrito) return;
      const response = await limpiarCarrito(carrito.idCarrito, NO_STOCK_TOUCH);
      setCarrito(response.data);
      setItems([]);
      toast.success('Carrito limpiado');
    } catch (e) {
      console.error('Error al limpiar carrito:', e);
      toast.error('Error al limpiar el carrito');
    }
  };

  // Validación: Teléfono + (ciudad/barrio/calle) O dirección string como respaldo
  const validar = () => {
    const errs = {};
    if (!telefono?.trim() || telefono.trim().length < 7) errs.telefono = 'Teléfono inválido';

    const hasDict = !!(ciudad.trim() && barrio.trim() && calle.trim());
    if (!hasDict) {
      if (!direccion?.trim() || direccion.trim().length < 5) {
        errs.direccion = 'Completa ciudad, barrio y calle, o escribe una dirección válida';
      }
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Crear preferencia y redirigir
  const handlePagar = async () => {
    try {
      if (!carrito || items.length === 0) {
        toast.error("Tu carrito está vacío");
        return;
      }
      if (!mpLoaded || !window.MercadoPago) {
        toast.error("SDK de Mercado Pago no está disponible");
        return;
      }
      if (!autenticado) {
        setShowLoginModal(true);
        setTimeout(() => {
          setShowLoginModal(false);
          navigate("/sesion");
        }, 5000);
        return;
      }
      if (!validar()) {
        toast.error("Revisa los datos de envío");
        return;
      }

      setCreatingPreference(true);

      // Respetar max_length=255
      const direccionTrimmed = (direccion || "").trim().slice(0, 255);

      // Si hay ciudad+barrio+calle → enviar dict con las keys que espera el backend
      // (linea1, linea2, referencia, ciudad). Si no, enviar string como fallback.
      const hasDict = !!(ciudad.trim() && barrio.trim() && calle.trim());
      const address = hasDict
        ? {
            linea1: calle.trim(),            // Calle principal
            linea2: direccionTrimmed,        // Complemento opcional (apto/torre)
            referencia: barrio.trim(),       // Barrio
            ciudad: ciudad.trim(),           // Ciudad
            // departamento lo puedes agregar luego si tienes el input
          }
        : direccionTrimmed;                  // Fallback string

      const payload = {
        email: usuario?.correo || usuario?.email,
        address,
      };

      const { data } = await crearPreferenciaPago(carrito.idCarrito, payload);

      if (!data?.init_point) {
        toast.error("Regístrese o inicie sesión para completar pago");
        return;
      }

      window.location.href = data.init_point;
    } catch (err) {
      console.error("Error al crear preferencia:", err);

      if (err?.response?.status === 403) {
        toast.error("No se puede ordenar hasta iniciar sesión", {
          position: "top-right",
          autoClose: 3000,
        });

        setShowLoginModal(true);
        setTimeout(() => {
          setShowLoginModal(false);
          navigate("/sesion");
        }, 3000);

        return;
      }

      const detalle = err?.response?.data?.detalle;
      const msg =
        detalle?.message ||
        detalle?.error ||
        detalle?.cause?.[0]?.description ||
        err?.response?.data?.error ||
        "Error al iniciar el pago";
      toast.error(msg);
    } finally {
      setCreatingPreference(false);
    }
  };

  const handleFinalizarCompra = async () => {
    await handlePagar();
  };

  const calcularTotal = () => {
    const total = items.reduce((acc, item) => acc + (parseFloat(item.subtotal) || 0), 0);
    return total.toLocaleString('es-CO', { maximumFractionDigits: 0 });
  };

  const getImagenUrl = (imagenPath) => {
    if (!imagenPath) return "https://via.placeholder.com/100";
    if (imagenPath.startsWith('http')) return imagenPath;
    return `${API_BASE_URL}${imagenPath}`;
  };

  const capitalizar = (texto) => {
    if (!texto) return '';
    return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
  };

  if (loading) {
    return (
      <div className="carrito-container">
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Cargando carrito...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="carrito-container">
        <div className="error-message">
          <p>{error}</p>
          <button onClick={cargarCarrito} className="btn-reintentar">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="carrito-container">
      <h1><FaShoppingCart /> Carrito de Compras</h1>

      {showLoginModal && (
        <div className="modal fade show" style={{display: 'block', background: 'rgba(0,0,0,0.5)'}} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Iniciar sesión requerido</h5>
              </div>
              <div className="modal-body">
                <p>Debes iniciar sesión para finalizar la compra. Serás redirigido en 5 segundos...</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {(!carrito || items.length === 0) ? (
        <div className="carrito-vacio">
          <h2>Tu carrito está vacío</h2>
          <p>Agrega algunos productos para comenzar a comprar</p>
          <button
            className="btn-seguir-comprando"
            onClick={() => navigate('/catalogo')}
          >
            Ver catálogo
          </button>
        </div>
      ) : (
        <div className="carrito-contenido">
          <div className="carrito-layout">
            {/* Columna izquierda */}
            <div className="carrito-items-section">
              <h2>Productos en tu carrito ({items.length})</h2>
              <div className="carrito-items">
                {items.map((item) => (
                  <div key={item.idCarritoItem} className="carrito-item">
                    <div className="item-imagen">
                      <img
                        src={getImagenUrl(item.producto?.imagen)}
                        alt={item.producto?.nombre || "Producto"}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://via.placeholder.com/100";
                        }}
                      />
                    </div>

                    <div className="item-info">
                      <h4>{item.producto?.nombre}</h4>
                      <p className="item-descripcion">{item.producto?.descripcion}</p>

                      {item.talla && (
                        <p className="item-talla">
                          <strong>Talla:</strong>{" "}
                          {typeof item.talla === 'object' && item.talla !== null
                            ? (item.talla.nombre || '-')
                            : (typeof item.talla === 'string' ? item.talla : '-')}
                        </p>
                      )}

                      <div className="item-precio-cantidad">
                        <p className="item-precio">
                          ${parseFloat(item.precio_unitario).toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                        </p>

                        <div className="item-cantidad">
                          <button
                            onClick={() => handleActualizarCantidad(item.idCarritoItem, item.cantidad - 1)}
                            disabled={creatingPreference || item.cantidad <= 1}
                          >
                            <FaMinus />
                          </button>
                          <span>{item.cantidad}</span>
                          <button
                            onClick={() => handleActualizarCantidad(item.idCarritoItem, item.cantidad + 1)}
                            disabled={creatingPreference}
                          >
                            <FaPlus />
                          </button>
                        </div>
                      </div>

                      <p className="item-subtotal">
                        Subtotal: ${parseFloat(item.subtotal).toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                      </p>
                    </div>

                    <button
                      className="btn-eliminar"
                      onClick={() => handleEliminarProducto(item.idCarritoItem)}
                      title="Eliminar producto"
                      disabled={creatingPreference}
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Columna derecha */}
            <div className="carrito-resumen-section">
              <div className="carrito-resumen">
                <h2>Resumen del Pedido</h2>
                <div className="resumen-detalles">
                  <div className="resumen-linea">
                    <span>Total de productos:</span>
                    <span>{items.length}</span>
                  </div>
                  <div className="resumen-linea">
                    <span>Cantidad total:</span>
                    <span>{items.reduce((total, item) => total + item.cantidad, 0)}</span>
                  </div>
                  <div className="resumen-linea total">
                    <span>Total a pagar:</span>
                    <span>${calcularTotal()}</span>
                  </div>
                </div>

                {/* Datos de envío */}
                <div className="direccion-envio-card">
                  <h3><FaMapMarkerAlt /> Datos de envío</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label><FaPhone /> Teléfono</label>
                      <input
                        type="tel"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        placeholder="Ej: 3160813975"
                        disabled={creatingPreference}
                        maxLength={10}
                        minLength={10}
                      />
                      {formErrors.telefono && <small className="error">{formErrors.telefono}</small>}
                    </div>

                    {/* NUEVOS CAMPOS */}
                    <div className="form-group">
                      <label>Ciudad</label>
                      <input
                        type="text"
                        value={ciudad}
                        onChange={(e) => setCiudad(e.target.value)}
                        placeholder="Ej: Ibagué"
                        disabled={creatingPreference}
                        maxLength={20}
                      />
                    </div>

                    <div className="form-group">
                      <label>Barrio</label>
                      <input
                        type="text"
                        value={barrio}
                        onChange={(e) => setBarrio(e.target.value)}
                        placeholder="Ej: Los Tunjos"
                        disabled={creatingPreference}
                        maxLength={20}
                      />
                    </div>

                    <div className="form-group">
                      <label>Calle</label>
                      <input
                        type="text"
                        value={calle}
                        onChange={(e) => setCalle(e.target.value)}
                        placeholder="Ej: Calle 10 #5-23"
                        disabled={creatingPreference}
                        maxLength={20}
                      />
                    </div>

                    {/* Complemento opcional como string */}
                    <div className="form-group form-group-col2">
                      <label>Dirección (complemento opcional)</label>
                      <input
                        type="text"
                        value={direccion}
                        onChange={(e) => setDireccion(e.target.value)}
                        placeholder="Apto, torre, interior…"
                        disabled={creatingPreference}
                        maxLength={20}
                      />
                      {formErrors.direccion && <small className="error">{formErrors.direccion}</small>}
                    </div>
                  </div>
                </div>

                <div className="resumen-acciones">
                  <button
                    className="btn-limpiar"
                    onClick={handleLimpiarCarrito}
                    disabled={creatingPreference}
                  >
                    Limpiar Carrito
                  </button>
                  <button
                    className="btn-finalizar"
                    onClick={handleFinalizarCompra}
                    disabled={creatingPreference}
                  >
                    {creatingPreference ? "Preparando pago..." : "Finalizar Compra"}
                  </button>
                </div>
                {!mpLoaded && (
                  <p style={{ marginTop: 8, fontSize: 12 }}>
                    Cargando SDK de Mercado Pago…
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="productos-recomendados-section">
        <h2><FaEye /> También te puede interesar</h2>
        <div className="productos-recomendados row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3">
          {productosRecomendados.map((producto) => (
            <ProductoCard
              key={producto.id}
              producto={producto}
              capitalizar={capitalizar}
            />
          ))}
        </div>
      </div>
      <div className="ver-mas-container">
          <button
            className="btn-ver-mas"
            onClick={() => navigate('/catalogo')}
          >
            Ver más productos
          </button>
        </div>
    </div>
  );
}

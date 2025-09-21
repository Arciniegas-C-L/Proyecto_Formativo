import ProductoCard from '../Catalogo/ProductoCard';
import ProductoRecomendado from './ProductoRecomendado';
import { useAuth } from '../../context/AuthContext';
import ConfirmarCompra from './ConfirmarCompra';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FaTrash, FaMinus, FaPlus, FaShoppingCart, FaEye, FaMapMarkerAlt, FaPhone, FaUser } from 'react-icons/fa';
import {
  fetchCarritos,
  actualizarCantidad,
  eliminarProducto,
  limpiarCarrito,
  finalizarCompra,     // por si lo usas fuera de MP
  crearPreferenciaPago // 🔥 integración Mercado Pago (actualizado para aceptar address)
} from '../../api/CarritoApi';
import { getALLProductos } from '../../api/Producto.api';
import '../../assets/css/Carrito/Carrito.css';

const API_BASE_URL = "http://127.0.0.1:8000"; // Backend Django
const MP_PUBLIC_KEY_TEST = import.meta?.env?.VITE_MP_PUBLIC_KEY || "TEST-PUBLIC-KEY-AQUI";

// 👉 bandera para decirle al backend que NO toque stock en acciones del carrito
const NO_STOCK_TOUCH = { skip_stock: true, reserve: false };

// Hook para cargar el SDK de Mercado Pago si no está presente
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
      // Si más adelante usas Bricks:
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

  // 📦 Dirección de envío
  const [address, setAddress] = useState({
    nombre: usuario?.nombre || "",
    telefono: usuario?.telefono || "",
    departamento: "",
    ciudad: "",
    linea1: "",
    linea2: "",
    referencia: ""
  });
  const [addressErrors, setAddressErrors] = useState({});

  const mpLoaded = useMercadoPagoLoader(MP_PUBLIC_KEY_TEST);

  useEffect(() => {
    cargarCarrito();
    cargarProductosRecomendados();
  }, []);

  const cargarCarrito = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchCarritos();
      const carritosActivos = (response.data || []).filter(c => c.estado === true);
      if (carritosActivos.length > 0) {
        const carritoActivo = carritosActivos[0];
        setCarrito(carritoActivo);
        setItems(Array.isArray(carritoActivo.items) ? carritoActivo.items : []);
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

  // ✅ Validación simple de la dirección
  const validarAddress = () => {
    const errs = {};
    if (!address.nombre?.trim()) errs.nombre = 'Requerido';
    if (!address.telefono?.trim() || address.telefono.trim().length < 7) errs.telefono = 'Teléfono inválido';
    if (!address.departamento?.trim()) errs.departamento = 'Requerido';
    if (!address.ciudad?.trim()) errs.ciudad = 'Requerido';
    if (!address.linea1?.trim() || address.linea1.trim().length < 5) errs.linea1 = 'Dirección muy corta';
    setAddressErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Pago (crea preferencia y redirige)
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
          navigate('/sesion');
        }, 5000);
        return;
      }
      if (!validarAddress()) {
        toast.error("Por favor completa la dirección de envío");
        return;
      }

      setCreatingPreference(true);

      const payload = {
        email: usuario?.email,
        address: {
          nombre: address.nombre.trim(),
          telefono: address.telefono.trim(),
          departamento: address.departamento.trim(),
          ciudad: address.ciudad.trim(),
          linea1: address.linea1.trim(),
          linea2: address.linea2?.trim() || "",
          referencia: address.referencia?.trim() || ""
        }
      };

      const { data } = await crearPreferenciaPago(carrito.idCarrito, payload);

      if (!data?.init_point) {
        toast.error("No se pudo crear la preferencia de pago");
        return;
      }
      window.location.href = data.init_point;
    } catch (err) {
      console.error("Error al crear preferencia:", err);
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

                {/* 🏠 Datos de envío */}
                <div className="direccion-envio-card">
                  <h3><FaMapMarkerAlt /> Datos de envío</h3>

                  <div className="form-grid">
                    <div className="form-group">
                      <label><FaUser /> Nombre y Apellido</label>
                      <input
                        type="text"
                        value={address.nombre}
                        onChange={(e) => setAddress({ ...address, nombre: e.target.value })}
                        placeholder="Ej: Juan Pérez"
                        disabled={creatingPreference}
                      />
                      {addressErrors.nombre && <small className="error">{addressErrors.nombre}</small>}
                    </div>

                    <div className="form-group">
                      <label><FaPhone /> Teléfono</label>
                      <input
                        type="tel"
                        value={address.telefono}
                        onChange={(e) => setAddress({ ...address, telefono: e.target.value })}
                        placeholder="Ej: 3001234567"
                        disabled={creatingPreference}
                      />
                      {addressErrors.telefono && <small className="error">{addressErrors.telefono}</small>}
                    </div>

                    <div className="form-group">
                      <label>Departamento</label>
                      <input
                        type="text"
                        value={address.departamento}
                        onChange={(e) => setAddress({ ...address, departamento: e.target.value })}
                        placeholder="Ej: Cundinamarca"
                        disabled={creatingPreference}
                      />
                      {addressErrors.departamento && <small className="error">{addressErrors.departamento}</small>}
                    </div>

                    <div className="form-group">
                      <label>Ciudad / Municipio</label>
                      <input
                        type="text"
                        value={address.ciudad}
                        onChange={(e) => setAddress({ ...address, ciudad: e.target.value })}
                        placeholder="Ej: Bogotá"
                        disabled={creatingPreference}
                      />
                      {addressErrors.ciudad && <small className="error">{addressErrors.ciudad}</small>}
                    </div>

                    <div className="form-group form-group-col2">
                      <label>Dirección (calle, #, barrio)</label>
                      <input
                        type="text"
                        value={address.linea1}
                        onChange={(e) => setAddress({ ...address, linea1: e.target.value })}
                        placeholder="Ej: Calle 10 #5-23, Barrio Centro"
                        disabled={creatingPreference}
                      />
                      {addressErrors.linea1 && <small className="error">{addressErrors.linea1}</small>}
                    </div>

                    <div className="form-group form-group-col2">
                      <label>Complemento — opcional</label>
                      <input
                        type="text"
                        value={address.linea2}
                        onChange={(e) => setAddress({ ...address, linea2: e.target.value })}
                        placeholder="Ej: Torre 3, Apto 502"
                        disabled={creatingPreference}
                      />
                    </div>

                    <div className="form-group form-group-col2">
                      <label>Punto de referencia — opcional</label>
                      <input
                        type="text"
                        value={address.referencia}
                        onChange={(e) => setAddress({ ...address, referencia: e.target.value })}
                        placeholder="Ej: Cerca al parque principal"
                        disabled={creatingPreference}
                      />
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
        <div className="ver-mas-container">
          <button
            className="btn-ver-mas"
            onClick={() => navigate('/catalogo')}
          >
            Ver más productos
          </button>
        </div>
      </div>
    </div>
  );
}

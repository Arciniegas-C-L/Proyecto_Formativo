import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FaTrash, FaMinus, FaPlus } from 'react-icons/fa';
import {
    fetchCarritos,
    fetchCarritoItems,
    actualizarCantidad,
    eliminarProducto,
    limpiarCarrito,
    finalizarCompra
} from '../../api/CarritoApi';
import '../../assets/css/Carrito.css';

const API_BASE_URL = "http://127.0.0.1:8000";

export function Carrito() {
    const navigate = useNavigate();
    const [carrito, setCarrito] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        cargarCarrito();
    }, []);

    const cargarCarrito = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetchCarritos();
            const carritosActivos = response.data.filter(c => c.estado === true);
            
            if (carritosActivos.length > 0) {
                const carritoActivo = carritosActivos[0];
                setCarrito(carritoActivo);
                if (carritoActivo.items && Array.isArray(carritoActivo.items)) {
                    setItems(carritoActivo.items);
                } else {
                    setItems([]);
                }
            } else {
                setCarrito(null);
                setItems([]);
            }
        } catch (error) {
            console.error('Error al cargar el carrito:', error);
            setError('Error al cargar el carrito');
            toast.error('Error al cargar el carrito');
            setCarrito(null);
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    const handleActualizarCantidad = async (itemId, nuevaCantidad) => {
        try {
            if (!carrito) return;

            const response = await actualizarCantidad(carrito.idCarrito, itemId, nuevaCantidad);
            
            if (response.data) {
                
                // Verificar que los items y productos estén presentes
                if (response.data.items && Array.isArray(response.data.items)) {
                    const itemsActualizados = response.data.items.map(item => {
                        if (!item.producto) {
                            console.error('Producto no encontrado en item:', item);
                            return null;
                        }
                        return {
                            ...item,
                            producto: {
                                ...item.producto,
                                imagen: item.producto.imagen || "https://via.placeholder.com/100"
                            }
                        };
                    }).filter(Boolean); // Filtrar items nulos
                    
                    
                    setCarrito({
                        ...response.data,
                        items: itemsActualizados
                    });
                    setItems(itemsActualizados);
                    toast.success('Cantidad actualizada');
                } else {
                    console.error('No se encontraron items en la respuesta:', response.data);
                    toast.error('Error al actualizar la cantidad: datos inválidos');
                }
            }
        } catch (error) {
            console.error('Error al actualizar cantidad:', error);
            let mensajeError = 'Error al actualizar la cantidad';
            
            if (error.response) {
                switch (error.response.status) {
                    case 400:
                        mensajeError = error.response.data.error || 'Datos inválidos';
                        break;
                    case 404:
                        mensajeError = 'Producto no encontrado en el carrito';
                        break;
                    default:
                        mensajeError = 'Error al actualizar la cantidad';
                }
            }
            
            toast.error(mensajeError);
        }
    };

    const handleEliminarProducto = async (itemId) => {
        try {
            if (!carrito) return;

            const response = await eliminarProducto(carrito.idCarrito, itemId);
            if (response.data) {
                setCarrito(response.data);
                setItems(response.data.items || []);
                toast.success('Producto eliminado del carrito');
            }
        } catch (error) {
            console.error('Error al eliminar producto:', error);
            toast.error('Error al eliminar el producto');
        }
    };

    const handleLimpiarCarrito = async () => {
        try {
            if (!carrito) return;

            const response = await limpiarCarrito(carrito.idCarrito);
            if (response.data) {
                setCarrito(response.data);
                setItems([]);
                toast.success('Carrito limpiado');
            }
        } catch (error) {
            console.error('Error al limpiar carrito:', error);
            toast.error('Error al limpiar el carrito');
        }
    };

    const handleFinalizarCompra = async () => {
        try {
            if (!carrito) return;

            const response = await finalizarCompra(carrito.idCarrito);
            if (response.data) {
                toast.success('Compra finalizada exitosamente');
                setCarrito(null);
                setItems([]);
                // Aquí podrías redirigir a una página de confirmación o historial de pedidos
            }
        } catch (error) {
            console.error('Error al finalizar compra:', error);
            toast.error(error.response?.data?.error || 'Error al finalizar la compra');
        }
    };

    const calcularTotal = () => {
        return items.reduce((total, item) => {
            const subtotal = parseFloat(item.subtotal) || 0;
            return total + subtotal;
        }, 0).toFixed(2);
    };

    const getImagenUrl = (imagenPath) => {
        if (!imagenPath) return "https://via.placeholder.com/100";
        if (imagenPath.startsWith('http')) return imagenPath;
        return `${API_BASE_URL}${imagenPath}`;
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

    if (!carrito || items.length === 0) {
        return (
            <div className="carrito-container">
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
            </div>
        );
    }

    return (
        <div className="carrito-container">
            <h1>Carrito de Compras</h1>
            
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
                        
                        <div className="item-detalles">
                            <h4 className="text-center">{item.producto?.nombre}</h4>
                            <div>
                                <p className="item-precio">${item.precio_unitario}</p>
                            </div>
                            <div className="item-cantidad">
                                <button 
                                    onClick={() => handleActualizarCantidad(item.idCarritoItem, item.cantidad - 1)}
                                    disabled={item.cantidad <= 1}
                                >
                                    <FaMinus />
                                </button>
                                <span>{item.cantidad}</span>
                                <button 
                                    onClick={() => handleActualizarCantidad(item.idCarritoItem, item.cantidad + 1)}
                                >
                                    <FaPlus />
                                </button>
                            </div>
                            <p className="item-subtotal">Subtotal: ${item.subtotal}</p>
                            <div>
                                <p className="item-descripcion">{item.producto?.descripcion}</p>
                            </div>
                        </div>
                        <button 
                            className="btn-eliminar"
                            onClick={() => handleEliminarProducto(item.idCarritoItem)}
                        >
                            <FaTrash />
                        </button>
                    </div>
                ))}
            </div>

            <div className="carrito-resumen">
                <h2>Resumen del Pedido</h2>
                <div className="resumen-detalles">
                    <p>Total de productos: {items.length}</p>
                    <p>Total a pagar: ${calcularTotal()}</p>
                </div>
                <div className="resumen-acciones">
                    <button 
                        className="btn-limpiar"
                        onClick={handleLimpiarCarrito}
                    >
                        Limpiar Carrito
                    </button>
                    <button 
                        className="btn-finalizar"
                        onClick={handleFinalizarCompra}
                    >
                        Finalizar Compra
                    </button>
                </div>
            </div>
        </div>
    );
}

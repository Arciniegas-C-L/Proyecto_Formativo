import React, { useState, useEffect } from 'react';
import { getALLProductos } from '../api/Producto.api';
import { createCarrito, agregarProducto, fetchCarritos } from '../api/CarritoApi';
import { toast } from 'react-hot-toast';
import { FaMinus, FaPlus, FaShoppingCart } from 'react-icons/fa';
import '../assets/css/Catalogo.css';

export function Catalogo() {
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [carritoId, setCarritoId] = useState(null);
    const [agregandoProducto, setAgregandoProducto] = useState(false);
    const [cantidades, setCantidades] = useState({});
    const [carrito, setCarrito] = useState(null);

    useEffect(() => {
        cargarProductos();
        inicializarCarrito();
    }, []);

    const inicializarCarrito = async () => {
        try {
            const response = await fetchCarritos();
            const carritosActivos = response.data.filter(carrito => carrito.estado === true);
            
            if (carritosActivos.length > 0) {
                setCarritoId(carritosActivos[0].idCarrito);
                setCarrito(carritosActivos[0]);
            } else {
                const nuevoCarrito = await createCarrito({ estado: true });
                setCarritoId(nuevoCarrito.data.idCarrito);
                setCarrito(nuevoCarrito.data);
            }
        } catch (error) {
            console.error('Error al inicializar el carrito:', error);
            toast.error('Error al inicializar el carrito');
        }
    };

    const cargarProductos = async () => {
        try {
            const response = await getALLProductos();
            setProductos(response.data);
            // Inicializar cantidades en 1 para cada producto
            const cantidadesIniciales = {};
            response.data.forEach(producto => {
                cantidadesIniciales[producto.idProducto] = 1;
            });
            setCantidades(cantidadesIniciales);
        } catch (error) {
            console.error('Error al cargar productos:', error);
            toast.error('Error al cargar los productos');
        } finally {
            setLoading(false);
        }
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

            // Validar que la cantidad sea positiva
            if (cantidades[producto.idProducto] <= 0) {
                toast.error('La cantidad debe ser mayor a 0');
                return;
            }

            // Validar que haya suficiente stock
            if (cantidades[producto.idProducto] > producto.stock) {
                toast.error(`No hay suficiente stock disponible. Stock actual: ${producto.stock}`);
                return;
            }

            const response = await agregarProducto(carrito.idCarrito, {
                producto: producto.idProducto,
                cantidad: cantidades[producto.idProducto]
            });
            
            // Actualizar el estado del carrito con la respuesta del servidor
            if (response.data) {
                setCarrito(response.data);
                // Si la respuesta incluye información actualizada del producto, actualizar el stock
                const productoActualizado = response.data.items.find(item => item.producto.idProducto === producto.idProducto)?.producto;
                if (productoActualizado) {
                    setProductos(prevProductos => 
                        prevProductos.map(p => 
                            p.idProducto === productoActualizado.idProducto 
                                ? { ...p, stock: productoActualizado.stock }
                                : p
                        )
                    );
                }
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

    if (loading) {
        return (
            <div className="catalogo-container">
                <div className="loading">Cargando productos...</div>
            </div>
        );
    }

    return (
        <div className="catalogo-container">
            <h2>Catálogo de Productos</h2>
            <div className="productos-grid">
                {productos.map(producto => (
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
                ))}
            </div>
        </div>
    );
}

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getALLProductos, deleteProducto } from '../api/Producto.api';
import { toast } from 'react-hot-toast';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import '../assets/css/ListaProductos.css';

export function ListaProductos() {
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        cargarProductos();
    }, []);

    const cargarProductos = async () => {
        try {
            const response = await getALLProductos();
            setProductos(response.data);
        } catch (error) {
            console.error('Error al cargar productos:', error);
            toast.error('Error al cargar los productos');
        } finally {
            setLoading(false);
        }
    };

    const handleEditar = (producto) => {
        navigate(`/producto/editar/${producto.idProducto}`, { state: { producto } });
    };

    const handleEliminar = async (idProducto) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar este producto?')) {
            return;
        }

        try {
            await deleteProducto(idProducto);
            toast.success('Producto eliminado exitosamente');
            cargarProductos(); // Recargar la lista
        } catch (error) {
            console.error('Error al eliminar producto:', error);
            toast.error(error.response?.data?.message || 'Error al eliminar el producto');
        }
    };

    const handleCrear = () => {
        navigate('/producto/crear');
    };

    if (loading) {
        return (
            <div className="lista-productos-container">
                <div className="loading">Cargando productos...</div>
            </div>
        );
    }

    return (
        <div className="lista-productos-container">
            <div className="header-acciones">
                <h2>Lista de Productos</h2>
                <button 
                    className="btn-crear"
                    onClick={handleCrear}
                >
                    <FaPlus />
                    Crear Producto
                </button>
            </div>

            <div className="tabla-container">
                <table className="tabla-productos">
                    <thead>
                        <tr>
                            <th>Imagen</th>
                            <th>Nombre</th>
                            <th>Descripción</th>
                            <th>Precio</th>
                            <th>Categoría</th>
                            <th>Stock</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {productos.map(producto => (
                            <tr key={producto.idProducto}>
                                <td className="celda-imagen">
                                    <img 
                                        src={producto.imagen || "https://via.placeholder.com/50"} 
                                        alt={producto.nombre}
                                    />
                                </td>
                                <td>{producto.nombre}</td>
                                <td className="celda-descripcion">{producto.descripcion}</td>
                                <td>${producto.precio}</td>
                                <td>{producto.categoria_nombre}</td>
                                <td>{producto.stock}</td>
                                <td className="celda-acciones">
                                    <button 
                                        className="btn-editar"
                                        onClick={() => handleEditar(producto)}
                                        title="Editar producto"
                                    >
                                        <FaEdit />
                                    </button>
                                    <button 
                                        className="btn-eliminar"
                                        onClick={() => handleEliminar(producto.idProducto)}
                                        title="Eliminar producto"
                                    >
                                        <FaTrash />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

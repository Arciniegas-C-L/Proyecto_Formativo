import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getALLProductos, deleteProducto } from '../../api/Producto.api';
import { toast } from 'react-hot-toast';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import "../../assets/css/Productos/ListaProductos.css";

export function ListaProductos() {
   //Estados para manejar la lista de productos, carga, errores y filtro de búsqueda
const [productos, setProductos] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const [filtroBusqueda, setFiltroBusqueda] = useState('');
const navigate = useNavigate();

//useEffect para cargar los productos al montar el componente
useEffect(() => {
    cargarProductos();
}, []);

//Función para obtener los productos desde la API y actualizar el estado
const cargarProductos = async () => {
    try {
        setLoading(true);
        setError(null);
        const response = await getALLProductos();
        
        if (response.data) {
            setProductos(response.data);
        } else {
            throw new Error('No se recibieron datos de productos');
        }
    } catch (error) {
        console.error('Error al cargar productos:', error);
        setError('No se pudieron cargar los productos. Por favor, intente nuevamente.');
        toast.error('Error al cargar los productos');
    } finally {
        setLoading(false);
    }
};

//Función para preparar y redirigir a la vista de edición de un producto
const handleEditar = (producto) => {
    try {
        if (!producto) {
            toast.error('Error: Producto no válido');
            return;
        }

        if (!producto.id) {
            toast.error('Error: ID de producto no válido');
            return;
        }

        const productoCompleto = {
            idProducto: producto.id,
            nombre: producto.nombre || '',
            descripcion: producto.descripcion || '',
            precio: typeof producto.precio === 'string' ? parseFloat(producto.precio) : producto.precio,
            stock: typeof producto.stock === 'string' ? parseInt(producto.stock) : producto.stock,
            imagen: producto.imagen || '',
            categoria: {
                idCategoria: typeof producto.categoria_id === 'string' ? parseInt(producto.categoria_id) : producto.categoria_id,
                nombre: producto.categoria_nombre || ''
            },
            subcategoria: {
                idSubcategoria: typeof producto.subcategoria_id === 'string' ? parseInt(producto.subcategoria_id) : producto.subcategoria_id,
                nombre: producto.subcategoria_nombre || ''
            }
        };

        navigate(`/producto/editar/${producto.id}`, { 
            state: { producto: productoCompleto } 
        });
    } catch (error) {
        console.error('Error al editar producto:', error);
        toast.error('Error al abrir el formulario de edición');
    }
};

//Función para eliminar un producto con confirmación y recarga
const handleEliminar = async (idProducto) => {
    if (!idProducto) {
        toast.error('Error: ID de producto no válido');
        return;
    }

    const confirmacion = window.confirm(
        '¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.'
    );

    if (!confirmacion) return;

    try {
        setLoading(true);

        const productoExiste = productos.find(p => p.id === idProducto);
        if (!productoExiste) {
            toast.error('El producto ya no existe');
            await cargarProductos();
            return;
        }

        await deleteProducto(idProducto);

        setProductos(prevProductos => 
            prevProductos.filter(p => p.id !== idProducto)
        );

        toast.success('Producto eliminado exitosamente');
        await cargarProductos();
    } catch (error) {
        toast.error(error.message || 'Error al eliminar el producto');

        if (error.response?.status === 500) {
            await cargarProductos();
        }
    } finally {
        setLoading(false);
    }
};

//Función para navegar al formulario de creación de producto
const handleCrear = () => {
    try {
        navigate('/producto/crear');
    } catch (error) {
        console.error('Error al navegar a creación:', error);
        toast.error('Error al abrir el formulario de creación');
    }
};

//Filtrar productos según el texto ingresado en búsqueda
const productosFiltrados = productos.filter(producto =>
    producto.nombre.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
    producto.descripcion.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
    producto.categoria_nombre.toLowerCase().includes(filtroBusqueda.toLowerCase())
);

//Vista de carga mientras se obtienen los productos
if (loading && productos.length === 0) {
    return (
        <div className="lista-productos-container">
            <div className="loading">Cargando productos...</div>
        </div>
    );
}

//Vista de error cuando no se pueden cargar los productos
if (error && productos.length === 0) {
    return (
        <div className="lista-productos-container">
            <div className="error-message">
                <p>{error}</p>
                <button onClick={cargarProductos} className="btn-reintentar">
                    Reintentar
                </button>
            </div>
        </div>
    );
}

  return (
    <div className="lista-productos-container">
      <div className="header-acciones">
        <h2>Lista de Productos</h2>
        <div className="header-controls">
          <input
            type="text"
            placeholder="Buscar productos..."
            value={filtroBusqueda}
            onChange={e => setFiltroBusqueda(e.target.value)}
            className="busqueda-input"
          />
          <button
            className="btn-crear"
            onClick={handleCrear}
            aria-label="Crear producto"
          >
            <FaPlus />
            Crear Producto
          </button>
        </div>
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
            {loading ? (
              <tr>
                <td colSpan="7" className="loading">
                  Cargando productos...
                </td>
              </tr>
            ) : productosFiltrados.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-resultados">
                  No se encontraron productos
                </td>
              </tr>
            ) : (
              productosFiltrados.map(producto => (
                <tr key={`producto-${producto.id}`}>
                  <td className="celda-imagen">
                    <img
                      src={producto.imagen || 'https://via.placeholder.com/50'}
                      alt={producto.nombre}
                      onError={e => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/50';
                      }}
                      tabIndex={0}
                    />
                  </td>
                  <td>{producto.nombre}</td>
                  <td className="celda-descripcion" title={producto.descripcion}>
                    {producto.descripcion}
                  </td>
                  <td>${parseFloat(producto.precio).toLocaleString('es-CO')}</td>
                  <td>{producto.categoria_nombre}</td>
                  <td>{producto.stock}</td>
                  <td className="celda-acciones">
                    <button
                      className="btn-editar"
                      onClick={() => handleEditar(producto)}
                      title="Editar producto"
                      disabled={loading}
                      aria-label={`Editar ${producto.nombre}`}
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="btn-eliminar"
                      onClick={() => handleEliminar(producto.id)}
                      title="Eliminar producto"
                      disabled={loading}
                      aria-label={`Eliminar ${producto.nombre}`}
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

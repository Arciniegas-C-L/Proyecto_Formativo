import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getALLProductos, deleteProducto } from '../../api/Producto.api';
import { toast } from 'react-hot-toast';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import "../../assets/css/Productos/ListaProductos.css";
import { EliminarModal } from  "../EliminarModal/EliminarModal"; 
import { Cloudinary } from '@cloudinary/url-gen';
import { fill } from '@cloudinary/url-gen/actions/resize';

export function ListaProductos() {
  const navigate = useNavigate();

  // Crear producto (redirige al formulario de creación)
  const handleCrear = () => {
    navigate('/admin/productos/crear');
  };

  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [productoToDelete, setProductoToDelete] = useState(null);

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getALLProductos();
      if (response?.data) {
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

  const handleEditar = (producto) => {
    try {
      if (!producto || !producto.id) {
        toast.error('Producto o ID no válido');
        return;
      }

      // Coerciones seguras (con IDs planos y objetos anidados)
      const precioNum = typeof producto.precio === 'string' ? parseFloat(producto.precio) : (producto.precio ?? 0);
      const stockNum  = typeof producto.stock  === 'string' ? parseInt(producto.stock)   : (producto.stock  ?? 0);

      const catId  = typeof producto.categoria_id    === 'string' ? parseInt(producto.categoria_id)    : producto.categoria_id;
      const subId  = typeof producto.subcategoria_id === 'string' ? parseInt(producto.subcategoria_id) : producto.subcategoria_id;

      const productoCompleto = {
        // base
        idProducto: producto.id,
        nombre: producto.nombre || '',
        descripcion: producto.descripcion || '',
        precio: isNaN(precioNum) ? 0 : precioNum,
        stock:  isNaN(stockNum)  ? 0 : stockNum,
        imagen: producto.imagen || '',

        // objetos anidados
        categoria: {
          idCategoria: catId ?? null,
          nombre: producto.categoria_nombre || ''
        },
        subcategoria: {
          idSubcategoria: subId ?? null,
          nombre: producto.subcategoria_nombre || ''
        },

        // IDs planos para selects controlados
        categoriaId: catId ?? '',
        subcategoriaId: subId ?? ''
      };

      navigate(`/admin/productos/editar/${producto.id}`, { state: { producto: productoCompleto } });
    } catch (error) {
      console.error('Error al editar producto:', error);
      toast.error('Error al abrir el formulario de edición');
    }
  };

  const handleEliminarClick = (producto) => {
    setProductoToDelete(producto);
    setOpenDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!productoToDelete) return;
    try {
      setLoading(true);
      await deleteProducto(productoToDelete.id);
      toast.success('Producto eliminado exitosamente');
      setOpenDeleteDialog(false);
      setProductoToDelete(null);
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

  // Filtro robusto (evita .toLowerCase sobre null/undefined)
  const productosFiltrados = productos.filter(producto => {
    const nombre = (producto?.nombre ?? '').toLowerCase();
    const descripcion = (producto?.descripcion ?? '').toLowerCase();
    const categoriaNombre = (producto?.categoria_nombre ?? '').toLowerCase();
    const filtro = (filtroBusqueda ?? '').toLowerCase();

    return (
      nombre.includes(filtro) ||
      descripcion.includes(filtro) ||
      categoriaNombre.includes(filtro)
    );
  });

  // Cloudinary helper (solo si la imagen ya viene de Cloudinary)
  const cld = new Cloudinary({ cloud: { cloudName: "dkwr4gcpl" } });
  const getOptimizedCloudinaryUrl = (imagenUrl) => {
    try {
      if (!imagenUrl || typeof imagenUrl !== 'string') return null;
      if (!imagenUrl.includes('res.cloudinary.com')) return imagenUrl;

      // Extrae publicId desde .../upload/(v123/)?<publicId>
      const matches = imagenUrl.match(/upload\/(?:v\d+\/)?(.+)$/);
      const publicId = matches ? matches[1] : null;
      if (!publicId) return imagenUrl;

      return cld.image(publicId).resize(fill().width(300).height(300)).toURL();
    } catch {
      return imagenUrl;
    }
  };

  if (loading && productos.length === 0) {
    return (
      <div className="lista-productos-container">
        <div className="loading">Cargando productos...</div>
      </div>
    );
  }

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
              productosFiltrados.map(producto => {
                // Imagen con fallback + optimización Cloudinary
                const rawUrl = producto.imagen || '';
                const imagenUrl = getOptimizedCloudinaryUrl(rawUrl) || 'https://via.placeholder.com/50';

                return (
                  <tr key={`producto-${producto.id}`}>
                    <td className="celda-imagen">
                      {typeof rawUrl === 'string' && rawUrl ? (
                        <img
                          src={imagenUrl}
                          alt={producto.nombre}
                          className="producto-imagen"
                          tabIndex={0}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = 'https://via.placeholder.com/50';
                          }}
                        />
                      ) : (
                        <img
                          src="https://via.placeholder.com/50"
                          alt={producto.nombre}
                          className="producto-imagen"
                          tabIndex={0}
                        />
                      )}
                    </td>
                    <td>{producto.nombre}</td>
                    <td className="celda-descripcion" title={producto.descripcion}>
                      {producto.descripcion}
                    </td>
                    <td>${(parseFloat(producto.precio) || 0).toLocaleString('es-CO')}</td>
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
                        onClick={() => handleEliminarClick(producto)}
                        title="Eliminar producto"
                        disabled={loading}
                        aria-label={`Eliminar ${producto.nombre}`}
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Eliminar Global */}
      <EliminarModal
        abierto={openDeleteDialog}
        mensaje={`¿Seguro que quieres eliminar el producto "${productoToDelete?.nombre}"?`}
        onCancelar={() => setOpenDeleteDialog(false)}
        onConfirmar={confirmDelete}
      />
    </div>
  );
}

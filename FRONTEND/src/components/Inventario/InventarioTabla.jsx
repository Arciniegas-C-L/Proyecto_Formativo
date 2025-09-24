import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../assets/css/Inventario/InventarioTabla.css"; // Importar el CSS
import {
  getTablaCategorias,
  getTablaSubcategorias,
  getTablaProductos,
  actualizarStockTallas
} from "../../api/InventarioApi";
import { updateGrupoTalla, asignarGrupoTallaDefault } from "../../api/Subcategoria.api";
import { getAllGruposTalla } from "../../api/GrupoTalla.api";



const InventarioTabla = () => {
  const [selectedCategoria, setSelectedCategoria] = useState(null);
  const [selectedSubcategoria, setSelectedSubcategoria] = useState(null);
  const [gruposTalla, setGruposTalla] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState("categorias");
  const [currentData, setCurrentData] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [openStockDialog, setOpenStockDialog] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState(null);
  const [stockForm, setStockForm] = useState({});
  const [stockMinimoForm, setStockMinimoForm] = useState({});
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  const navigate = useNavigate();
  const [openNoCategoriasDialog, setOpenNoCategoriasDialog] = useState(false);
  const [contador, setContador] = useState(10);
  const [openNoGrupoTallaDialog, setOpenNoGrupoTallaDialog] = useState(false);
  const [contadorGrupoTalla, setContadorGrupoTalla] = useState(5);

  // Cargar categorías y grupos de talla al montar el componente
  useEffect(() => {
    const inicializar = async () => {
      try {
        setLoading(true);
        
        // Primero asignar grupo de tallas por defecto a las subcategorías que no lo tienen
        try {
          await asignarGrupoTallaDefault();
        } catch (error) {
          console.error('Error al asignar grupo de tallas por defecto:', error);
          // Continuar con la carga aunque falle la asignación por defecto
        }
        
        // Primero cargar grupos de talla, luego categorías
        await cargarGruposTalla();
        await cargarCategorias();
        
      } catch (error) {
        console.error('Error al inicializar:', error);
        showSnackbar('Error al inicializar el componente', 'error');
      } finally {
        setLoading(false);
      }
    };
    inicializar();
  }, []);

  // useEffect para el contador de redirección
  useEffect(() => {
    let interval;
    if (openNoCategoriasDialog && contador > 0) {
      interval = setInterval(() => {
        setContador(prev => {
          if (prev <= 1) {
            navigate('/categorias');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [openNoCategoriasDialog, contador, navigate]);

  // useEffect para el contador de redirección de grupos de talla
  useEffect(() => {
    let interval;
    if (openNoGrupoTallaDialog && contadorGrupoTalla > 0) {
      interval = setInterval(() => {
        setContadorGrupoTalla(prev => {
          if (prev <= 1) {
            navigate('/grupo-talla');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [openNoGrupoTallaDialog, contadorGrupoTalla, navigate]);

  const cargarCategorias = async () => {
    try {
      setLoading(true);
      const data = await getTablaCategorias();
      
      // Verificar si no hay categorías
      if (!data || !data.datos || data.datos.length === 0) {
        setOpenNoCategoriasDialog(true);
        return;
      }
      
      setCurrentData(data);
      setCurrentView("categorias");
      setBreadcrumbs([{ text: "Categorías", active: true }]);
      setSelectedCategoria(null);
      setSelectedSubcategoria(null);
    } catch (error) {
      console.error("Error al cargar las categorías:", error);
      showSnackbar("Error al cargar las categorías", "error");
    } finally {
      setLoading(false);
    }
  };

  const cargarSubcategorias = async (categoriaId, categoriaNombre) => {
    try {
      setLoading(true);
      
      const data = await getTablaSubcategorias(categoriaId);
      
      // Verificar si hay grupos de talla disponibles en el sistema
      if (!gruposTalla || gruposTalla.length === 0) {
        setOpenNoGrupoTallaDialog(true);
        return;
      }
      
      // Verificar si hay subcategorías
      if (!data.datos || data.datos.length === 0) {
        showSnackbar(`No hay subcategorías en la categoría "${categoriaNombre}"`, 'info');
        return;
      }
      
      setCurrentData(data);
      setCurrentView("subcategorias");
      setSelectedCategoria({ id: categoriaId, nombre: categoriaNombre });
      setBreadcrumbs([
        { text: "Categorías", active: false, onClick: cargarCategorias },
        { text: categoriaNombre, active: true }
      ]);
      setSelectedSubcategoria(null);
    } catch (error) {
      console.error("Error al cargar las subcategorías:", error);
      showSnackbar("Error al cargar las subcategorías", "error");
    } finally {
      setLoading(false);
    }
  };

  const cargarProductos = async (subcategoriaId, subcategoriaNombre) => {
    try {
      setLoading(true);
      const data = await getTablaProductos(subcategoriaId);
      
      // Verificar si hay productos
      if (!data.datos || data.datos.length === 0) {
        showSnackbar(`No hay productos en la subcategoría "${subcategoriaNombre}"`, 'info');
        return;
      }
      
      setCurrentData(data);
      setCurrentView("productos");
      setSelectedSubcategoria({ id: subcategoriaId, nombre: subcategoriaNombre });
      setBreadcrumbs([
        { text: "Categorías", active: false, onClick: cargarCategorias },
        { 
          text: selectedCategoria.nombre, 
          active: false, 
          onClick: () => cargarSubcategorias(selectedCategoria.id, selectedCategoria.nombre)
        },
        { text: subcategoriaNombre, active: true }
      ]);
    } catch (error) {
      console.error("Error al cargar los productos:", error);
      showSnackbar("Error al cargar los productos", "error");
    } finally {
      setLoading(false);
    }
  };

  const cargarGruposTalla = async () => {
    try {
      const response = await getAllGruposTalla();
      const gruposData = response.data;
      
      const gruposFormateados = gruposData.map(grupo => ({
        idGrupoTalla: Number(grupo.idGrupoTalla || grupo.id),
        nombre: grupo.nombre,
        estado: grupo.estado
      }));
      
      setGruposTalla(gruposFormateados);
    } catch (error) {
      console.error("Error al cargar grupos de talla:", error);
      showSnackbar("Error al cargar los grupos de talla", "error");
      setGruposTalla([]);
    }
  };

  const handleOpenStockDialog = (producto) => {
    setSelectedProducto(producto);
    const stockInicial = {};
    const stockMinimoInicial = {};
    Object.entries(producto.stock_por_talla).forEach(([talla, info]) => {
      stockInicial[talla] = info.stock;
      stockMinimoInicial[talla] = info.stock_minimo;
    });
    setStockForm(stockInicial);
    setStockMinimoForm(stockMinimoInicial);
    setOpenStockDialog(true);
  };

  const handleCloseStockDialog = () => {
    setOpenStockDialog(false);
    setSelectedProducto(null);
    setStockForm({});
    setStockMinimoForm({});
    setError('');
  };

  const handleGrupoTallaChange = async (event, subcategoria) => {
    try {
      const nuevoGrupoId = Number(event.target.value);
      
      // Validar que se seleccionó un grupo
      if (!nuevoGrupoId) {
        showSnackbar('Debe seleccionar un grupo de tallas', 'error');
        return;
      }

      // Validar que el grupo existe
      const grupoExiste = gruposTalla.some(grupo => grupo.idGrupoTalla === nuevoGrupoId);
      if (!grupoExiste) {
        showSnackbar('El grupo de talla seleccionado no existe', 'error');
        return;
      }

      // Validar que no es el mismo grupo
      const grupoActualId = Number(subcategoria.grupoTalla?.idGrupoTalla);
      if (grupoActualId === nuevoGrupoId) {
        showSnackbar('Ya está seleccionado este grupo de tallas', 'info');
        return;
      }

      // Mostrar indicador de carga
      setLoading(true);
      
      try {
        await updateGrupoTalla(subcategoria.id, nuevoGrupoId);
        showSnackbar('Grupo de talla actualizado correctamente', 'success');
        await cargarSubcategorias(selectedCategoria.id, selectedCategoria.nombre); // Recargar datos
      } catch (error) {
        // Si el error es porque ya tiene asignado ese grupo, mostrarlo como info
        if (error.message.includes('ya tiene asignado este grupo de talla')) {
          showSnackbar('Ya está seleccionado este grupo de tallas', 'info');
        } else {
          throw error; // Propagar otros errores
        }
      }
    } catch (error) {
      console.error('Error al actualizar grupo de talla:', error);
      showSnackbar(
        error.response?.data?.error || error.message || 'Error al actualizar el grupo de talla',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStockChange = (talla, value) => {
    const newValue = parseInt(value) || 0;
    const stockTotal = selectedProducto?.stock || 0;
    const stockActual = Object.values(stockForm).reduce((sum, stock) => sum + (parseInt(stock) || 0), 0);
    const stockActualSinTalla = stockActual - (parseInt(stockForm[talla]) || 0);
    const stockDisponible = stockTotal - stockActualSinTalla;

    if (newValue > stockDisponible) {
      setError(`No puedes asignar más de ${stockDisponible} unidades a la talla ${talla}`);
      return;
    }

    setStockForm(prev => ({
      ...prev,
      [talla]: newValue
    }));
    setError(null);
  };

  const handleSaveStock = async () => {
    try {
      const stockTotal = Object.values(stockForm).reduce((sum, stock) => sum + (parseInt(stock) || 0), 0);
      if (stockTotal > selectedProducto.stock) {
        setError('La suma de los stocks por talla no puede exceder el stock total del producto');
        return;
      }

      // Preparar los datos para la actualización
      const tallasData = Object.entries(selectedProducto.stock_por_talla).map(([talla, info]) => ({
        talla_id: info.talla_id,
        stock: stockForm[talla] || 0,
        stock_minimo: stockMinimoForm[talla] || info.stock_minimo
      }));

      await actualizarStockTallas(selectedProducto.id, tallasData);
      showSnackbar('Stock por tallas actualizado exitosamente', 'success');
      handleCloseStockDialog();
      cargarProductos(selectedSubcategoria.id, selectedSubcategoria.nombre);
    } catch (error) {
      console.error('Error al actualizar stock:', error);
      showSnackbar(error.response?.data?.error || 'Error al distribuir el stock', 'error');
    }
  };

  const renderCategoriasTable = () => (
    <div className="tabla-container">
      <table className="tabla-inventario">
        <thead>
          <tr>
            {currentData.columnas.map((columna) => (
              <th key={columna.campo}>{columna.titulo}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {currentData.datos.map((categoria) => (
            <tr key={categoria.id}>
              <td>{categoria.nombre}</td>
              <td>{categoria.subcategorias_count}</td>
              <td>{categoria.productos_count}</td>
              <td>
                <span className={`custom-badge ${categoria.estado ? 'badge-success' : 'badge-error'}`}>
                  {categoria.estado ? "Activo" : "Inactivo"}
                </span>
              </td>
              <td>
                <button
                  className="btn-action btn-primary"
                  onClick={() => cargarSubcategorias(categoria.id, categoria.nombre)}
                  title="Ver subcategorías"
                >
                  <i className="fas fa-eye"></i>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderSubcategoriasTable = () => {
    if (loading) {
      return (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      );
    }

    return (
      <div className="tabla-container">
        <table className="tabla-inventario">
          <thead>
            <tr>
              {currentData.columnas.map((columna) => (
                <th key={columna.campo}>{columna.titulo}</th>
              ))}
              <th>Grupo de Talla</th>
            </tr>
          </thead>
          <tbody>
            {currentData.datos.map((subcategoria) => (
              <tr key={subcategoria.id}>
                <td>{subcategoria.nombre}</td>
                <td>{subcategoria.productos_count}</td>
                <td>
                  <span className={`custom-badge ${subcategoria.stock_total <= 5 ? 'badge-error' : 'badge-success'}`}>
                    {subcategoria.stock_total} unidades
                  </span>
                </td>
                <td>5</td>
                <td>
                  <span className={`custom-badge ${subcategoria.estado ? 'badge-success' : 'badge-error'}`}>
                    {subcategoria.estado ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td>
                  <div className="d-flex gap-2 justify-content-center">
                    <button
                      className="btn-action btn-primary"
                      onClick={() => cargarProductos(subcategoria.id, subcategoria.nombre)}
                      title="Ver productos"
                    >
                      <i className="fas fa-eye"></i>
                    </button>
                    <button
                      className="btn-action btn-secondary"
                      onClick={() => handleCrearProducto(subcategoria)}
                      title="Crear producto"
                    >
                      <i className="fas fa-plus"></i>
                    </button>
                  </div>
                </td>
                <td>
                  {renderGrupoTallaSelect(subcategoria)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderProductosTable = () => (
    <div className="tabla-container">
      <table className="tabla-inventario">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Precio</th>
            <th>Stock Total</th>
            <th>Stock Mínimo</th>
            <th>Stock por Tallas</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {currentData.datos.map((producto) => (
            <tr key={producto.id}>
              {/* Columna de Producto (imagen y nombre) */}
              <td>
                <div className="producto-info">
                  {producto.imagen ? (
                    <>
                      <img
                        src={producto.imagen || "https://via.placeholder.com/100"}
                        alt={producto.nombre}
                        className="producto-imagen"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                        loading="lazy"
                      />
                      <div className="imagen-placeholder" style={{display: 'none'}}>
                        <i className="fas fa-image"></i>
                      </div>
                    </>
                  ) : (
                    <div className="imagen-placeholder">
                      <i className="fas fa-image"></i>
                    </div>
                  )}
                  <span className="producto-nombre">{producto.nombre}</span>
                </div>
              </td>

              {/* Columna de Precio */}
              <td>
                ${producto.precio.toLocaleString('es-CO')}
              </td>

              {/* Columna de Stock Total */}
              <td>
                <span className={`custom-badge ${Object.values(producto.stock_por_talla).reduce((sum, info) => sum + (info.stock || 0), 0) <= 5 ? 'badge-error' : 'badge-success'}`}>
                  {Object.values(producto.stock_por_talla).reduce((sum, info) => sum + (info.stock || 0), 0)} unidades
                </span>
              </td>

              {/* Columna de Stock Mínimo */}
              <td>5</td>

              {/* Columna de Stock por Tallas */}
              <td>
                <button
                  className="btn btn-outline-primary btn-sm mb-2"
                  onClick={() => handleOpenStockDialog(producto)}
                  title="Distribuir stock por tallas"
                >
                  <i className="fas fa-edit me-1"></i>
                  Distribuir Stock
                </button>
                <div className="d-flex gap-1 flex-wrap justify-content-center">
                  {Object.entries(producto.stock_por_talla).map(([talla, info]) => (
                    <span
                      key={talla}
                      className={`custom-badge-small ${info.stock <= 5 ? 'badge-small-error' : 'badge-small-success'}`}
                    >
                      {talla}: {info.stock}
                    </span>
                  ))}
                </div>
              </td>

              {/* Columna de Acciones */}
              <td>
                <div className="d-flex gap-1 justify-content-center">
                  <button 
                    className="btn-action btn-primary"
                    onClick={() => handleSaveStock(producto)}
                    title="Guardar cambios"
                  >
                    <i className="fas fa-save"></i>
                  </button>
                  <button 
                    className="btn-action btn-primary"
                    onClick={() => window.location.href = producto.acciones.ver_detalle}
                    title="Ver detalles del producto"
                  >
                    <i className="fas fa-eye"></i>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const StockDialog = () => {
    const stockTotal = selectedProducto?.stock || 0;
    const stockDistribuido = Object.values(stockForm).reduce((sum, stock) => sum + (parseInt(stock) || 0), 0);
    const stockRestante = stockTotal - stockDistribuido;

    if (!openStockDialog) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="fas fa-boxes me-2"></i>
              Distribuir Stock por Talla
            </h5>
            <button 
              className="modal-close" 
              onClick={handleCloseStockDialog}
              title="Cerrar"
            >
              &times;
            </button>
          </div>
          <div className="modal-body">
            {error && (
              <div className="alert-danger">
                {error}
              </div>
            )}
            <h6 className="mb-3">{selectedProducto?.nombre}</h6>
            <div className="stock-info">
              <div>Stock Total del Producto: {stockTotal} unidades</div>
              <div>Stock Distribuido: {stockDistribuido} unidades</div>
              <div className={stockRestante < 0 ? 'text-danger fw-bold' : ''}>
                Stock Restante: {stockRestante} unidades
              </div>
            </div>
            <div className="stock-form">
              {Object.entries(selectedProducto?.stock_por_talla || {}).map(([talla]) => {
                const stockActualSinTalla = stockDistribuido - (parseInt(stockForm[talla]) || 0);
                const stockDisponible = stockTotal - stockActualSinTalla;

                return (
                  <div key={talla} className="row mb-3 align-items-center">
                    <div className="col-2">
                      <label className="form-label fw-bold">{talla}:</label>
                    </div>
                    <div className="col-4">
                      <input
                        type="number"
                        className="form-control"
                        value={stockForm[talla] || 0}
                        onChange={(e) => handleStockChange(talla, e.target.value)}
                        min="0"
                        max={stockDisponible}
                      />
                    </div>
                    <div className="col-6">
                      <small className="text-muted">
                        Máximo disponible: {stockDisponible} unidades
                      </small>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="modal-footer">
            <button 
              className="btn btn-cancel" 
              onClick={handleCloseStockDialog}
            >
              Cancelar
            </button>
            <button 
              className="btn btn-save"
              onClick={handleSaveStock}
              disabled={stockRestante < 0}
            >
              Guardar Distribución
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderGrupoTallaSelect = (subcategoria) => {
    if (!subcategoria.grupoTalla) {
      return (
        <div className="alert-warning">
          No tiene grupo de tallas asignado
        </div>
      );
    }

    const grupoTallaId = Number(subcategoria.grupoTalla?.idGrupoTalla || subcategoria.grupoTalla?.id);

    if (!grupoTallaId) {
      return (
        <div className="alert-warning">
          Se requiere asignar un grupo de tallas
        </div>
      );
    }

    return (
      <select
        className="custom-select"
        value={grupoTallaId}
        onChange={(e) => handleGrupoTallaChange(e, subcategoria)}
        disabled={loading}
      >
        {Array.isArray(gruposTalla) && gruposTalla.length > 0 ? (
          gruposTalla
            .filter(grupo => grupo.estado)
            .map((grupo) => (
              <option 
                key={grupo.idGrupoTalla} 
                value={grupo.idGrupoTalla}
                disabled={grupo.idGrupoTalla === grupoTallaId}
              >
                {grupo.nombre}
              </option>
            ))
        ) : (
          <option disabled>No hay grupos disponibles</option>
        )}
      </select>
    );
  };

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleRedireccionManual = () => {
    navigate('/categorias');
  };

  const handleCerrarDialogo = () => {
    setOpenNoCategoriasDialog(false);
    setContador(10);
  };

  const handleRedireccionManualGrupoTalla = () => {
    navigate('/grupo-talla');
  };

  const handleCerrarDialogoGrupoTalla = () => {
    setOpenNoGrupoTallaDialog(false);
    setContadorGrupoTalla(5);
  };

  const handleCrearProducto = (subcategoria) => {
    navigate(`/producto/crear?subcategoria=${subcategoria.id}&subcategoriaNombre=${encodeURIComponent(subcategoria.nombre)}`);
  };

  if (loading) {
    return (
      <div className="inventario-tabla-container">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  // Si el diálogo de no categorías está abierto, solo mostrar el diálogo
  if (openNoCategoriasDialog) {
    return (
      <div className="inventario-tabla-container">
        {/* Diálogo para cuando no hay categorías */}
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="fas fa-exclamation-triangle text-warning me-2"></i>
                No hay categorías disponibles
              </h5>
            </div>
            <div className="modal-body">
              <p>
                No se encontraron categorías en el sistema. Para continuar, necesitas crear al menos una categoría.
              </p>
              <p className="text-muted">
                Serás redirigido automáticamente a la página de categorías en {contador} segundos.
              </p>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-save"
                onClick={handleRedireccionManual}
              >
                Ir a Categorías Ahora
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Si el diálogo de no grupos de talla está abierto, solo mostrar el diálogo
  if (openNoGrupoTallaDialog) {
    return (
      <div className="inventario-tabla-container">
        {/* Diálogo para cuando no hay grupos de talla */}
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="fas fa-exclamation-triangle text-warning me-2"></i>
                Grupos de Talla Requeridos
              </h5>
            </div>
            <div className="modal-body">
              <p>
                No se encontraron grupos de talla en el sistema. Para continuar, necesitas crear al menos un grupo de talla antes de poder gestionar las subcategorías.
              </p>
              <p className="text-muted">
                Serás redirigido automáticamente a la página de grupos de talla en {contadorGrupoTalla} segundos.
              </p>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-save"
                onClick={handleRedireccionManualGrupoTalla}
              >
                Ir a Grupos de Talla Ahora
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Si no hay datos actuales, mostrar un mensaje de carga
  if (!currentData) {
    return (
      <div className="inventario-tabla-container">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="inventario-tabla-container">
      {/* Breadcrumbs */}
      <nav className="breadcrumb-nav">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <button
              className="breadcrumb-btn"
              onClick={() => cargarCategorias()}
            >
              <i className="fas fa-home"></i> Inventario
            </button>
          </li>
          {breadcrumbs.map((crumb, index) => (
            crumb.active ? (
              <li key={index} className="breadcrumb-item active">
                {crumb.text}
              </li>
            ) : (
              <li key={index} className="breadcrumb-item">
                <button
                  className="breadcrumb-btn"
                  onClick={crumb.onClick}
                >
                  {crumb.text}
                </button>
              </li>
            )
          ))}
        </ol>
      </nav>

      {/* Título */}
      <h2 className="page-title">
        {currentData.titulo}
      </h2>

      {/* Tablas */}
      {currentView === "categorias" && renderCategoriasTable()}
      {currentView === "subcategorias" && renderSubcategoriasTable()}
      {currentView === "productos" && renderProductosTable()}
      
      {/* Modal de Stock */}
      <StockDialog />

      {/* Snackbar */}
      {snackbar.open && (
        <div className={`snackbar snackbar-${snackbar.severity}`}>
          <i className={`fas ${
            snackbar.severity === 'error' ? 'fa-exclamation-circle' :
            snackbar.severity === 'warning' ? 'fa-exclamation-triangle' :
            snackbar.severity === 'success' ? 'fa-check-circle' :
            'fa-info-circle'
          }`}></i>
          <span>{snackbar.message}</span>
          <button 
            className="snackbar-close" 
            onClick={handleCloseSnackbar}
          >
            &times;
          </button>
        </div>
      )}
    </div>
  );
};

export default InventarioTabla;
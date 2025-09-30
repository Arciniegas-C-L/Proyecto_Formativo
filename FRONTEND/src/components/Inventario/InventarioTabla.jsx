import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../assets/css/Inventario/InventarioTabla.css";

import {
  getTablaCategorias,
  getTablaSubcategorias,
  getTablaProductos,
  actualizarStockTallas,
  setGrupoTallaSubcategoria, // <<--- NUEVO: sincroniza inventario al cambiar grupo
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
  const [error, setError] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const [openNoCategoriasDialog, setOpenNoCategoriasDialog] = useState(false);
  const [contador, setContador] = useState(10);
  const [openNoGrupoTallaDialog, setOpenNoGrupoTallaDialog] = useState(false);
  const [contadorGrupoTalla, setContadorGrupoTalla] = useState(5);

  const navigate = useNavigate();

  // Inicializar
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        try {
          await asignarGrupoTallaDefault();
        } catch (e) {
          console.error("Asignar grupo por defecto:", e);
        }
        await cargarGruposTalla();
        await cargarCategorias();
      } catch (e) {
        console.error("Error al inicializar:", e);
        showSnackbar("Error al inicializar el componente", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Redirección cuando no hay categorías
  useEffect(() => {
    let interval;
    if (openNoCategoriasDialog && contador > 0) {
      interval = setInterval(() => {
        setContador((prev) => {
          if (prev <= 1) {
            navigate("/categorias");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => interval && clearInterval(interval);
  }, [openNoCategoriasDialog, contador, navigate]);

  // Redirección cuando no hay grupos de talla
  useEffect(() => {
    let interval;
    if (openNoGrupoTallaDialog && contadorGrupoTalla > 0) {
      interval = setInterval(() => {
        setContadorGrupoTalla((prev) => {
          if (prev <= 1) {
            navigate("/grupo-talla");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => interval && clearInterval(interval);
  }, [openNoGrupoTallaDialog, contadorGrupoTalla, navigate]);

  const cargarGruposTalla = async () => {
    try {
      const response = await getAllGruposTalla();
      const gruposData = Array.isArray(response.data) ? response.data : [];
      const gruposFormateados = gruposData.map((g) => ({
        idGrupoTalla: Number(g.idGrupoTalla || g.id),
        nombre: g.nombre,
        estado: !!g.estado,
      }));
      setGruposTalla(gruposFormateados);
    } catch (e) {
      console.error("Error al cargar grupos de talla:", e);
      showSnackbar("Error al cargar grupos de talla", "error");
      setGruposTalla([]);
    }
  };

  const cargarCategorias = async () => {
    try {
      setLoading(true);
      const data = await getTablaCategorias();
      if (!data || !data.datos || data.datos.length === 0) {
        setOpenNoCategoriasDialog(true);
        return;
      }
      setCurrentData(data);
      setCurrentView("categorias");
      setBreadcrumbs([{ text: "Categorías", active: true }]);
      setSelectedCategoria(null);
      setSelectedSubcategoria(null);
    } catch (e) {
      console.error("Error al cargar categorías:", e);
      showSnackbar("Error al cargar las categorías", "error");
    } finally {
      setLoading(false);
    }
  };

  const cargarSubcategorias = async (categoriaId, categoriaNombre) => {
    try {
      setLoading(true);
      const data = await getTablaSubcategorias(categoriaId);

      if (!gruposTalla || gruposTalla.length === 0) {
        setOpenNoGrupoTallaDialog(true);
        return;
      }
      if (!data.datos || data.datos.length === 0) {
        showSnackbar(`No hay subcategorías en "${categoriaNombre}"`, "info");
        return;
      }

      setCurrentData(data);
      setCurrentView("subcategorias");
      setSelectedCategoria({ id: categoriaId, nombre: categoriaNombre });
      setBreadcrumbs([
        { text: "Categorías", active: false, onClick: cargarCategorias },
        { text: categoriaNombre, active: true },
      ]);
      setSelectedSubcategoria(null);
    } catch (e) {
      console.error("Error al cargar subcategorías:", e);
      showSnackbar("Error al cargar subcategorías", "error");
    } finally {
      setLoading(false);
    }
  };

  const cargarProductos = async (subcategoriaId, subcategoriaNombre) => {
    try {
      setLoading(true);
      const data = await getTablaProductos(subcategoriaId);
      if (!data.datos || data.datos.length === 0) {
        showSnackbar(`No hay productos en "${subcategoriaNombre}"`, "info");
        return;
      }
      setCurrentData(data);
      setCurrentView("productos");
      setSelectedSubcategoria({ id: subcategoriaId, nombre: subcategoriaNombre });
      setBreadcrumbs([
        { text: "Categorías", active: false, onClick: cargarCategorias },
        {
          text: selectedCategoria?.nombre || "Categoría",
          active: false,
          onClick: () =>
            selectedCategoria &&
            cargarSubcategorias(selectedCategoria.id, selectedCategoria.nombre),
        },
        { text: subcategoriaNombre, active: true },
      ]);
    } catch (e) {
      console.error("Error al cargar productos:", e);
      showSnackbar("Error al cargar productos", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenStockDialog = (producto) => {
    setSelectedProducto(producto);
    const stockInicial = {};
    const stockMinimoInicial = {};
    Object.entries(producto.stock_por_talla || {}).forEach(([talla, info]) => {
      stockInicial[talla] = info?.stock ?? 0;
      stockMinimoInicial[talla] = info?.stock_minimo ?? 0;
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
    setError("");
  };

  const handleGrupoTallaChange = async (event, subcategoria) => {
    try {
      const nuevoGrupoId = Number(event.target.value);
      if (!nuevoGrupoId) return showSnackbar("Seleccione un grupo de tallas", "error");

      const grupoExiste = gruposTalla.some((g) => g.idGrupoTalla === nuevoGrupoId);
      if (!grupoExiste) return showSnackbar("El grupo seleccionado no existe", "error");

      const grupoActualId = Number(
        subcategoria.grupoTalla?.idGrupoTalla || subcategoria.grupoTalla?.id
      );
      if (grupoActualId === nuevoGrupoId)
        return showSnackbar("Ya está seleccionado este grupo", "info");

      setLoading(true);

      // 1) Actualiza la FK en Subcategoría
      await updateGrupoTalla(subcategoria.id, nuevoGrupoId);

      // 2) Sincroniza inventarios (crea los faltantes del nuevo grupo)
      await setGrupoTallaSubcategoria(subcategoria.id, nuevoGrupoId);

      showSnackbar("Grupo de talla actualizado y sincronizado", "success");

      // 3) Recarga lista
      await cargarSubcategorias(selectedCategoria.id, selectedCategoria.nombre);
    } catch (e) {
      console.error("handleGrupoTallaChange:", e);
      showSnackbar(
        e?.response?.data?.error || e.message || "Error al actualizar el grupo de talla",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStockChange = (talla, value) => {
    const newValue = Number.isNaN(parseInt(value, 10)) ? 0 : parseInt(value, 10);
    const stockTotal = selectedProducto?.stock || 0;
    const stockActual = Object.values(stockForm).reduce(
      (sum, s) => sum + (parseInt(s, 10) || 0),
      0
    );
    const stockActualSinTalla =
      stockActual - (parseInt(stockForm[talla], 10) || 0);
    const stockDisponible = stockTotal - stockActualSinTalla;

    if (newValue > stockDisponible) {
      setError(`No puedes asignar más de ${stockDisponible} unidades a ${talla}`);
      return;
    }
    setStockForm((prev) => ({ ...prev, [talla]: newValue }));
    setError(null);
  };

  const handleSaveStock = async () => {
    try {
      const stockTotal = Object.values(stockForm).reduce(
        (sum, s) => sum + (parseInt(s, 10) || 0),
        0
      );
      if (stockTotal > (selectedProducto?.stock || 0)) {
        setError("La suma por talla no puede exceder el stock total del producto");
        return;
      }
      const tallasData = Object.entries(selectedProducto?.stock_por_talla || {}).map(
        ([talla, info]) => ({
          talla_id: info.talla_id,
          stock: stockForm[talla] || 0,
          stock_minimo: stockMinimoForm[talla] ?? info.stock_minimo ?? 0,
        })
      );

      await actualizarStockTallas(selectedProducto.id, tallasData);
      showSnackbar("Stock por tallas actualizado", "success");
      handleCloseStockDialog();
      if (selectedSubcategoria) {
        await cargarProductos(selectedSubcategoria.id, selectedSubcategoria.nombre);
      }
    } catch (e) {
      console.error("actualizar stock:", e);
      showSnackbar(e?.response?.data?.error || "Error al distribuir el stock", "error");
    }
  };

  const renderCategoriasTable = () => (
    <div className="tabla-container">
      <table className="tabla-inventario">
        <thead>
          <tr>
            {currentData.columnas.map((c) => (
              <th key={c.campo}>{c.titulo}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {currentData.datos.map((cat) => (
            <tr key={cat.id}>
              <td>{cat.nombre}</td>
              <td>{cat.subcategorias_count}</td>
              <td>{cat.productos_count}</td>
              <td>
                <span className={`custom-badge ${cat.estado ? "badge-success" : "badge-error"}`}>
                  {cat.estado ? "Activo" : "Inactivo"}
                </span>
              </td>
              <td>
                <button
                  className="btn-action btn-primary"
                  onClick={() => cargarSubcategorias(cat.id, cat.nombre)}
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
              {currentData.columnas.map((c) => (
                <th key={c.campo}>{c.titulo}</th>
              ))}
              <th>Grupo de Talla</th>
            </tr>
          </thead>
          <tbody>
            {currentData.datos.map((sub) => {
              const grupoTallaId = Number(
                sub.grupoTalla?.idGrupoTalla || sub.grupoTalla?.id || 0
              );
              return (
                <tr key={sub.id}>
                  <td>{sub.nombre}</td>
                  <td>{sub.productos_count}</td>
                  <td>
                    <span
                      className={`custom-badge ${
                        sub.stock_total <= 5 ? "badge-error" : "badge-success"
                      }`}
                    >
                      {sub.stock_total} unidades
                    </span>
                  </td>
                  <td>5</td>
                  <td>
                    <span
                      className={`custom-badge ${
                        sub.estado ? "badge-success" : "badge-error"
                      }`}
                    >
                      {sub.estado ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>
                    <div className="d-flex gap-2 justify-content-center">
                      <button
                        className="btn-action btn-primary"
                        onClick={() => cargarProductos(sub.id, sub.nombre)}
                        title="Ver productos"
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      <button
                        className="btn-action btn-secondary"
                        onClick={() =>
                          navigate(
                            `/admin/productos/crear`
                          )
                        }
                        title="Crear producto"
                      >
                        <i className="fas fa-plus"></i>
                      </button>
                    </div>
                  </td>
                  <td>
                    {grupoTallaId ? (
                      renderGrupoTallaSelect(sub)
                    ) : (
                      <div className="alert-warning">Se requiere asignar un grupo</div>
                    )}
                  </td>
                </tr>
              );
            })}
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
        {currentData.datos.map((producto) => {
          const nombre = producto.nombre || "Sin nombre";
          const precio = Number(producto.precio || 0);
          // Si tu API trae "stock" como total, úsalo; si trae "stock_total", ajusta aquí:
          const total = Number(producto.stock ?? producto.stock_total ?? 0);
          // Si tu API trae stock_minimo_total, úsalo aquí:
          const stockMinimo = Number(producto.stock_minimo ?? 5);

          return (
            <tr key={producto.id}>
              {/* Columna de Producto (imagen y nombre) */}
              <td>
                <div className="producto-info">
                  {producto.imagen ? (
                    <>
                      <img
                        src={producto.imagen || "https://via.placeholder.com/100"}
                        alt={nombre}
                        className="producto-imagen"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          const ph = e.currentTarget.nextElementSibling;
                          if (ph) ph.style.display = "flex";
                        }}
                        loading="lazy"
                      />
                      <div className="imagen-placeholder" style={{ display: "none" }}>
                        <i className="fas fa-image"></i>
                      </div>
                    </>
                  ) : (
                    <div className="imagen-placeholder">
                      <i className="fas fa-image"></i>
                    </div>
                  )}
                  <span className="producto-nombre">{nombre}</span>
                </div>
              </td>

              <td>${precio.toLocaleString("es-CO")}</td>

              <td>
                <span className={`custom-badge ${total <= 5 ? "badge-error" : "badge-success"}`}>
                  {total} unidades
                </span>
              </td>

              <td>{stockMinimo}</td>

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
                  {Object.entries(producto.stock_por_talla || {}).map(([talla, info]) => (
                    <span
                      key={talla}
                      className={`custom-badge-small ${
                        (info?.stock || 0) <= 5 ? "badge-small-error" : "badge-small-success"
                      }`}
                    >
                      {talla}: {info?.stock || 0}
                    </span>
                  ))}
                </div>
              </td>

              <td>
                <div className="d-flex gap-1 justify-content-center">
                  <button
                    className="btn-action btn-primary"
                    onClick={() => navigate(`/admin/productos/${producto.id}`)} // ajusta si tu ruta es distinta
                    title="Ver detalles del producto"
                  >
                    <i className="fas fa-eye"></i>
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);


  const StockDialog = () => {
    const stockTotal = selectedProducto?.stock || 0;
    const stockDistribuido = Object.values(stockForm).reduce(
      (sum, s) => sum + (parseInt(s, 10) || 0),
      0
    );
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
            <button className="modal-close" onClick={handleCloseStockDialog} title="Cerrar">
              &times;
            </button>
          </div>
          <div className="modal-body">
            {error && <div className="alert-danger">{error}</div>}
            <h6 className="mb-3">{selectedProducto?.nombre}</h6>
            <div className="stock-info">
              <div>Stock Total del Producto: {stockTotal} unidades</div>
              <div>Stock Distribuido: {stockDistribuido} unidades</div>
              <div className={stockRestante < 0 ? "text-danger fw-bold" : ""}>
                Stock Restante: {stockRestante} unidades
              </div>
            </div>
            <div className="stock-form">
              {Object.entries(selectedProducto?.stock_por_talla || {}).map(([talla]) => {
                const stockActualSinTalla =
                  stockDistribuido - (parseInt(stockForm[talla], 10) || 0);
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
                      <small className="text-muted">Máximo disponible: {stockDisponible} unidades</small>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-cancel" onClick={handleCloseStockDialog}>
              Cancelar
            </button>
            <button className="btn btn-save" onClick={handleSaveStock} disabled={stockRestante < 0}>
              Guardar Distribución
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderGrupoTallaSelect = (subcategoria) => {
    if (!subcategoria.grupoTalla) return <div className="alert-warning">No tiene grupo de tallas asignado</div>;

    const grupoTallaId = Number(
      subcategoria.grupoTalla?.idGrupoTalla || subcategoria.grupoTalla?.id || 0
    );

    if (!grupoTallaId) return <div className="alert-warning">Se requiere asignar un grupo</div>;

    return (
      <select
        className="custom-select"
        value={grupoTallaId}
        onChange={(e) => handleGrupoTallaChange(e, subcategoria)}
        disabled={loading}
      >
        {Array.isArray(gruposTalla) && gruposTalla.length > 0 ? (
          gruposTalla
            .filter((g) => g.estado)
            .map((g) => (
              <option key={g.idGrupoTalla} value={g.idGrupoTalla}>
                {g.nombre}
              </option>
            ))
        ) : (
          <option disabled>No hay grupos disponibles</option>
        )}
      </select>
    );
  };

  const showSnackbar = (message, severity = "info") => {
    setSnackbar({ open: true, message, severity });
  };
  const handleCloseSnackbar = () => setSnackbar((prev) => ({ ...prev, open: false }));
  const handleRedireccionManual = () => navigate("/categorias");
  const handleRedireccionManualGrupoTalla = () => navigate("/grupo-talla");

  if (loading) {
    return (
      <div className="inventario-tabla-container">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (openNoCategoriasDialog) {
    return (
      <div className="inventario-tabla-container">
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="fas fa-exclamation-triangle text-warning me-2"></i>
                No hay categorías disponibles
              </h5>
            </div>
            <div className="modal-body">
              <p>No se encontraron categorías en el sistema.</p>
              <p className="text-muted">
                Serás redirigido automáticamente a la página de categorías en {contador} segundos.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-save" onClick={handleRedireccionManual}>
                Ir a Categorías Ahora
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (openNoGrupoTallaDialog) {
    return (
      <div className="inventario-tabla-container">
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="fas fa-exclamation-triangle text-warning me-2"></i>
                Grupos de Talla Requeridos
              </h5>
            </div>
            <div className="modal-body">
              <p>Necesitas crear al menos un grupo de talla para continuar.</p>
              <p className="text-muted">
                Serás redirigido automáticamente a la página de grupos de talla en {contadorGrupoTalla} segundos.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-save" onClick={handleRedireccionManualGrupoTalla}>
                Ir a Grupos de Talla Ahora
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
      <nav className="breadcrumb-nav">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <button className="breadcrumb-btn" onClick={() => cargarCategorias()}>
              <i className="fas fa-home"></i> Inventario
            </button>
          </li>
          {breadcrumbs.map((crumb, i) =>
            crumb.active ? (
              <li key={i} className="breadcrumb-item active">
                {crumb.text}
              </li>
            ) : (
              <li key={i} className="breadcrumb-item">
                <button className="breadcrumb-btn" onClick={crumb.onClick}>
                  {crumb.text}
                </button>
              </li>
            )
          )}
        </ol>
      </nav>

      <h2 className="page-title">{currentData.titulo}</h2>

      {currentView === "categorias" && renderCategoriasTable()}
      {currentView === "subcategorias" && renderSubcategoriasTable()}
      {currentView === "productos" && renderProductosTable()}

      <StockDialog />

      {snackbar.open && (
        <div className={`snackbar snackbar-${snackbar.severity}`}>
          <i
            className={`fas ${
              snackbar.severity === "error"
                ? "fa-exclamation-circle"
                : snackbar.severity === "warning"
                ? "fa-exclamation-triangle"
                : snackbar.severity === "success"
                ? "fa-check-circle"
                : "fa-info-circle"
            }`}
          ></i>
          <span>{snackbar.message}</span>
          <button className="snackbar-close" onClick={handleCloseSnackbar}>
            &times;
          </button>
        </div>
      )}
    </div>
  );
};

export default InventarioTabla;

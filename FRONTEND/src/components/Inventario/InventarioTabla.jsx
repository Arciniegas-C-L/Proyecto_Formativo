import React, { useState, useEffect } from "react";
import "../../assets/css/Inventario/InventarioTabla.css";
import { useNavigate } from "react-router-dom";

import {
  getTablaCategorias,
  getTablaSubcategorias,
  getTablaProductos,
} from "../../api/InventarioApi";

import {
  updateGrupoTalla,
  asignarGrupoTallaDefault,
} from "../../api/Subcategoria.api";

import { getAllGruposTalla } from "../../api/GrupoTalla.api";

import {
  FaEye,
  FaSave,
  FaPlus,
  FaImage,
} from "react-icons/fa";

const BACKEND_URL = "http://127.0.0.1:8000";

const InventarioTabla = () => {
  const [currentView, setCurrentView] = useState("categorias");
  const [currentData, setCurrentData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selectedCategoria, setSelectedCategoria] = useState(null);
  const [selectedSubcategoria, setSelectedSubcategoria] = useState(null);

  const [gruposTalla, setGruposTalla] = useState([]);

  const [breadcrumbs, setBreadcrumbs] = useState([]);

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

  const navigate = useNavigate();

  // Cargar inicial
  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      try {
        await asignarGrupoTallaDefault();
      } catch {
        // ignorar errores
      }
      await cargarGruposTalla();
      await cargarCategorias();
      setLoading(false);
    };
    initialize();
  }, []);

  const cargarCategorias = async () => {
    setLoading(true);
    try {
      const data = await getTablaCategorias();
      if (!data || !data.datos) throw new Error("No hay categorías");
      setCurrentData(data);
      setCurrentView("categorias");
      setSelectedCategoria(null);
      setSelectedSubcategoria(null);
      setBreadcrumbs([{ text: "Categorías", active: true }]);
    } catch (error) {
      mostrarSnackbar("Error al cargar categorías", "error");
    } finally {
      setLoading(false);
    }
  };

  const cargarSubcategorias = async (categoriaId, categoriaNombre) => {
    setLoading(true);
    try {
      const data = await getTablaSubcategorias(categoriaId);
      if (!data || !data.datos) throw new Error("No hay subcategorías");
      setCurrentData(data);
      setCurrentView("subcategorias");
      setSelectedCategoria({ id: categoriaId, nombre: categoriaNombre });
      setSelectedSubcategoria(null);
      setBreadcrumbs([
        { text: "Categorías", active: false, onClick: cargarCategorias },
        { text: categoriaNombre, active: true },
      ]);
    } catch (error) {
      mostrarSnackbar(`No hay subcategorías en ${categoriaNombre}`, "info");
    } finally {
      setLoading(false);
    }
  };

  const cargarProductos = async (subcategoriaId, subcategoriaNombre) => {
    setLoading(true);
    try {
      const data = await getTablaProductos(subcategoriaId);
      if (!data || !data.datos) throw new Error("No hay productos");
      setCurrentData(data);
      setCurrentView("productos");
      setSelectedSubcategoria({ id: subcategoriaId, nombre: subcategoriaNombre });
      setBreadcrumbs([
        { text: "Categorías", active: false, onClick: cargarCategorias },
        {
          text: selectedCategoria?.nombre,
          active: false,
          onClick: () =>
            cargarSubcategorias(selectedCategoria.id, selectedCategoria.nombre),
        },
        { text: subcategoriaNombre, active: true },
      ]);
    } catch (error) {
      mostrarSnackbar(`No hay productos en ${subcategoriaNombre}`, "info");
    } finally {
      setLoading(false);
    }
  };

  const cargarGruposTalla = async () => {
    try {
      const res = await getAllGruposTalla();
      const grupos = res.data || [];
      setGruposTalla(
        grupos.map((g) => ({
          idGrupoTalla: Number(g.idGrupoTalla || g.id),
          nombre: g.nombre,
          estado: g.estado,
        }))
      );
    } catch {
      setGruposTalla([]);
    }
  };

  const handleGrupoTallaChange = async (e, subcategoria) => {
    const nuevoId = Number(e.target.value);
    if (!nuevoId) return mostrarSnackbar("Seleccione un grupo de tallas", "error");
    if (nuevoId === Number(subcategoria.grupoTalla?.idGrupoTalla)) {
      return mostrarSnackbar("Ya está seleccionado este grupo", "info");
    }
    setLoading(true);
    try {
      await updateGrupoTalla(subcategoria.id, nuevoId);
      mostrarSnackbar("Grupo de talla actualizado", "success");
      cargarCategorias();
    } catch (error) {
      mostrarSnackbar("Error al actualizar grupo de talla", "error");
    } finally {
      setLoading(false);
    }
  };

  const mostrarSnackbar = (msg, sev = "info") => {
    setSnackbar({ open: true, message: msg, severity: sev });
    setTimeout(() => setSnackbar({ open: false, message: "", severity: "info" }), 4000);
  };

  // Render tablas

  const renderCategoriasTable = () => (
    <div className="inventario-tabla-responsive">
      <table className="inventario-tabla">
        <thead>
          <tr>
            {currentData.columnas.map((col) => (
              <th key={col.campo}>{col.titulo}</th>
            ))}
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {currentData.datos.map((cat) => (
            <tr key={cat.id} onClick={() => cargarSubcategorias(cat.id, cat.nombre)} className="fila-clickable">
              <td title={cat.nombre}>{cat.nombre}</td>
              <td>{cat.subcategorias_count}</td>
              <td>{cat.productos_count}</td>
              <td>
                <span className={`badge ${cat.estado ? "bg-success" : "bg-secondary"}`}>
                  {cat.estado ? "Activo" : "Inactivo"}
                </span>
              </td>
              <td>
                <button
                  className="btn-editar"
                  onClick={(e) => {
                    e.stopPropagation();
                    cargarSubcategorias(cat.id, cat.nombre);
                  }}
                  title="Ver subcategorías"
                >
                  <FaEye />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderSubcategoriasTable = () => (
    <div className="inventario-tabla-responsive">
      <table className="inventario-tabla">
        <thead>
          <tr>
            {currentData.columnas.map((col) => (
              <th key={col.campo}>{col.titulo}</th>
            ))}
            <th>Grupo de Talla</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {currentData.datos.map((sub) => (
            <tr key={sub.id}>
              <td title={sub.nombre}>{sub.nombre}</td>
              <td>{sub.productos_count}</td>
              <td>
                <span className={`badge ${sub.stock_total <= 5 ? "bg-danger" : "bg-success"}`}>
                  {sub.stock_total} unidades
                </span>
              </td>
              <td>5</td>
              <td>
                <span className={`badge ${sub.estado ? "bg-success" : "bg-secondary"}`}>
                  {sub.estado ? "Activo" : "Inactivo"}
                </span>
              </td>
              <td>
                <select
                  className="input-grupo-talla"
                  value={Number(sub.grupoTalla?.idGrupoTalla || 0)}
                  onChange={(e) => handleGrupoTallaChange(e, sub)}
                  disabled={loading}
                >
                  <option value={0} disabled>
                    Seleccionar grupo
                  </option>
                  {gruposTalla
                    .filter((g) => g.estado)
                    .map((grupo) => (
                      <option key={grupo.idGrupoTalla} value={grupo.idGrupoTalla}>
                        {grupo.nombre}
                      </option>
                    ))}
                </select>
              </td>
              <td>
                <div className="botones-acciones">
                  <button
                    className="btn-editar"
                    onClick={() => cargarProductos(sub.id, sub.nombre)}
                    title="Ver productos"
                  >
                    <FaEye />
                  </button>
                  <button
                    className="btn-guardar"
                    onClick={() => navigate(`/producto/crear?subcategoria=${sub.id}&subcategoriaNombre=${encodeURIComponent(sub.nombre)}`)}
                    title="Crear producto"
                  >
                    <FaPlus />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderProductosTable = () => (
    <div className="inventario-tabla-responsive">
      <table className="inventario-tabla">
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
          {currentData.datos.map((prod) => {
            const totalStock = Object.values(prod.stock_por_talla).reduce(
              (acc, val) => acc + (val.stock || 0),
              0
            );
            return (
              <tr key={prod.id}>
                <td className="td-producto">
                  {prod.imagen ? (
                    <img
                      src={`${BACKEND_URL}${prod.imagen}`}
                      alt={prod.nombre}
                      className="img-producto"
                      loading="lazy"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  ) : (
                    <FaImage className="img-placeholder" />
                  )}
                  <span title={prod.nombre}>{prod.nombre}</span>
                </td>
                <td>${prod.precio.toLocaleString("es-CO")}</td>
                <td>
                  <span className={`badge ${totalStock <= 5 ? "bg-danger" : "bg-success"}`}>
                    {totalStock} unidades
                  </span>
                </td>
                <td>5</td>
                <td>
                  {/* Aquí podrías mostrar tallas con stock, simplificado */}
                  <div className="stock-tallas">
                    {Object.entries(prod.stock_por_talla).map(([talla, info]) => (
                      <span
                        key={talla}
                        className={`badge ${
                          info.stock <= 5 ? "bg-danger" : "bg-success"
                        }`}
                        title={`Stock talla ${talla}`}
                      >
                        {talla}: {info.stock}
                      </span>
                    ))}
                  </div>
                </td>
                <td>
                  <div className="botones-acciones">
                    <button className="btn-guardar" title="Guardar cambios" disabled>
                      <FaSave />
                    </button>
                    <button
                      className="btn-editar"
                      title="Ver detalles"
                      onClick={() => window.open(prod.acciones?.ver_detalle, "_blank")}
                    >
                      <FaEye />
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

  return (
    <section className="inventario-tabla-container">
      <h1 className="titulo-inventario">Gestión de Inventario</h1>

      <nav aria-label="breadcrumb">
        <ol className="breadcrumb inventario-breadcrumb">
          {breadcrumbs.map((crumb, idx) => (
            <li
              key={idx}
              className={`breadcrumb-item ${crumb.active ? "active" : ""}`}
              onClick={!crumb.active ? crumb.onClick : undefined}
              style={{ cursor: !crumb.active ? "pointer" : "default" }}
              aria-current={crumb.active ? "page" : undefined}
            >
              {crumb.text}
            </li>
          ))}
        </ol>
      </nav>

      {loading && <p className="loading-text">Cargando...</p>}

      {!loading && (
        <>
          {currentView === "categorias" && renderCategoriasTable()}
          {currentView === "subcategorias" && renderSubcategoriasTable()}
          {currentView === "productos" && renderProductosTable()}
        </>
      )}

      {snackbar.open && (
        <div
          className={`alerta snackbar alerta-${snackbar.severity}`}
          onClick={() => setSnackbar({ open: false, message: "", severity: "info" })}
        >
          {snackbar.message}
        </div>
      )}
    </section>
  );
};

export default InventarioTabla;
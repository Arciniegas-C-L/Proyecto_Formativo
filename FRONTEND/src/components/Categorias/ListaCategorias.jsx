import React, { useEffect, useState } from "react";
import { updateCategoria, deleteCategoria } from "../../api/Categoria.api";
import { updateSubcategoria, deleteSubcategoria } from "../../api/Subcategoria.api";
import "../../assets/css/Categoria/ListaCategoria.css";
import { EliminarModal } from "../EliminarModal/EliminarModal.jsx";

function ListaCategorias({ categorias = [], onCategoriasActualizadas = () => {} }) {
  const [categoriasEditadas, setCategoriasEditadas] = useState(categorias);
  const [mostrarSub, setMostrarSub] = useState({});
  const [categoriaAEliminar, setCategoriaAEliminar] = useState(null);
  const [subcategoriaAEliminar, setSubcategoriaAEliminar] = useState(null);

  const [categoriaEditModal, setCategoriaEditModal] = useState(null);
  const [editModalData, setEditModalData] = useState({ nombre: "", estado: true });

  const [subcategoriaEditModal, setSubcategoriaEditModal] = useState(null);
  const [editSubModalData, setEditSubModalData] = useState({ nombre: "", estado: true });

  useEffect(() => {
    setCategoriasEditadas(Array.isArray(categorias) ? categorias : []);
  }, [categorias]);

  // ======== FUNCIONES EDITAR ========
  const abrirModalEditar = (cat) => {
    setCategoriaEditModal(cat);
    setEditModalData({ nombre: cat.nombre, estado: !!cat.estado });
  };

  const cerrarModalEditar = () => {
    setCategoriaEditModal(null);
    setEditModalData({ nombre: "", estado: true });
  };

  const guardarModalEditar = async () => {
    try {
      await updateCategoria(categoriaEditModal.idCategoria, {
        nombre: editModalData.nombre,
        estado: Boolean(editModalData.estado),
      });
      onCategoriasActualizadas();
      cerrarModalEditar();
    } catch (e) {
      console.error("Error actualizando categoría", e);
      alert("Error al actualizar categoría");
    }
  };

  const abrirModalEditarSub = (sub) => {
    setSubcategoriaEditModal(sub);
    setEditSubModalData({ nombre: sub.nombre, estado: !!sub.estado });
  };

  const cerrarModalEditarSub = () => {
    setSubcategoriaEditModal(null);
    setEditSubModalData({ nombre: "", estado: true });
  };

  const guardarModalEditarSub = async (catId) => {
    try {
      await updateSubcategoria(subcategoriaEditModal.idSubcategoria, {
        nombre: editSubModalData.nombre,
        estado: Boolean(editSubModalData.estado),
        categoria: Number(catId),
      });
      onCategoriasActualizadas();
      cerrarModalEditarSub();
    } catch (e) {
      console.error("Error actualizando subcategoría", e);
      alert("Error al actualizar subcategoría");
    }
  };

  // ======== FUNCIONES ELIMINAR ========
  const eliminarCategoria = async () => {
    const cat = categoriaAEliminar;
    if (!cat) return;
    try {
      for (const sub of cat.subcategorias || []) {
        await deleteSubcategoria(sub.idSubcategoria).catch(() => {});
      }
      await deleteCategoria(cat.idCategoria);
      alert("Categoría y subcategorías eliminadas");
      onCategoriasActualizadas();
    } catch (e) {
      console.error("Error eliminando categoría y subcategorías", e);
      alert("No se pudo eliminar la categoría");
    } finally {
      setCategoriaAEliminar(null);
    }
  };

  const eliminarSubConfirmado = async () => {
    if (!subcategoriaAEliminar) return;
    try {
      await deleteSubcategoria(subcategoriaAEliminar.idSubcategoria);
      alert("Subcategoría eliminada");
      onCategoriasActualizadas();
    } catch (e) {
      console.error("Error eliminando subcategoría", e);
      alert("No se pudo eliminar la subcategoría");
    } finally {
      setSubcategoriaAEliminar(null);
    }
  };

  // ======== FUNCIONES CAMBIO INLINE ========
  const cambiarCategoria = (id, field, value) => {
    setCategoriasEditadas(prev =>
      prev.map(cat => (cat.idCategoria === id ? { ...cat, [field]: value } : cat))
    );
  };

  const cambiarSubcategoria = (catId, subId, field, value) => {
    setCategoriasEditadas(prev =>
      prev.map(cat => {
        if (cat.idCategoria !== catId) return cat;
        const subcategorias = (cat.subcategorias || []).map(sub =>
          sub.idSubcategoria === subId ? { ...sub, [field]: value } : sub
        );
        return { ...cat, subcategorias };
      })
    );
  };

  // ======== RENDER ========
  return (
    <div className="contenedor-categorias">
      <h3 className="titulo-categorias">Listado de Categorías y Subcategorías</h3>

      {categoriasEditadas.length === 0 ? (
        <p className="mensaje-vacio">No hay categorías registradas</p>
      ) : (
        <div className="contenedor-tarjetas">
          {categoriasEditadas.map(cat => (
            <div key={cat.idCategoria} className="tarjeta-categoria">
              <div className="header-tarjeta">
                <div className="categoria-row">
                  <div className="categoria-info">
                    <input
                      type="text"
                      className="input-categoria"
                      value={cat.nombre || ""}
                      onChange={e => cambiarCategoria(cat.idCategoria, "nombre", e.target.value)}
                    />
                    <label className="label-check">
                      <input
                        type="checkbox"
                        checked={!!cat.estado}
                        onChange={e => cambiarCategoria(cat.idCategoria, "estado", e.target.checked)}
                      />
                      Activo
                    </label>
                  </div>
                </div>
                <div className="grupo-botones">
                  <button className="btn-editar" onClick={() => abrirModalEditar(cat)}>Editar</button>
                  <button className="btn-subcategorias" onClick={() =>
                    setMostrarSub(prev => ({ ...prev, [cat.idCategoria]: !prev[cat.idCategoria] }))
                  }>
                    {mostrarSub[cat.idCategoria] ? "Ocultar Subcategorías" : "Mostrar Subcategorías"}
                  </button>
                  <button className="btn-eliminar" onClick={() => setCategoriaAEliminar(cat)}>Eliminar categoría</button>
                </div>
              </div>

              {mostrarSub[cat.idCategoria] && (
                <div className="subcategorias">
                  {cat.subcategorias?.length > 0 ? cat.subcategorias.map(sub => (
                    <div key={sub.idSubcategoria} className="fila-subcategoria">
                      <input
                        type="text"
                        value={sub.nombre || ""}
                        onChange={e => cambiarSubcategoria(cat.idCategoria, sub.idSubcategoria, "nombre", e.target.value)}
                      />
                      <label>
                        <input
                          type="checkbox"
                          checked={!!sub.estado}
                          onChange={e => cambiarSubcategoria(cat.idCategoria, sub.idSubcategoria, "estado", e.target.checked)}
                        />
                        Activo
                      </label>
                      <div className="grupo-botones">
                        <button className="btn-editar" onClick={() => abrirModalEditarSub(sub)}>Editar</button>
                        <button className="btn-eliminar" onClick={() => setSubcategoriaAEliminar(sub)}>Eliminar subcategoría</button>
                      </div>
                    </div>
                  )) : <em>No hay subcategorías</em>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ===== MODALES ===== */}
      {categoriaEditModal && (
        <div className="dialog-categoria-modal">
          <div className="form-categoria-modal">
            <h3>Editar Categoría</h3>
            <label className="form-label">Nombre *</label>
            <input
              className="form-control mb-2"
              name="nombre"
              value={editModalData.nombre}
              onChange={e => setEditModalData({ ...editModalData, nombre: e.target.value })}
              maxLength={45}
            />
            <div className="form-check mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                name="estado"
                checked={!!editModalData.estado}
                onChange={e => setEditModalData({ ...editModalData, estado: e.target.checked })}
              />
              <label className="form-check-label">Activo</label>
            </div>
            <div className="d-flex justify-content-end gap-2">
              <button className="btn btn-secondary" onClick={cerrarModalEditar}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={guardarModalEditar}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {subcategoriaEditModal && (
        <div className="dialog-categoria-modal">
          <div className="form-categoria-modal">
            <h3>Editar Subcategoría</h3>
            <label className="form-label">Nombre *</label>
            <input
              className="form-control mb-2"
              name="nombre"
              value={editSubModalData.nombre}
              onChange={e => setEditSubModalData({ ...editSubModalData, nombre: e.target.value })}
              maxLength={45}
            />
            <div className="form-check mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                name="estado"
                checked={!!editSubModalData.estado}
                onChange={e => setEditSubModalData({ ...editSubModalData, estado: e.target.checked })}
              />
              <label className="form-check-label">Activo</label>
            </div>
            <div className="d-flex justify-content-end gap-2">
              <button className="btn btn-secondary" onClick={cerrarModalEditarSub}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={() => guardarModalEditarSub(subcategoriaEditModal.categoria)}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {categoriaAEliminar && (
        <EliminarModal
          abierto
          mensaje={`¿Eliminar la categoría "${categoriaAEliminar.nombre}" y TODAS sus subcategorías?`}
          onCancelar={() => setCategoriaAEliminar(null)}
          onConfirmar={eliminarCategoria}
        />
      )}

      {subcategoriaAEliminar && (
        <EliminarModal
          abierto
          mensaje={`¿Eliminar la subcategoría "${subcategoriaAEliminar.nombre}"?`}
          onCancelar={() => setSubcategoriaAEliminar(null)}
          onConfirmar={eliminarSubConfirmado}
        />
      )}
    </div>
  );
}

export default ListaCategorias;
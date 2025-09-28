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

  //  FUNCIONES EDITAR 
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

  //  FUNCIONES ELIMINAR 
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

  //  RENDER
  return (
    <>
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
                      readOnly
                      placeholder="Nombre de la categoría"
                    />
                    <label className="label-check">
                      <input
                        type="checkbox"
                        checked={!!cat.estado}
                        readOnly
                      />
                      <span>Activo</span>
                    </label>
                  </div>
                </div>
                
                <div className="grupo-botones">
                  <button 
                    className="btn-editar" 
                    onClick={() => abrirModalEditar(cat)}
                    title="Editar categoría"
                  >
                    <i className="fas fa-edit" aria-hidden="true"></i>
                    <span>Editar</span>
                  </button>
                  
                  <button 
                    className="btn-subcategorias" 
                    onClick={() =>
                      setMostrarSub(prev => ({ ...prev, [cat.idCategoria]: !prev[cat.idCategoria] }))
                    }
                    title={mostrarSub[cat.idCategoria] ? "Ocultar subcategorías" : "Mostrar subcategorías"}
                  >
                    <i className={`fas ${mostrarSub[cat.idCategoria] ? 'fa-eye-slash' : 'fa-eye'}`} aria-hidden="true"></i>
                    <span>{mostrarSub[cat.idCategoria] ? "Ocultar Sub" : "Mostrar Sub"}</span>
                  </button>
                  
                  <button 
                    className="btn-eliminar" 
                    onClick={() => setCategoriaAEliminar(cat)}
                    title="Eliminar categoría"
                  >
                    <i className="fas fa-trash-alt" aria-hidden="true"></i>
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>

              {mostrarSub[cat.idCategoria] && (
                <div className="subcategorias">
                  <div className="subcategorias-header">
                    <h4>Subcategorías</h4>
                    <span className="subcategorias-count">
                      ({cat.subcategorias?.length || 0})
                    </span>
                  </div>
                  
                  {cat.subcategorias?.length > 0 ? cat.subcategorias.map(sub => (
                    <div key={sub.idSubcategoria} className="fila-subcategoria">
                      <div className="sub-input-container">
                        <input
                          type="text"
                          value={sub.nombre || ""}
                          readOnly
                          placeholder="Nombre de la subcategoría"
                        />
                        <label>
                          <input
                            type="checkbox"
                            checked={!!sub.estado}
                            readOnly
                          />
                          <span>Activo</span>
                        </label>
                      </div>
                      
                      <div className="grupo-botones">
                        <button 
                          className="btn-editar" 
                          onClick={() => abrirModalEditarSub(sub)}
                          title="Editar subcategoría"
                        >
                          <i className="fas fa-edit" aria-hidden="true"></i>
                          <span>Editar</span>
                        </button>
                        <button 
                          className="btn-eliminar" 
                          onClick={() => setSubcategoriaAEliminar(sub)}
                          title="Eliminar subcategoría"
                        >
                          <i className="fas fa-trash-alt" aria-hidden="true"></i>
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </div>
                  )) : (
                    <div className="subcategorias-vacio">
                      <i className="fas fa-info-circle" aria-hidden="true"></i>
                      <em>No hay subcategorías registradas</em>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* MODALES  */}
      {categoriaEditModal && (
        <div className="dialog-categoria-modal">
          <div className="form-categoria-modal">
            <div className="modal-header">
              <h3>
                <i className="fas fa-edit" aria-hidden="true"></i>
                Editar Categoría
              </h3>
              <button 
                type="button" 
                className="btn-close"
                onClick={cerrarModalEditar}
                aria-label="Cerrar modal"
              >
                <i className="fas fa-times" aria-hidden="true"></i>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-tag" aria-hidden="true"></i>
                  Nombre *
                </label>
                <input
                  className="form-control"
                  name="nombre"
                  value={editModalData.nombre}
                  onChange={e => setEditModalData({ ...editModalData, nombre: e.target.value })}
                  maxLength={20}
                  placeholder="Ingrese el nombre de la categoría"
                />
              </div>
              
              <div className="form-check mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  name="estado"
                  id="estadoCategoria"
                  checked={!!editModalData.estado}
                  onChange={e => setEditModalData({ ...editModalData, estado: e.target.checked })}
                />
                <label className="form-check-label" htmlFor="estadoCategoria">
                  <i className={`fas ${editModalData.estado ? 'fa-toggle-on' : 'fa-toggle-off'}`} aria-hidden="true"></i>
                  Categoría Activa
                </label>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={cerrarModalEditar}>
                <i className="fas fa-times" aria-hidden="true"></i>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={guardarModalEditar}>
                <i className="fas fa-save" aria-hidden="true"></i>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {subcategoriaEditModal && (
        <div className="dialog-categoria-modal">
          <div className="form-categoria-modal">
            <div className="modal-header">
              <h3>
                <i className="fas fa-edit" aria-hidden="true"></i>
                Editar Subcategoría
              </h3>
              <button 
                type="button" 
                className="btn-close"
                onClick={cerrarModalEditarSub}
                aria-label="Cerrar modal"
              >
                <i className="fas fa-times" aria-hidden="true"></i>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-tags" aria-hidden="true"></i>
                  Nombre *
                </label>
                <input
                  className="form-control"
                  name="nombre"
                  value={editSubModalData.nombre}
                  onChange={e => setEditSubModalData({ ...editSubModalData, nombre: e.target.value })}
                  maxLength={20}
                  placeholder="Ingrese el nombre de la subcategoría"
                />
              </div>
              
              <div className="form-check mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  name="estado"
                  id="estadoSubcategoria"
                  checked={!!editSubModalData.estado}
                  onChange={e => setEditSubModalData({ ...editSubModalData, estado: e.target.checked })}
                />
                <label className="form-check-label" htmlFor="estadoSubcategoria">
                  <i className={`fas ${editSubModalData.estado ? 'fa-toggle-on' : 'fa-toggle-off'}`} aria-hidden="true"></i>
                  Subcategoría Activa
                </label>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={cerrarModalEditarSub}>
                <i className="fas fa-times" aria-hidden="true"></i>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={() => guardarModalEditarSub(subcategoriaEditModal.categoria)}>
                <i className="fas fa-save" aria-hidden="true"></i>
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
    </>
  );
}

export default ListaCategorias;
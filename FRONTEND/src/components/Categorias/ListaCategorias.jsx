import React, { useEffect, useState } from "react";
import { updateCategoria, deleteCategoria } from "../../api/Categoria.api";
import { updateSubcategoria, deleteSubcategoria } from "../../api/Subcategoria.api";
import "../../assets/css/Categoria/ListaCategoria.css";

export function ListaCategorias({ categorias = [], onCategoriasActualizadas = () => {} }) {
  // === Estados con los NOMBRES que usa tu JSX ===
  const [categoriasEditadas, setCategoriasEditadas] = useState(categorias); // lista editable
  const [editarCategoria, setEditarCategoria] = useState({});              // { [idCategoria]: bool }
  const [editarSubcategoria, setEditarSubcategoria] = useState({});        // { [idSubcategoria]: bool }
  const [mostrarSub, setMostrarSub] = useState({});                        // { [idCategoria]: bool }

  // Sincroniza cuando cambien las categorías del padre
  useEffect(() => {
    setCategoriasEditadas(Array.isArray(categorias) ? categorias : []);
  }, [categorias]);

  // ======= Handlers para editar en memoria =======
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

  // ======= Guardar en API =======
  const guardarCategoria = async (cat) => {
    try {
      await updateCategoria(cat.idCategoria, {
        nombre: cat.nombre,
        estado: Boolean(cat.estado),
      });
      alert("Categoría actualizada correctamente");
      setEditarCategoria(prev => ({ ...prev, [cat.idCategoria]: false }));
      onCategoriasActualizadas();
    } catch (e) {
      console.error("Error actualizando categoría", e);
      alert("Error al actualizar categoría");
    }
  };

  const guardarSubcategoria = async (catId, sub) => {
    try {
      await updateSubcategoria(sub.idSubcategoria, {
        nombre: sub.nombre,
        estado: Boolean(sub.estado),
        categoria: Number(catId),
      });
      alert("Subcategoría actualizada correctamente");
      setEditarSubcategoria(prev => ({ ...prev, [sub.idSubcategoria]: false }));
      onCategoriasActualizadas();
    } catch (e) {
      console.error("Error actualizando subcategoría", e);
      alert("Error al actualizar subcategoría");
    }
  };

  // ======= Eliminar =======
  const eliminarSub = async (sub) => {
    if (!window.confirm(`¿Eliminar la subcategoría "${sub.nombre}"?`)) return;
    try {
      await deleteSubcategoria(sub.idSubcategoria);
      alert("Subcategoría eliminada");
      onCategoriasActualizadas();
    } catch (e) {
      console.error("Error eliminando subcategoría", e);
      alert("No se pudo eliminar la subcategoría");
    }
  };

  const eliminarCategoria = async (cat) => {
    if (!window.confirm(`¿Eliminar la categoría "${cat.nombre}" y TODAS sus subcategorías?`)) return;

    // 1) Intenta borrado directo (si tu backend tiene CASCADE)
    try {
      await deleteCategoria(cat.idCategoria);
      alert("Categoría eliminada");
      onCategoriasActualizadas();
      return;
    } catch {
      // 2) Si falla, borra subcategorías manualmente y reintenta
      try {
        for (const sub of cat.subcategorias || []) {
          await deleteSubcategoria(sub.idSubcategoria).catch(() => {});
        }
        await deleteCategoria(cat.idCategoria);
        alert("Categoría y subcategorías eliminadas");
        onCategoriasActualizadas();
      } catch (e2) {
        console.error("Error eliminando categoría y subcategorías", e2);
        alert("No se pudo eliminar la categoría");
      }
    }
  };

  // ======= Render =======
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
                <input
                  type="text"
                  className="input-categoria"
                  value={cat.nombre || ""}
                  disabled={!editarCategoria[cat.idCategoria]}
                  onChange={e => cambiarCategoria(cat.idCategoria, "nombre", e.target.value)}
                />

                <label className="label-check">
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={!!cat.estado}
                    disabled={!editarCategoria[cat.idCategoria]}
                    onChange={e => cambiarCategoria(cat.idCategoria, "estado", e.target.checked)}
                  />
                  Activo
                </label>

                <div className="grupo-botones">
                  {!editarCategoria[cat.idCategoria] ? (
                    <button
                      className="btn-editar"
                      onClick={() =>
                        setEditarCategoria(prev => ({ ...prev, [cat.idCategoria]: true }))
                      }
                    >
                      Editar
                    </button>
                  ) : (
                    <>
                      <button
                        className="btn-cancelar"
                        onClick={() =>
                          setEditarCategoria(prev => ({ ...prev, [cat.idCategoria]: false }))
                        }
                      >
                        Cancelar
                      </button>
                      <button
                        className="btn-guardar"
                        onClick={() => guardarCategoria(cat)}
                      >
                        Guardar
                      </button>
                    </>
                  )}

                  <button
                    className="btn-subcategorias"
                    onClick={() =>
                      setMostrarSub(prev => ({ ...prev, [cat.idCategoria]: !prev[cat.idCategoria] }))
                    }
                  >
                    {mostrarSub[cat.idCategoria] ? "Ocultar Subcategorías" : "Mostrar Subcategorías"}
                  </button>

                  <button
                    className="btn-eliminar"
                    onClick={() => eliminarCategoria(cat)}
                  >
                    Eliminar categoría
                  </button>
                </div>
              </div>

              {mostrarSub[cat.idCategoria] && (
                <div className="subcategorias">
                  {cat.subcategorias?.length > 0 ? (
                    cat.subcategorias.map(sub => (
                      <div key={sub.idSubcategoria} className="fila-subcategoria">
                        <input
                          type="text"
                          className="input-subcategoria"
                          value={sub.nombre || ""}
                          disabled={!editarSubcategoria[sub.idSubcategoria]}
                          onChange={e =>
                            cambiarSubcategoria(cat.idCategoria, sub.idSubcategoria, "nombre", e.target.value)
                          }
                        />

                        <label className="label-check">
                          <input
                            type="checkbox"
                            className="checkbox"
                            checked={!!sub.estado}
                            disabled={!editarSubcategoria[sub.idSubcategoria]}
                            onChange={e =>
                              cambiarSubcategoria(cat.idCategoria, sub.idSubcategoria, "estado", e.target.checked)
                            }
                          />
                          Activo
                        </label>

                        <div className="grupo-botones">
                          {!editarSubcategoria[sub.idSubcategoria] ? (
                            <button
                              className="btn-editar"
                              onClick={() =>
                                setEditarSubcategoria(prev => ({ ...prev, [sub.idSubcategoria]: true }))
                              }
                            >
                              Editar
                            </button>
                          ) : (
                            <>
                              <button
                                className="btn-cancelar"
                                onClick={() =>
                                  setEditarSubcategoria(prev => ({ ...prev, [sub.idSubcategoria]: false }))
                                }
                              >
                                Cancelar
                              </button>
                              <button
                                className="btn-guardar"
                                onClick={() => guardarSubcategoria(cat.idCategoria, sub)}
                              >
                                Guardar
                              </button>
                            </>
                          )}

                          <button
                            className="btn-eliminar-sub"
                            onClick={() => eliminarSub(sub)}
                          >
                            Eliminar subcategoría
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <em className="mensaje-vacio-sub">No hay subcategorías</em>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

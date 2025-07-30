import React, { useState } from "react";
import { updateCategoria } from "../../api/Categoria.api";
import { updateSubcategoria } from "../../api/Subcategoria.api";

function ListaCategorias({ categorias, onCategoriasActualizadas }) {
  const itemsPerPage = 5;
  const subItemsPerPage = 3;

  const [categoriasEdit, setCategoriasEdit] = useState(categorias);
  const [modoEdicionCat, setModoEdicionCat] = useState({});
  const [modoEdicionSub, setModoEdicionSub] = useState({});
  const [mostrarSubcategorias, setMostrarSubcategorias] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [subPages, setSubPages] = useState({}); // objeto con página actual por cada categoría

  const totalPages = Math.ceil(categoriasEdit.length / itemsPerPage);
  const paginatedCategorias = categoriasEdit.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleCategoriaChange = (id, field, value) => {
    setCategoriasEdit((prev) =>
      prev.map((cat) =>
        cat.idCategoria === id ? { ...cat, [field]: value } : cat
      )
    );
  };

  const handleSubcategoriaChange = (catId, subId, field, value) => {
    setCategoriasEdit((prev) =>
      prev.map((cat) => {
        if (cat.idCategoria === catId) {
          const nuevasSubcategorias = cat.subcategorias.map((sub) =>
            sub.idSubcategoria === subId ? { ...sub, [field]: value } : sub
          );
          return { ...cat, subcategorias: nuevasSubcategorias };
        }
        return cat;
      })
    );
  };

  const guardarCategoria = async (cat) => {
    try {
      await updateCategoria(cat.idCategoria, {
        nombre: cat.nombre,
        estado: cat.estado,
      });
      alert("Categoría actualizada correctamente");
      setModoEdicionCat((prev) => ({ ...prev, [cat.idCategoria]: false }));
      onCategoriasActualizadas();
    } catch (error) {
      console.error("Error actualizando categoría", error);
      alert("Error al actualizar categoría");
    }
  };

  const guardarSubcategoria = async (catId, sub) => {
    try {
      await updateSubcategoria(sub.idSubcategoria, {
        nombre: sub.nombre,
        estado: sub.estado,
        categoria: catId,
      });
      alert("Subcategoría actualizada correctamente");
      setModoEdicionSub((prev) => ({ ...prev, [sub.idSubcategoria]: false }));
      onCategoriasActualizadas();
    } catch (error) {
      console.error("Error actualizando subcategoría", error);
      alert("Error al actualizar subcategoría");
    }
  };

  const handleSubPageChange = (catId, newPage) => {
    setSubPages((prev) => ({ ...prev, [catId]: newPage }));
  };

  return (
    <div className="mt-4">
      <h3>Listado de Categorías y Subcategorías (Editable)</h3>
      <table className="table table-bordered">
        <thead className="table-dark">
          <tr>
            <th>Categoría</th>
            <th>Estado</th>
            <th>Editar</th>
            <th>Guardar</th>
            <th>Ver Subcategorías</th>
          </tr>
        </thead>
        <tbody>
          {paginatedCategorias.length === 0 ? (
            <tr>
              <td colSpan="5" className="text-center">No hay categorías</td>
            </tr>
          ) : (
            paginatedCategorias.map((cat) => {
              const subPage = subPages[cat.idCategoria] || 1;
              const totalSubPages = Math.ceil(cat.subcategorias.length / subItemsPerPage);
              const subcats = cat.subcategorias.slice(
                (subPage - 1) * subItemsPerPage,
                subPage * subItemsPerPage
              );

              return (
                <React.Fragment key={cat.idCategoria}>
                  <tr style={{ backgroundColor: "white" }}>
                    <td>
                      {modoEdicionCat[cat.idCategoria] ? (
                        <input
                          type="text"
                          className="form-control"
                          value={cat.nombre}
                          onChange={(e) =>
                            handleCategoriaChange(cat.idCategoria, "nombre", e.target.value)
                          }
                        />
                      ) : (
                        cat.nombre
                      )}
                    </td>
                    <td className="text-center" style={{ fontWeight: "bold", color: cat.estado ? "green" : "red" }}>
                      {modoEdicionCat[cat.idCategoria] ? (
                        <input
                          type="checkbox"
                          checked={cat.estado}
                          onChange={(e) =>
                            handleCategoriaChange(cat.idCategoria, "estado", e.target.checked)
                          }
                        />
                      ) : cat.estado ? (
                        "Activo"
                      ) : (
                        "Inactivo"
                      )}
                    </td>
                    <td className="text-center">
                      {!modoEdicionCat[cat.idCategoria] ? (
                        <button
                          className="btn btn-sm btn-warning"
                          onClick={() => setModoEdicionCat((prev) => ({ ...prev, [cat.idCategoria]: true }))}
                        >
                          Editar
                        </button>
                      ) : (
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => setModoEdicionCat((prev) => ({ ...prev, [cat.idCategoria]: false }))}
                        >
                          Cancelar
                        </button>
                      )}
                    </td>
                    <td className="text-center">
                      {modoEdicionCat[cat.idCategoria] && (
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => guardarCategoria(cat)}
                        >
                          Guardar
                        </button>
                      )}
                    </td>
                    <td className="text-center">
                      <button
                        className="btn btn-sm btn-info"
                        onClick={() =>
                          setMostrarSubcategorias((prev) => ({
                            ...prev,
                            [cat.idCategoria]: !prev[cat.idCategoria],
                          }))
                        }
                      >
                        {mostrarSubcategorias[cat.idCategoria] ? "Ocultar" : "Mostrar"}
                      </button>
                    </td>
                  </tr>

                  {mostrarSubcategorias[cat.idCategoria] && (
                    <tr>
                      <td colSpan="5" style={{ backgroundColor: "#f8f9fa" }}>
                        {cat.subcategorias && cat.subcategorias.length > 0 ? (
                          <>
                            <table className="table table-bordered mb-0">
                              <thead className="table-secondary">
                                <tr>
                                  <th>Nombre Subcategoría</th>
                                  <th>Estado</th>
                                  <th>Editar</th>
                                  <th>Guardar</th>
                                </tr>
                              </thead>
                              <tbody>
                                {subcats.map((sub) => (
                                  <tr key={sub.idSubcategoria}>
                                    <td>
                                      {modoEdicionSub[sub.idSubcategoria] ? (
                                        <input
                                          type="text"
                                          className="form-control"
                                          value={sub.nombre}
                                          onChange={(e) =>
                                            handleSubcategoriaChange(
                                              cat.idCategoria,
                                              sub.idSubcategoria,
                                              "nombre",
                                              e.target.value
                                            )
                                          }
                                        />
                                      ) : (
                                        sub.nombre
                                      )}
                                    </td>
                                    <td className="text-center" style={{ fontWeight: "bold", color: sub.estado ? "green" : "red" }}>
                                      {modoEdicionSub[sub.idSubcategoria] ? (
                                        <input
                                          type="checkbox"
                                          checked={sub.estado}
                                          onChange={(e) =>
                                            handleSubcategoriaChange(
                                              cat.idCategoria,
                                              sub.idSubcategoria,
                                              "estado",
                                              e.target.checked
                                            )
                                          }
                                        />
                                      ) : sub.estado ? (
                                        "Activo"
                                      ) : (
                                        "Inactivo"
                                      )}
                                    </td>
                                    <td className="text-center">
                                      {!modoEdicionSub[sub.idSubcategoria] ? (
                                        <button
                                          className="btn btn-sm btn-warning"
                                          onClick={() =>
                                            setModoEdicionSub((prev) => ({
                                              ...prev,
                                              [sub.idSubcategoria]: true,
                                            }))
                                          }
                                        >
                                          Editar
                                        </button>
                                      ) : (
                                        <button
                                          className="btn btn-sm btn-secondary"
                                          onClick={() =>
                                            setModoEdicionSub((prev) => ({
                                              ...prev,
                                              [sub.idSubcategoria]: false,
                                            }))
                                          }
                                        >
                                          Cancelar
                                        </button>
                                      )}
                                    </td>
                                    <td className="text-center">
                                      {modoEdicionSub[sub.idSubcategoria] && (
                                        <button
                                          className="btn btn-sm btn-success"
                                          onClick={() => guardarSubcategoria(cat.idCategoria, sub)}
                                        >
                                          Guardar
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>

                            {totalSubPages > 1 && (
                              <div className="d-flex justify-content-center mt-2">
                                <button
                                  className="btn btn-outline-primary btn-sm mx-1"
                                  onClick={() => handleSubPageChange(cat.idCategoria, subPage - 1)}
                                  disabled={subPage === 1}
                                >
                                  Anterior
                                </button>
                                {[...Array(totalSubPages)].map((_, i) => (
                                  <button
                                    key={i}
                                    className={`btn btn-sm mx-1 ${subPage === i + 1 ? "btn-primary" : "btn-outline-primary"}`}
                                    onClick={() => handleSubPageChange(cat.idCategoria, i + 1)}
                                  >
                                    {i + 1}
                                  </button>
                                ))}
                                <button
                                  className="btn btn-outline-primary btn-sm mx-1"
                                  onClick={() => handleSubPageChange(cat.idCategoria, subPage + 1)}
                                  disabled={subPage === totalSubPages}
                                >
                                  Siguiente
                                </button>
                              </div>
                            )}
                          </>
                        ) : (
                          <em>No hay subcategorías</em>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })
          )}
        </tbody>
      </table>

      {/* Paginación de categorías */}
      <div className="d-flex justify-content-center mt-3">
        <button
          className="btn btn-outline-primary mx-1"
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Anterior
        </button>
        {[...Array(totalPages)].map((_, i) => (
          <button
            key={i}
            className={`btn mx-1 ${currentPage === i + 1 ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setCurrentPage(i + 1)}
          >
            {i + 1}
          </button>
        ))}
        <button
          className="btn btn-outline-primary mx-1"
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}

export default ListaCategorias;

import React, { useState, useEffect } from "react";
import {
  getCategoriasPaginadas,
  createCategoria,
  updateCategoria,
} from "../../api/Categoria.api";
import {
  createSubcategoria,
  updateSubcategoria,
  getAllSubcategorias,
} from "../../api/Subcategoria.api";

function ListaCategoriasPaginadas() {
  const [categoriasEdit, setCategoriasEdit] = useState([]);
  const [nextUrl, setNextUrl] = useState(null);
  const [prevUrl, setPrevUrl] = useState(null);
  const [modoEdicionCat, setModoEdicionCat] = useState({});
  const [modoEdicionSub, setModoEdicionSub] = useState({});
  const [mostrarSubcategorias, setMostrarSubcategorias] = useState({});
  const [modoFormulario, setModoFormulario] = useState(false);

  const [nuevaCategoria, setNuevaCategoria] = useState({ nombre: "", estado: true });
  const [nuevaSubcategoria, setNuevaSubcategoria] = useState({
    nombre: "",
    estado: true,
    categoria: "",
  });

  const cargarCategorias = async (url = "") => {
    try {
      const res = await getCategoriasPaginadas(url);
      const subcategoriasData = await getAllSubcategorias();

      const categoriasConSubcategorias = res.data.results.map((cat) => ({
        ...cat,
        subcategorias: subcategoriasData.filter(
          (sub) => sub.categoria === cat.idCategoria
        ),
      }));

      setCategoriasEdit(categoriasConSubcategorias);
      setNextUrl(res.data.next);
      setPrevUrl(res.data.previous);
    } catch (error) {
      console.error("Error cargando categorías", error);
    }
  };

  useEffect(() => {
    cargarCategorias();
  }, []);

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
      cargarCategorias();
    } catch (error) {
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
      cargarCategorias();
    } catch (error) {
      alert("Error al actualizar subcategoría");
    }
  };

  const handleCrearCategoria = async (e) => {
    e.preventDefault();
    try {
      await createCategoria(nuevaCategoria);
      alert("Categoría creada");
      setNuevaCategoria({ nombre: "", estado: true });
      cargarCategorias();
    } catch (err) {
      alert("Error al crear categoría");
    }
  };

  const handleCrearSubcategoria = async (e) => {
    e.preventDefault();
    if (!nuevaSubcategoria.nombre || isNaN(nuevaSubcategoria.categoria)) {
      alert("Por favor completa todos los campos correctamente");
      return;
    }
    try {
      await createSubcategoria({
        ...nuevaSubcategoria,
        categoria: parseInt(nuevaSubcategoria.categoria, 10),
      });
      alert("Subcategoría creada");
      setNuevaSubcategoria({ nombre: "", estado: true, categoria: "" });
      cargarCategorias();
    } catch (err) {
      alert("Error al crear subcategoría");
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between mb-3">
        <h3>{modoFormulario ? "Crear Categoría/Subcategoría" : "Listado de Categorías"}</h3>
        <button
          className="btn btn-outline-primary"
          onClick={() => setModoFormulario(!modoFormulario)}
        >
          {modoFormulario ? "Ver Lista" : "Crear Nueva"}
        </button>
      </div>

      {modoFormulario ? (
        <>
          {/* Formulario Categoría */}
          <form onSubmit={handleCrearCategoria} className="mb-4">
            <h5>Crear Categoría</h5>
            <input
              type="text"
              className="form-control mb-2"
              placeholder="Nombre categoría"
              value={nuevaCategoria.nombre}
              onChange={(e) =>
                setNuevaCategoria({ ...nuevaCategoria, nombre: e.target.value })
              }
              required
            />
            <label>
              <input
                type="checkbox"
                checked={nuevaCategoria.estado}
                onChange={(e) =>
                  setNuevaCategoria({ ...nuevaCategoria, estado: e.target.checked })
                }
              />{" "}
              Activa
            </label>
            <button className="btn btn-success d-block mt-2" type="submit">
              Crear Categoría
            </button>
          </form>

          {/* Formulario Subcategoría */}
          <form onSubmit={handleCrearSubcategoria}>
            <h5>Crear Subcategoría</h5>
            <input
              type="text"
              className="form-control mb-2"
              placeholder="Nombre subcategoría"
              value={nuevaSubcategoria.nombre}
              onChange={(e) =>
                setNuevaSubcategoria({ ...nuevaSubcategoria, nombre: e.target.value })
              }
              required
            />
            <select
              className="form-control mb-2"
              value={nuevaSubcategoria.categoria}
              onChange={(e) =>
                setNuevaSubcategoria({
                  ...nuevaSubcategoria,
                  categoria: parseInt(e.target.value, 10),
                })
              }
              required
            >
              <option value="">Seleccione categoría</option>
              {categoriasEdit.map((cat) => (
                <option key={cat.idCategoria} value={cat.idCategoria}>
                  {cat.nombre}
                </option>
              ))}
            </select>
            <label>
              <input
                type="checkbox"
                checked={nuevaSubcategoria.estado}
                onChange={(e) =>
                  setNuevaSubcategoria({
                    ...nuevaSubcategoria,
                    estado: e.target.checked,
                  })
                }
              />{" "}
              Activa
            </label>
            <button className="btn btn-success d-block mt-2" type="submit">
              Crear Subcategoría
            </button>
          </form>
        </>
      ) : (
        <>
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
              {categoriasEdit.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center">
                    No hay categorías
                  </td>
                </tr>
              ) : (
                categoriasEdit.map((cat) => (
                  <React.Fragment key={cat.idCategoria}>
                    <tr>
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
                        ) : cat.estado ? "Activo" : "Inactivo"}
                      </td>
                      <td className="text-center">
                        {!modoEdicionCat[cat.idCategoria] ? (
                          <button className="btn btn-sm btn-warning" onClick={() =>
                            setModoEdicionCat((prev) => ({
                              ...prev,
                              [cat.idCategoria]: true,
                            }))
                          }>
                            Editar
                          </button>
                        ) : (
                          <button className="btn btn-sm btn-secondary" onClick={() =>
                            setModoEdicionCat((prev) => ({
                              ...prev,
                              [cat.idCategoria]: false,
                            }))
                          }>
                            Cancelar
                          </button>
                        )}
                      </td>
                      <td className="text-center">
                        {modoEdicionCat[cat.idCategoria] && (
                          <button className="btn btn-sm btn-primary" onClick={() => guardarCategoria(cat)}>Guardar</button>
                        )}
                      </td>
                      <td className="text-center">
                        <button className="btn btn-sm btn-info" onClick={() =>
                          setMostrarSubcategorias((prev) => ({
                            ...prev,
                            [cat.idCategoria]: !prev[cat.idCategoria],
                          }))
                        }>
                          {mostrarSubcategorias[cat.idCategoria] ? "Ocultar" : "Mostrar"}
                        </button>
                      </td>
                    </tr>

                    {mostrarSubcategorias[cat.idCategoria] && (
                      <tr>
                        <td colSpan="5">
                          {cat.subcategorias && cat.subcategorias.length > 0 ? (
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
                                {cat.subcategorias.map((sub) => (
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
                                      ) : sub.estado ? "Activo" : "Inactivo"}
                                    </td>
                                    <td className="text-center">
                                      {!modoEdicionSub[sub.idSubcategoria] ? (
                                        <button className="btn btn-sm btn-warning" onClick={() =>
                                          setModoEdicionSub((prev) => ({
                                            ...prev,
                                            [sub.idSubcategoria]: true,
                                          }))
                                        }>
                                          Editar
                                        </button>
                                      ) : (
                                        <button className="btn btn-sm btn-secondary" onClick={() =>
                                          setModoEdicionSub((prev) => ({
                                            ...prev,
                                            [sub.idSubcategoria]: false,
                                          }))
                                        }>
                                          Cancelar
                                        </button>
                                      )}
                                    </td>
                                    <td className="text-center">
                                      {modoEdicionSub[sub.idSubcategoria] && (
                                        <button className="btn btn-sm btn-success" onClick={() =>
                                          guardarSubcategoria(cat.idCategoria, sub)
                                        }>
                                          Guardar
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <em>No hay subcategorías</em>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>

          <div className="d-flex justify-content-between mt-3">
            <button
              className="btn btn-outline-primary"
              onClick={() => cargarCategorias(prevUrl)}
              disabled={!prevUrl}
            >
              Anterior
            </button>
            <button
              className="btn btn-outline-primary"
              onClick={() => cargarCategorias(nextUrl)}
              disabled={!nextUrl}
            >
              Siguiente
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default ListaCategoriasPaginadas;

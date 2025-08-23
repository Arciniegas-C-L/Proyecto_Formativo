import React, { useState } from "react";
import { updateCategoria } from "../../api/Categoria.api";
import { updateSubcategoria } from "../../api/Subcategoria.api";
import "../../assets/css/Categoria/ListaCategoria.css";

function ListaCategorias({ categorias, onCategoriasActualizadas }) {
  //Cantidad de categorías y subcategorías que se muestran por página
const itemsPerPage = 5;
const subItemsPerPage = 3;

//Estados para manejar edición, visibilidad y paginación
const [categoriasEdit, setCategoriasEdit] = useState(categorias); //Lista editable de categorías
const [modoEdicionCat, setModoEdicionCat] = useState({}); //Controla si una categoría está en modo edición
const [modoEdicionSub, setModoEdicionSub] = useState({}); //Controla si una subcategoría está en modo edición
const [mostrarSubcategorias, setMostrarSubcategorias] = useState({}); //Controla la visibilidad de subcategorías por categoría
const [currentPage, setCurrentPage] = useState(1); //Página actual para paginación de categorías
const [subPages, setSubPages] = useState({}); //Página actual de subcategorías por cada categoría

//Cálculo de total de páginas y categorías paginadas
const totalPages = Math.ceil(categoriasEdit.length / itemsPerPage);
const paginatedCategorias = categoriasEdit.slice(
  (currentPage - 1) * itemsPerPage,
  currentPage * itemsPerPage
);

//Función para editar campos de una categoría por su ID
const handleCategoriaChange = (id, field, value) => {
  setCategoriasEdit((prev) =>
    prev.map((cat) =>
      cat.idCategoria === id ? { ...cat, [field]: value } : cat
    )
  );
};

//Función para editar campos de una subcategoría por su ID dentro de su categoría
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

//Función para guardar cambios en una categoría mediante API
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

//Función para guardar cambios en una subcategoría mediante API
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

//Función para cambiar la página actual de subcategorías por categoría
const handleSubPageChange = (catId, newPage) => {
  setSubPages((prev) => ({ ...prev, [catId]: newPage }));
};


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
                  value={cat.nombre}
                  disabled={!editarCategoria[cat.idCategoria]}
                  onChange={e => cambiarCategoria(cat.idCategoria, "nombre", e.target.value)}
                />
                <label className="label-check">
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={cat.estado}
                    disabled={!editarCategoria[cat.idCategoria]}
                    onChange={e => cambiarCategoria(cat.idCategoria, "estado", e.target.checked)}
                  />
                  Activo
                </label>
                <div className="grupo-botones">
                  {!editarCategoria[cat.idCategoria] ? (
                    <button
                      className="btn-editar"
                      onClick={() => setEditarCategoria(prev => ({ ...prev, [cat.idCategoria]: true }))}
                    >
                      Editar
                    </button>
                  ) : (
                    <>
                      <button
                        className="btn-cancelar"
                        onClick={() => setEditarCategoria(prev => ({ ...prev, [cat.idCategoria]: false }))}
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
                    onClick={() => setMostrarSub(prev => ({ ...prev, [cat.idCategoria]: !prev[cat.idCategoria] }))}
                  >
                    {mostrarSub[cat.idCategoria] ? "Ocultar Subcategorías" : "Mostrar Subcategorías"}
                  </button>
                </div>
              </div>

              {mostrarSub[cat.idCategoria] && (
                <div className="subcategorias">
                  {cat.subcategorias.length > 0 ? (
                    cat.subcategorias.map(sub => (
                      <div key={sub.idSubcategoria} className="fila-subcategoria">
                        <input
                          type="text"
                          className="input-subcategoria"
                          value={sub.nombre}
                          disabled={!editarSubcategoria[sub.idSubcategoria]}
                          onChange={e => cambiarSubcategoria(cat.idCategoria, sub.idSubcategoria, "nombre", e.target.value)}
                        />
                        <label className="label-check">
                          <input
                            type="checkbox"
                            className="checkbox"
                            checked={sub.estado}
                            disabled={!editarSubcategoria[sub.idSubcategoria]}
                            onChange={e => cambiarSubcategoria(cat.idCategoria, sub.idSubcategoria, "estado", e.target.checked)}
                          />
                          Activo
                        </label>
                        <div className="grupo-botones">
                          {!editarSubcategoria[sub.idSubcategoria] ? (
                            <button
                              className="btn-editar"
                              onClick={() => setEditarSubcategoria(prev => ({ ...prev, [sub.idSubcategoria]: true }))}
                            >
                              Editar
                            </button>
                          ) : (
                            <>
                              <button
                                className="btn-cancelar"
                                onClick={() => setEditarSubcategoria(prev => ({ ...prev, [sub.idSubcategoria]: false }))}
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

export default ListaCategorias;
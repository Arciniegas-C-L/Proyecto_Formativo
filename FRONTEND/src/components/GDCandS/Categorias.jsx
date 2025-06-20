import React, { useState, useEffect } from "react";
import { getCategoriasPaginadas } from "../../api/Categoria.api";
import { getAllSubcategorias } from "../../api/Subcategoria.api";

function CategoriasConSubcategorias() {
  const [categorias, setCategorias] = useState([]);
  const [next, setNext] = useState(null);
  const [previous, setPrevious] = useState(null);

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

      setCategorias(categoriasConSubcategorias);
      setNext(res.data.next);
      setPrevious(res.data.previous);
    } catch (error) {
      console.error("Error cargando categorías:", error);
    }
  };

  useEffect(() => {
    cargarCategorias();
  }, []);

  const limpiarURL = (url) => {
    if (!url) return "";
    return url.replace("http://127.0.0.1:8000/BACKEND/api/categoria/", "");
  };

  return (
    <div>
      <h4>Categorías Registradas</h4>
      <ul className="list-group">
        {categorias.map((cat) => (
          <li key={cat.idCategoria} className="list-group-item">
            <strong>{cat.nombre}</strong>
            {cat.subcategorias && cat.subcategorias.length > 0 && (
              <ul className="ms-3 mt-2">
                {cat.subcategorias.map((sub) => (
                  <li key={sub.idSubcategoria}>{sub.nombre}</li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>

      <div className="d-flex justify-content-center mt-3">
        <button
          className="btn btn-outline-primary mx-2"
          onClick={() => cargarCategorias(limpiarURL(previous))}
          disabled={!previous}
        >
          Anterior
        </button>
        <button
          className="btn btn-outline-primary mx-2"
          onClick={() => cargarCategorias(limpiarURL(next))}
          disabled={!next}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}

export default CategoriasConSubcategorias;
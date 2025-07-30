import React from "react";

function Filtros({
  categorias,
  subcategoriasPorCategoria,
  categoriaSeleccionada,
  subcategoriaSeleccionada,
  seleccionarCategoria,
  seleccionarSubcategoria,
  limpiarFiltros,
}) {
  const capitalizar = (texto) =>
    texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();

  return (
    <div className="card shadow-sm p-3 filtros">
      <h5 className="mb-3">Categorías</h5>
      {categorias.map((cat) => (
        <button
          key={cat}
          className={`btn btn-categoria mb-1 ${
            categoriaSeleccionada === cat ? "active" : ""
          }`}
          onClick={() => seleccionarCategoria(cat)}
        >
          {capitalizar(cat)}
        </button>
      ))}

      {categoriaSeleccionada &&
        subcategoriasPorCategoria[categoriaSeleccionada] && (
          <>
            <hr />
            <h6 className="mt-2">Subcategorías</h6>
            {subcategoriasPorCategoria[categoriaSeleccionada]?.map((sub) => (
              <button
                key={sub}
                className={`btn btn-subcategoria mb-1 ${
                  subcategoriaSeleccionada === sub ? "btn-warning" : ""
                }`}
                onClick={() => seleccionarSubcategoria(sub)}
              >
                {capitalizar(sub)}
              </button>
            ))}
          </>
        )}

      {(categoriaSeleccionada || subcategoriaSeleccionada) && (
        <button className="btn btn-limpiar mt-3" onClick={limpiarFiltros}>
          Limpiar filtros
        </button>
      )}
    </div>
  );
}

export default Filtros;
import React, { useState, useEffect } from "react";
import "../../assets/css/Catalogo/Filtros.css";

function FiltrosCatalogo({
  categorias,
  categoriaSeleccionada,
  subcategoriasPorCategoria,
  subcategoriaSeleccionada,
  tallasDisponibles,
  tallaSeleccionada,
  seleccionarCategoria,
  seleccionarSubcategoria,
  seleccionarTalla,
  limpiarFiltros,
  capitalizar
}) {
  const [panelAbierto, setPanelAbierto] = useState(false);
  
  // Calcular filtros activos
  const filtrosActivos = [
    categoriaSeleccionada,
    subcategoriaSeleccionada,
    tallaSeleccionada
  ].filter(Boolean).length;

  const togglePanel = () => {
    setPanelAbierto(!panelAbierto);
    if (!panelAbierto) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  };

  const cerrarPanel = () => {
    setPanelAbierto(false);
    document.body.style.overflow = 'auto';
  };

  // Funciones que cierran el panel automáticamente
  const manejarSeleccionCategoria = (categoria) => {
    seleccionarCategoria(categoria);
    cerrarPanel();
  };

  const manejarSeleccionSubcategoria = (subcategoria) => {
    seleccionarSubcategoria(subcategoria);
    cerrarPanel();
  };

  const manejarSeleccionTalla = (talla) => {
    seleccionarTalla(talla);
    cerrarPanel();
  };

  // Obtener subcategorías para la categoría seleccionada
  const subcategorias = categoriaSeleccionada 
    ? subcategoriasPorCategoria[categoriaSeleccionada] || []
    : [];

  // Limpiar overflow al desmontar
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    <>
      {/* Botón filtros */}
      <button className="btn-filtros" onClick={togglePanel}>
        <span>Filtrar productos</span>
        {filtrosActivos > 0 && (
          <span className="filtros-badge">{filtrosActivos}</span>
        )}
      </button>

      {/* Overlay */}
      <div 
        className={`filtros-overlay ${panelAbierto ? "show" : ""}`}
        onClick={cerrarPanel}
      ></div>

      {/* Panel lateral */}
      <div className={`filtros-panel ${panelAbierto ? "abierto" : ""}`}>
        
        {/* Header */}
        <div className="panel-header">
          <h5 className="panel-title">Filtrar productos</h5>
          <button className="btn-cerrar" onClick={cerrarPanel}>
            ×
          </button>
        </div>

        {/* Contenido */}
        <div className="panel-contenido">
          
          {/* Categorías */}
          {categorias && categorias.length > 0 && (
            <div className="filtro-seccion">
              <div className="filtro-titulo">Categorías</div>
              {categorias.map((categoria) => (
                <button
                  key={categoria}
                  className={`filtro-btn ${categoria === categoriaSeleccionada ? "activo" : ""}`}
                  onClick={() => manejarSeleccionCategoria(categoria)}
                >
                  {capitalizar(categoria)}
                </button>
              ))}
            </div>
          )}

          {/* Subcategorías */}
          {subcategorias.length > 0 && (
            <div className="filtro-seccion">
              <div className="filtro-titulo">Subcategorías</div>
              {subcategorias.map((sub) => (
                <button
                  key={sub}
                  className={`filtro-btn sub ${sub === subcategoriaSeleccionada ? "activo" : ""}`}
                  onClick={() => manejarSeleccionSubcategoria(sub)}
                >
                  {capitalizar(sub)}
                </button>
              ))}
            </div>
          )}

          {/* Tallas disponibles dinámicamente */}
          {tallasDisponibles && tallasDisponibles.length > 0 && (
            <div className="filtro-seccion">
              <div className="filtro-titulo">Tallas disponibles</div>
              <div className="tallas-grid">
                {tallasDisponibles.map((talla) => (
                  <button
                    key={talla}
                    className={`talla-btn ${talla === tallaSeleccionada ? "activo" : ""}`}
                    onClick={() => manejarSeleccionTalla(talla)}
                  >
                    {talla}
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="panel-footer">
          <button
            className="btn-limpiar"
            onClick={() => {
              limpiarFiltros();
              cerrarPanel();
            }}
          >
            Limpiar filtros {filtrosActivos > 0 && `(${filtrosActivos})`}
          </button>
        </div>
        
      </div>
    </>
  );
}

export default FiltrosCatalogo;
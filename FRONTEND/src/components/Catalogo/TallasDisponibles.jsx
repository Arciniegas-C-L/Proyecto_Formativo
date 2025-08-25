import React from "react";
import "../../assets/css/Catalogo/TallasDisponibles.css";

export default function TallasDisponibles({
  productoId,
  inventarioTallas,
  tallaSeleccionada,
  mostrarStock,
}) {
  // Validar que los datos estén completos
  if (!inventarioTallas || !Array.isArray(inventarioTallas) || inventarioTallas.length === 0) {
    return (
      <div className="tallas-container">
        <small className="text-muted">No hay tallas disponibles</small>
      </div>
    );
  }

  return (
    <div className="tallas-container">
      <div className="botones-tallas">
        {inventarioTallas.map((inv, i) => (
          <button
            key={i}
            className={`talla-button ${
              tallaSeleccionada?.idTalla === inv.idTalla ? "selected" : ""
            }`}
            onClick={() => mostrarStock(productoId, inv.idTalla, inv.stock || 0, inv)}
          >
            {inv.talla || "Sin talla"}
          </button>
        ))}
      </div>

      {tallaSeleccionada && (
        <div className="stock-disponible">
          Productos disponibles: <strong>{tallaSeleccionada.stock || 0}</strong>
        </div>
      )}
    </div>
  );
}
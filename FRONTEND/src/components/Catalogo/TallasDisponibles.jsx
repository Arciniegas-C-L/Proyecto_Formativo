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
        <small className="no-tallas-text">No hay tallas disponibles</small>
      </div>
    );
  }

  return (
    <div className="tallas-container">
      <div className="botones-tallas">
        <div className="tallas-label">
          <span>Tallas:</span>
        </div>
        {inventarioTallas.map((inv, i) => (
          <button
            key={i}
            className={`talla-button ${
              tallaSeleccionada?.idTalla === inv.idTalla ? "selected" : ""
            } ${inv.stock === 0 ? "sin-stock" : ""}`}
            onClick={() => mostrarStock(productoId, inv.idTalla, inv.stock || 0, inv)}
            disabled={inv.stock === 0}
            title={inv.stock === 0 ? "Sin stock" : `Stock: ${inv.stock}`}
          >
            {inv.talla || "N/A"}
          </button>
        ))}
      </div>
    </div>
  );
}
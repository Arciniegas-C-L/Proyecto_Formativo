import React from "react";
import "../../assets/css/Catalogo/TallasDisponibles.css";

export default function TallasDisponibles({
  productoId,
  inventarioTallas,
  tallaSeleccionada,
  mostrarStock,
}) {
  return (
    <div className="tallas-container">
      <div className="botones-tallas">
        {inventarioTallas.map((inv, i) => (
          <button
            key={i}
            className={`talla-button ${
              tallaSeleccionada?.talla === inv.talla ? "selected" : ""
            }`}
            onClick={() => mostrarStock(productoId, inv.talla, inv.stock)}
          >
            {inv.talla}
          </button>
        ))}
      </div>

      {tallaSeleccionada && (
        <div className="stock-disponible">
          Productos disponibles: <strong>{tallaSeleccionada.stock}</strong>
        </div>
      )}
    </div>
  );
}
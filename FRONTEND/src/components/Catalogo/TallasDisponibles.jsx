import React from "react";

function TallasDisponibles({ productoId, inventarioTallas, tallaSeleccionada, mostrarStock }) {
  return (
    <div className="mt-2">
      <strong>Tallas:</strong>
      <div className="d-flex flex-wrap gap-2 mt-1">
        {inventarioTallas.map((inv, i) => (
          <button
            key={i}
            className={`talla-btn ${
              tallaSeleccionada?.talla === inv.talla ? "selected" : ""
            }`}
            onClick={() => mostrarStock(productoId, inv.talla, inv.stock)}
          >
            {inv.talla}
          </button>
        ))}
      </div>
    </div>
  );
}

export default TallasDisponibles;
import React from "react";
import "../../assets/css/EliminarModal/EliminarModal.css"

export function EliminarModal({ 
  abierto, 
  titulo = "Confirmar eliminación", 
  mensaje, 
  onCancelar, 
  onConfirmar 
}) {
  if (!abierto) return null;

  return (
    <div className="modal-fondo">
      <div className="modal-contenido">
        <h3>{titulo}</h3>
        <p>{mensaje}</p>
        <div className="modal-botones">
          <button className="btn-cancelar" onClick={onCancelar}>
            Cancelar
          </button>
          <button className="btn-eliminar" onClick={onConfirmar}>
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
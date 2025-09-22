import React from "react";
import "../../assets/css/Carrito/ProductoRecomendado.css";
import { getImagenUrl } from "../../utils/getImagenUrl";

export default function ProductoRecomendado({ producto, capitalizar, onVerDetalle }) {
  if (!producto) return null;

  const precio = parseFloat(producto.precio || 0);

  return (
    <div className="producto-recomendado-card">
      <img
        src={getImagenUrl(producto.imagen)}
        alt={producto.nombre || "Producto"}
        className="producto-recomendado-img"
        onError={e => {
          e.target.onerror = null;
          e.target.src = getImagenUrl();
        }}
      />
      <div className="producto-recomendado-body">
        <div className="producto-recomendado-nombre">
          {capitalizar?.(producto.nombre) || producto.nombre}
        </div>
        <div className="producto-recomendado-precio">
          ${precio.toLocaleString("es-CO", { maximumFractionDigits: 0 })}
        </div>
        <div className="producto-recomendado-descripcion">
          {producto.descripcion?.slice(0, 60) || "Sin descripción"}
          {producto.descripcion && producto.descripcion.length > 60 ? "..." : ""}
        </div>
        <button
          className="producto-recomendado-btn"
          onClick={() => onVerDetalle?.(producto)}
        >
          Ver detalle
        </button>
      </div>
    </div>
  );
}

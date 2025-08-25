import React from "react";
import "../../assets/css/Carrito/ProductoRecomendado.css";

export default function ProductoRecomendado({ producto, capitalizar, onVerDetalle }) {
  if (!producto) return null;
  return (
    <div className="producto-recomendado-card">
      <img
        src={producto.imagen || "https://via.placeholder.com/300x200?text=Imagen+no+disponible"}
        alt={producto.nombre || "Producto"}
        className="producto-recomendado-img"
        onError={e => {
          e.target.onerror = null;
          e.target.src = "https://via.placeholder.com/300x200?text=Imagen+no+disponible";
        }}
      />
      <div className="producto-recomendado-body">
        <div className="producto-recomendado-nombre">{capitalizar(producto.nombre)}</div>
        <div className="producto-recomendado-precio">
          ${parseFloat(producto.precio || 0).toLocaleString("es-CO", { maximumFractionDigits: 0 })}
        </div>
        <div className="producto-recomendado-descripcion">
          {producto.descripcion?.slice(0, 60) || "Sin descripción"}
          {producto.descripcion && producto.descripcion.length > 60 ? "..." : ""}
        </div>
        <button className="producto-recomendado-btn" onClick={() => onVerDetalle?.(producto)}>
          Ver detalle
        </button>
      </div>
    </div>
  );
}

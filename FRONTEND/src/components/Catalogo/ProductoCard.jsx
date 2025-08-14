import React, { useState } from "react";
import TallasDisponibles from "./TallasDisponibles";
import "../../assets/css/Catalogo/ProductoCard.css";

export default function ProductoCard({
  producto,
  capitalizar,
  tallaSeleccionada,
  mostrarStock,
}) {
  const [cantidad, setCantidad] = useState(1);

  const aumentarCantidad = () => setCantidad(prev => prev + 1);
  const disminuirCantidad = () => {
    if (cantidad > 1) setCantidad(prev => prev - 1);
  };

  return (
    <div className="col d-flex">
      <div className="card shadow producto-card w-100">
        <div className="img-container">
          <img
            src={producto.imagen}
            alt={producto.nombre}
            className="card-img-top"
          />
        </div>
        <div className="card-body d-flex flex-column">
          <h5 className="card-title">{capitalizar(producto.nombre)}</h5>
          <p className="card-text descripcion">{producto.descripcion}</p>
          <p className="card-text">
            <strong>Precio:</strong> ${producto.precio}
          </p>
          <p className="card-text">
            <strong>Subcategoría:</strong>{" "}
            {capitalizar(producto.subcategoria_nombre)}
          </p>

          <TallasDisponibles
            productoId={producto.id}
            inventarioTallas={producto.inventario_tallas}
            tallaSeleccionada={tallaSeleccionada}
            mostrarStock={mostrarStock}
          />

          {/* Controles de cantidad */}
          <div className="cantidad-container my-2">
            <button onClick={disminuirCantidad} className="btn-cantidad">-</button>
            <span className="cantidad">{cantidad}</span>
            <button onClick={aumentarCantidad} className="btn-cantidad">+</button>
          </div>

          <button className="btn btn-dark mt-auto">
            Agregar al carrito
          </button>
        </div>
      </div>
    </div>
  );
}
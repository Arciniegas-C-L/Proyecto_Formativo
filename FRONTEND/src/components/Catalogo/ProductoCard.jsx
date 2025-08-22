import React, { useState } from "react";
import "../../assets/css/Catalogo/ProductoCard.css";
import TallasDisponibles from "./TallasDisponibles";

export default function ProductoCard({ producto, capitalizar }) {
  const [cantidad, setCantidad] = useState(0);
  const [tallaSeleccionada, setTallaSeleccionada] = useState(null);

  const aumentarCantidad = () => {
    if (tallaSeleccionada) {
      const stock = tallaSeleccionada.stock || 0;
      if (cantidad < stock) setCantidad((prev) => prev + 1);
    } else {
      setCantidad((prev) => prev + 1);
    }
  };

  const disminuirCantidad = () => {
    if (cantidad > 0) setCantidad((prev) => prev - 1);
  };

  const mostrarStock = (productoId, talla, stock) => {
    const inv = producto.inventario_tallas.find((t) => t.talla === talla);
    setTallaSeleccionada(inv);
    setCantidad(0);
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
            <strong>Precio:</strong> $
            {new Intl.NumberFormat("es-CO").format(producto.precio)}
          </p>

          <p className="card-text">
            <strong>Subcategoría:</strong>{" "}
            {capitalizar(producto.subcategoria_nombre)}
          </p>

          {/* Tallas */}
          {producto.inventario_tallas.length > 0 && (
            <TallasDisponibles
              productoId={producto.id}
              inventarioTallas={producto.inventario_tallas}
              tallaSeleccionada={tallaSeleccionada}
              mostrarStock={mostrarStock}
            />
          )}

          <div className="cantidad-container my-2">
            <button onClick={disminuirCantidad} className="btn-cantidad">
              -
            </button>
            <span className="cantidad">{cantidad}</span>
            <button onClick={aumentarCantidad} className="btn-cantidad">
              +
            </button>
          </div>

          <button
            className="btn btn-dark mt-auto"
            onClick={() => {
              if (cantidad > 0) {
                console.log(
                  `Agregando ${cantidad} de ${producto.nombre} al carrito`
                );
              } else {
                console.log("Selecciona al menos una unidad");
              }
            }}
          >
            Agregar al carrito
          </button>
        </div>
      </div>
    </div>
  );
}

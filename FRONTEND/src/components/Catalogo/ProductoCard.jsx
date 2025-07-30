import React from "react";
import TallasDisponibles from "./TallasDisponibles";

function ProductoCard({ producto, tallaSeleccionada, mostrarStock, capitalizar }) {
  return (
    <div className="col d-flex">
      <div className="card shadow producto-card w-100">
        <div className="img-container">
          <img src={producto.imagen} alt={producto.nombre} className="card-img-top" />
        </div>
        <div className="card-body d-flex flex-column">
          <h5 className="card-title">{capitalizar(producto.nombre)}</h5>
          <p className="card-text descripcion">{producto.descripcion}</p>
          <p className="card-text"><strong>Precio:</strong> ${producto.precio}</p>
          <p className="card-text"><strong>Subcategoría:</strong> {capitalizar(producto.subcategoria_nombre)}</p>

          <TallasDisponibles
            productoId={producto.id}
            inventarioTallas={producto.inventario_tallas}
            tallaSeleccionada={tallaSeleccionada}
            mostrarStock={mostrarStock}
          />

          {tallaSeleccionada && (
            <div className="alert alert-info mt-2 p-1 text-center">
              Productos disponibles: <strong>{tallaSeleccionada.stock}</strong>
            </div>
          )}

          <button className="btn btn-dark mt-auto">Agregar al carrito</button>
        </div>
      </div>
    </div>
  );
}

export default ProductoCard;
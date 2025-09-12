import React from "react";
import "../../assets/css/ReporteVentas/ReporteVentas.css";

const ReporteVentas = () => {
  return (
    <div className="reporte-ventas-main">
      <h2 className="reporte-ventas-title">Reporte de Ventas</h2>
      <form className="reporte-ventas-form">
        <div className="reporte-ventas-form-row">
          <div className="reporte-ventas-form-group">
            <label htmlFor="fecha-inicio">Fecha inicio</label>
            <input type="date" id="fecha-inicio" className="reporte-ventas-input" />
          </div>
          <div className="reporte-ventas-form-group">
            <label htmlFor="fecha-fin">Fecha fin</label>
            <input type="date" id="fecha-fin" className="reporte-ventas-input" />
          </div>
          <div className="reporte-ventas-form-group">
            <label htmlFor="productos">Productos</label>
            <select id="productos" multiple className="reporte-ventas-select">
              <option value="producto1">Producto 1</option>
              <option value="producto2">Producto 2</option>
              <option value="producto3">Producto 3</option>
              <option value="producto4">Producto 4</option>
            </select>
          </div>
          <div className="reporte-ventas-form-actions">
            <button type="button" className="btn-reporte-azul">Generar reporte</button>
            <button type="button" className="btn-reporte-azul">Descargar PDF</button>
          </div>
        </div>
      </form>
      <div className="reporte-ventas-tabla-container">
        <table className="reporte-ventas-tabla">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Total</th>
              <th>Cliente</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>2025-09-01</td>
              <td>Producto 1</td>
              <td>2</td>
              <td>$100.000</td>
              <td>Marta</td>
            </tr>
            <tr>
              <td>2025-09-02</td>
              <td>Producto 2</td>
              <td>1</td>
              <td>$50.000</td>
              <td>Lorena</td>
            </tr>
            <tr>
              <td>2025-09-02</td>
              <td>Producto 3</td>
              <td>1</td>
              <td>$50.000</td>
              <td>Felipe</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReporteVentas;
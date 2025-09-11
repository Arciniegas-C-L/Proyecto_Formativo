// Esta página muestra el reporte de ventas para el admin.

import React from "react";
import ReporteVentas from "../components/ReporteVentas/ReporteVentas";

export function ReporteVentasPage() {
  return (
    <div className="container mx-auto p-4">
      <ReporteVentas />
    </div>
  );
}
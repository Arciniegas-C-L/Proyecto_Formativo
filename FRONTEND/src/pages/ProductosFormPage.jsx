//Este componente es la página de Productos Form
//Aqui podemos unir todos los componentes o subcomponentes para exportar a la app.jsx
import { ProductosForm } from "../components/Productos/ProductosForm";
import React from "react";
import { Cloudinary } from "@cloudinary/url-gen";

export function ProductosFormPage() {
  return (
    <div className="container mx-auto p-4">
      <ProductosForm />
    </div>
  );
}
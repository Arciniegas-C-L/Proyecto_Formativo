//Este componente es la página de Productos Form
//Aqui podemos unir todos los componentes o subcomponentes para exportar a la app.jsx

import { ProductosForm } from "../components/Productos/ProductosForm";

export function ProductosFormPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Formulario de Producto</h1>
      <ProductosForm />
    </div>
  );
}
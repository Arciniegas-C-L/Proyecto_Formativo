import { ProductosForm } from "../components/Productos/ProductosForm";

export function ProductosFormPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Formulario de Producto</h1>
      <ProductosForm />
    </div>
  );
}
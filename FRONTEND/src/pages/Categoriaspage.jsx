import { CategoriaForm } from "../components/Categorias/Categorias";

export function CategoriasPage() {
  return (
    <div className="container">
      <h1 className="text-center my-4">Gestión de Categorías</h1>
      <CategoriaForm />
    </div>
  );
}
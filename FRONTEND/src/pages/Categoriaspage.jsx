//Este componente es la página de Categorias
//Aqui podemos unir todos los componentes o subcomponentes para exportar a la app.jsx

import { CategoriaForm } from "../components/Categorias/Categorias";

export function CategoriasPage() {
  return (
    <div className="container">
      <h1 className="text-center my-4">Gestión de Categorías</h1>
      <CategoriaForm />
    </div>
  );
}
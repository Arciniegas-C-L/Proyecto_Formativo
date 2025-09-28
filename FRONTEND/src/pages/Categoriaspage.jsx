//Este componente es la página de Categorias
//Aqui podemos unir todos los componentes o subcomponentes para exportar a la app.jsx
import { CategoriaForm } from "../components/Categorias/Categorias";

function CategoriasPage() {
  return (
    <div className="container">
      <CategoriaForm />
    </div>
  );
}

export default CategoriasPage;
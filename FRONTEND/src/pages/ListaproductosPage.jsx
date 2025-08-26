//Este componente es la página de Lista de productos
//Aqui podemos unir todos los componentes o subcomponentes para exportar a la app.jsx

import { ListaProductos } from "../components/Productos/ListaProductos";

export function ListaProductosPage() {
  return (
    <div className="container mx-auto p-4">
      <ListaProductos />
    </div>
  );
}
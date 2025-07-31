//Este componente es la página de Lista de productos
//Aqui podemos unir todos los componentes o subcomponentes para exportar a la app.jsx

import { ListaProductos } from "../components/Productos/ListaProductos";

export function ListaProductosPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Lista de Productos</h1>
      <ListaProductos />
    </div>
  );
}
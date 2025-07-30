import { ListaProductos } from "../components/Productos/ListaProductos";

export function ListaProductosPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Lista de Productos</h1>
      <ListaProductos />
    </div>
  );
}
//Este componente es la página de Inventario
//Aqui podemos unir todos los componentes o subcomponentes para exportar a la app.jsx

import InventarioTabla from "../components/Inventario/InventarioTabla";

export function InventarioPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Gestión de Inventario</h1>
      <InventarioTabla />
    </div>
  );
}

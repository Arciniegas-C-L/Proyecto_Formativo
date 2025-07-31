//Este componente es la página de Provedores Registrados
//Aqui podemos unir todos los componentes o subcomponentes para exportar a la app.jsx

import {ProveedoresRegistrados} from "../components/Provedores/ProveedoresRegistrados.jsx";

export function ProveedoresRegistradosPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Proveedores Registrados</h1>
      <ProveedoresRegistrados />
    </div>
  );
}
//Este componente es la página de Provedores Registrados
//Aqui podemos unir todos los componentes o subcomponentes para exportar a la app.jsx

import {ProveedoresRegistrados} from "../components/Proveedores/ProveedoresRegistrados.jsx";

export function ProveedoresRegistradosPage() {
  return (
    <div className="container mx-auto p-4">
      <ProveedoresRegistrados />
    </div>
  );
}
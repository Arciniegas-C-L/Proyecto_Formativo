//Este componente es la página de administración de proveedores 
//Aqui podemos unir todos los componentes o subcomponentes para exportar a la app.jsx


import {AdminProveedores} from "../components/Proveedores/AdminProveedores";

export function AdminProvedoresPage() {
  return (
    <div className="container mx-auto p-4">
      <AdminProveedores />
    </div>
  );
}
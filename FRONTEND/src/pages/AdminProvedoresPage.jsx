import {AdminProveedores} from "../components/Provedores/AdminProveedores";

export function AdminProvedoresPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Administración de Proveedores</h1>
      <AdminProveedores />
    </div>
  );
}
import InventarioTabla from "../components/GDIGrafica/InventarioTabla";
import { Toaster } from "react-hot-toast";

export function InventarioPage() {
  return (
    <div className="container mt-5 bg-white">
      <div className="text-center mb-4">
        <h1 className="display-5 font-monospace">Gestión de Inventario</h1>
      </div>
      <InventarioTabla />
      <Toaster />
    </div>
  );
}

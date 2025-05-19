import { toast } from "react-hot-toast";
import InventarioForm from "./GDIGrafica/InventarioForm";

export function InventarioFormPage() {
  const handleSuccess = () => {
    toast.success("Inventario guardado correctamente");
  };

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-header bg-primary text-white">
          <h3 className="mb-0">Crear / Editar Inventario</h3>
        </div>
        <div className="card-body">
          <InventarioForm onSuccess={handleSuccess} />
        </div>
      </div>
    </div>
  );
}

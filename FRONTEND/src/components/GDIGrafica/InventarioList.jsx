import React, { useEffect, useState } from "react";
import { getAllInventario, deleteInventario } from "../../api/InventarioApi";
import InventarioForm from "./InventarioForm";
import { toast } from "react-hot-toast";

function InventarioList() {
  const [inventario, setInventario] = useState([]);
  const [inventarioEditado, setInventarioEditado] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  useEffect(() => {
    async function fetchInventario() {
      try {
        const data = await getAllInventario();
        setInventario(data);
      } catch (error) {
        console.error("Error cargando inventario", error);
        toast.error("Error cargando inventario");
      }
    }
    fetchInventario();
  }, []);

  const handleDelete = async (id) => {
    try {
      await deleteInventario(id);
      setInventario(inventario.filter(item => item.idInventario !== id));
      toast.success("Inventario eliminado correctamente");
    } catch (error) {
      console.error("Error eliminando inventario", error);
      toast.error("Error eliminando inventario");
    }
  };

  const handleEditarClick = (item) => {
    setInventarioEditado(item);
    setMostrarFormulario(true);
  };

  const handleFormSuccess = async () => {
    try {
      const data = await getAllInventario();
      setInventario(data);
      setMostrarFormulario(false);
      setInventarioEditado(null);
      toast.success("Inventario guardado correctamente");
    } catch (error) {
      console.error("Error recargando inventario", error);
      toast.error("Error recargando inventario");
    }
  };

  return (
    <div className="container mt-4">

      {mostrarFormulario ? (
        <div className="card">
          <div className="card-body">
            <InventarioForm
              inventarioEditado={inventarioEditado}
              onSuccess={handleFormSuccess}
            />
          </div>
        </div>
      ) : (
        <>
          <button
            className="btn btn-warning fw-bold px-4 shadow mb-3"
            onClick={() => {
              setInventarioEditado(null);
              setMostrarFormulario(true);
            }}
          >
            Crear Nuevo Inventario
          </button>

          <div className="table-responsive">
            <table className="table table-striped table-bordered">
              <thead className="table-dark">
                <tr>
                  <th>ID</th>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Stock Mínimo</th>
                  <th>Fecha Registro</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {inventario.map(item => (
                  <tr key={item.idInventario}>
                    <td>{item.idInventario}</td>
                    <td>{item.producto.nombre}</td>
                    <td>{item.cantidad}</td>
                    <td>{item.stockMinimo}</td>
                    <td>{item.fechaRegistro}</td>
                    <td>
                      <button
                        className="btn btn-warning btn-sm me-2"
                        onClick={() => handleEditarClick(item)}
                      >
                        Actualizar
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(item.idInventario)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default InventarioList;

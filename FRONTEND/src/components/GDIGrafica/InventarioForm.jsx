import React, { useState, useEffect } from "react";
import { createInventario, updateInventario } from "../../api/InventarioApi";
import { getALLProductos } from "../../api/Producto.api";
import { toast } from "react-hot-toast";

function InventarioForm({ inventarioEditado, onSuccess = () => {} }) {
  const [productos, setProductos] = useState([]);
  const [cantidad, setCantidad] = useState(inventarioEditado?.cantidad || "");
  const [stockMinimo, setStockMinimo] = useState(inventarioEditado?.stockMinimo || "");
  const [fechaRegistro, setFechaRegistro] = useState(inventarioEditado?.fechaRegistro || "");
  const [productoId, setProductoId] = useState(inventarioEditado?.producto?.idProducto || "");

  useEffect(() => {
    async function fetchProductos() {
      try {
        const response = await getALLProductos();
        setProductos(response.data);
      } catch (error) {
        console.error("Error cargando productos", error);
        toast.error("Error cargando productos");
      }
    }
    fetchProductos();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      cantidad: parseInt(cantidad),
      stockMinimo: parseInt(stockMinimo),
      fechaRegistro,
      producto: productoId,
    };

    try {
      if (inventarioEditado) {
        await updateInventario(inventarioEditado.idInventario, payload);
        toast.success("Inventario actualizado correctamente");
      } else {
        await createInventario(payload);
        toast.success("Inventario creado correctamente");
      }
      onSuccess();
    } catch (error) {
      console.error("Error guardando inventario", error);
      toast.error("Error guardando inventario");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border rounded bg-light">
      <div className="mb-3">
        <label className="form-label">Producto</label>
        <select
          className="form-select"
          value={productoId}
          onChange={(e) => setProductoId(e.target.value)}
          required
        >
          <option value="">Seleccione un producto</option>
          {productos.map((prod) => (
            <option key={prod.idProducto} value={prod.idProducto}>
              {prod.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-3">
        <label className="form-label">Cantidad</label>
        <input
          type="number"
          className="form-control"
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          required
        />
      </div>

      <div className="mb-3">
        <label className="form-label">Stock Mínimo</label>
        <input
          type="number"
          className="form-control"
          value={stockMinimo}
          onChange={(e) => setStockMinimo(e.target.value)}
          required
        />
      </div>

      <div className="mb-3">
        <label className="form-label">Fecha de Registro</label>
        <input
          type="date"
          className="form-control"
          value={fechaRegistro}
          onChange={(e) => setFechaRegistro(e.target.value)}
          required
        />
      </div>

      <button type="submit" className="btn btn-primary">
        {inventarioEditado ? "Actualizar" : "Crear"}
      </button>
    </form>
  );
}

export default InventarioForm;

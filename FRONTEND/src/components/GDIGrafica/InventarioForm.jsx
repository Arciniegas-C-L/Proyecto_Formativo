import { useState, useEffect } from "react";
import { createInventario, updateInventario } from "../../api/InventarioApi";
import { getALLProductos } from "../../api/Producto.api";
import { getAllCategorias } from "../../api/Categoria.api";
import { getSubcategoriasByCategoria } from "../../api/Subcategoria.api";
import { toast } from "react-hot-toast";

export function InventarioForm({ inventarioEditado, onSuccess = () => {} }) {
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [productos, setProductos] = useState([]);

  const [categoriaId, setCategoriaId] = useState("");
  const [subcategoriaId, setSubcategoriaId] = useState("");
  const [productoId, setProductoId] = useState(inventarioEditado?.producto?.idProducto || "");

  const [cantidad, setCantidad] = useState(inventarioEditado?.cantidad || "");
  const [stockMinimo, setStockMinimo] = useState(inventarioEditado?.stockMinimo || "");
  const [fechaRegistro, setFechaRegistro] = useState(inventarioEditado?.fechaRegistro || "");

  useEffect(() => {
  async function fetchCategorias() {
    try {
      const response = await getAllCategorias();
      setCategorias(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error cargando categorías", error);
      toast.error("Error cargando categorías");
      setCategorias([]);
    }
  }
  fetchCategorias();
}, []);

useEffect(() => {
  async function fetchSubcategorias() {
    if (!categoriaId) {
      setSubcategorias([]);
      setSubcategoriaId("");
      setProductos([]);
      setProductoId("");
      return;
    }
    try {
      const response = await getSubcategoriasByCategoria(categoriaId);
      setSubcategorias(Array.isArray(response.data) ? response.data : []);
      if (Array.isArray(response.data) && response.data.length > 0) {
        setSubcategoriaId(response.data[0].idSubcategoria);
      } else {
        setSubcategoriaId("NA");
        setProductos([]);
        setProductoId("");
      }
    } catch (error) {
      console.error("Error cargando subcategorías", error);
      toast.error("Error cargando subcategorías");
      setSubcategorias([]);
      setSubcategoriaId("");
    }
  }
  fetchSubcategorias();
}, [categoriaId]);

useEffect(() => {
  async function fetchProductos() {
    if (!subcategoriaId || subcategoriaId === "NA") {
      setProductos([]);
      setProductoId("");
      return;
    }
    try {
      const response = await getALLProductos();
      const productosFiltrados = Array.isArray(response.data)
        ? response.data.filter((p) => p.subcategoriaId === subcategoriaId)
        : [];
      setProductos(productosFiltrados.length ? productosFiltrados : (Array.isArray(response.data) ? response.data : []));
      setProductoId(productosFiltrados.length ? productosFiltrados[0].idProducto : "");
    } catch (error) {
      console.error("Error cargando productos", error);
      toast.error("Error cargando productos");
      setProductos([]);
      setProductoId("");
    }
  }
  fetchProductos();
}, [subcategoriaId]);


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
        <label className="form-label">Categoría</label>
        <select
          className="form-select"
          value={categoriaId}
          onChange={(e) => setCategoriaId(e.target.value)}
          required
        >
          <option value="">Seleccione una categoría</option>
          {categorias.map((cat) => (
            <option key={cat.idCategoria} value={cat.idCategoria}>
              {cat.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-3">
        <label className="form-label">Subcategoría</label>
        <select
          className="form-select"
          value={subcategoriaId}
          onChange={(e) => setSubcategoriaId(e.target.value)}
          disabled={subcategorias.length === 0}
          required
        >
          {subcategorias.length === 0 ? (
            <option value="NA">N/A</option>
          ) : (
            subcategorias.map((sub) => (
              <option key={sub.idSubcategoria} value={sub.idSubcategoria}>
                {sub.nombre}
              </option>
            ))
          )}
        </select>
      </div>

      <div className="mb-3">
        <label className="form-label">Producto</label>
        <select
          className="form-select"
          value={productoId}
          onChange={(e) => setProductoId(e.target.value)}
          required
          disabled={productos.length === 0}  // Aquí corregí el disabled
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

      <button type="submit" className="btn btn-warning fw-bold shadow">
        {inventarioEditado ? "Actualizar" : "Crear"}
      </button>
    </form>
  );
}

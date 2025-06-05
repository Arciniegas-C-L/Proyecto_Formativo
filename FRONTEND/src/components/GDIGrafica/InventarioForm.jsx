import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { getAllCategorias } from "../../api/Categoria.api";
import { getSubcategoriasByCategoria } from "../../api/Subcategoria.api";
import { getALLProductos } from "../../api/Producto.api";
import { createInventario, updateInventario } from "../../api/InventarioApi";

export function InventarioForm({ inventarioEditado = null, onSuccess = () => {} }) {
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [productos, setProductos] = useState([]);

  const [categoriaId, setCategoriaId] = useState("");
  const [subcategoriaId, setSubcategoriaId] = useState("");
  const [productoId, setProductoId] = useState("");

  const [cantidad, setCantidad] = useState("");
  const [stockMinimo, setStockMinimo] = useState("");
  const [fechaRegistro, setFechaRegistro] = useState("");

  // Cargar datos si se está editando
  useEffect(() => {
    if (inventarioEditado) {
      setProductoId(inventarioEditado.producto?.idProducto || "");
      setCantidad(inventarioEditado.cantidad || "");
      setStockMinimo(inventarioEditado.stockMinimo || "");
      setFechaRegistro(inventarioEditado.fechaRegistro || "");
    }
  }, [inventarioEditado]);

  // Cargar categorías
  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const data = await getAllCategorias();
        setCategorias(data);
      } catch (error) {
        toast.error("Error al cargar categorías");
      }
    };
    fetchCategorias();
  }, []);

  // Cargar subcategorías al seleccionar categoría
  useEffect(() => {
    const fetchSubcategorias = async () => {
      if (!categoriaId) return;
      try {
        const data = await getSubcategoriasByCategoria(categoriaId);
        setSubcategorias(data);
      } catch (error) {
        toast.error("Error al cargar subcategorías");
      }
    };
    fetchSubcategorias();
  }, [categoriaId]);

  // Cargar productos al seleccionar subcategoría
  useEffect(() => {
    const fetchProductos = async () => {
      if (!subcategoriaId) return;
      try {
        const data = await getALLProductos();
        const filtrados = data.filter((prod) => prod.subcategoriaId === subcategoriaId);
        setProductos(filtrados);
      } catch (error) {
        toast.error("Error al cargar productos");
      }
    };
    fetchProductos();
  }, [subcategoriaId]);

  // Enviar formulario
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
        toast.success("Inventario actualizado");
      } else {
        await createInventario(payload);
        toast.success("Inventario creado");
      }
      onSuccess();
    } catch (error) {
      toast.error("Error al guardar inventario");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border rounded bg-white shadow-sm">
      <h5 className="mb-3 fw-bold">{inventarioEditado ? "Editar Inventario" : "Nuevo Inventario"}</h5>

      <div className="mb-3">
        <label className="form-label">Categoría</label>
        <select
          className="form-select"
          value={categoriaId}
          onChange={(e) => {
            setCategoriaId(e.target.value);
            setSubcategoriaId("");
            setProductoId("");
            setSubcategorias([]);
            setProductos([]);
          }}
          required
        >
          <option value="">Selecciona una categoría</option>
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
          onChange={(e) => {
            setSubcategoriaId(e.target.value);
            setProductoId("");
          }}
          disabled={!categoriaId || subcategorias.length === 0}
          required
        >
          <option value="">Selecciona una subcategoría</option>
          {subcategorias.map((sub) => (
            <option key={sub.idSubcategoria} value={sub.idSubcategoria}>
              {sub.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-3">
        <label className="form-label">Producto</label>
        <select
          className="form-select"
          value={productoId}
          onChange={(e) => setProductoId(e.target.value)}
          disabled={!subcategoriaId || productos.length === 0}
          required
        >
          <option value="">Selecciona un producto</option>
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
        <label className="form-label">Stock mínimo</label>
        <input
          type="number"
          className="form-control"
          value={stockMinimo}
          onChange={(e) => setStockMinimo(e.target.value)}
          required
        />
      </div>

      <div className="mb-3">
        <label className="form-label">Fecha de registro</label>
        <input
          type="date"
          className="form-control"
          value={fechaRegistro}
          onChange={(e) => setFechaRegistro(e.target.value)}
          required
        />
      </div>

      <button type="submit" className="btn btn-warning fw-bold">
        {inventarioEditado ? "Actualizar" : "Crear"}
      </button>
    </form>
  );
}

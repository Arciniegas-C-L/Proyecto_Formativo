import { useEffect, useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { fetchProveedores, createProveedor, updateProveedor, deleteProveedor } from "../api/Proveedor.api.js";

export function AdminProveedores() {
  const [proveedores, setProveedores] = useState([]);
  const [form, setForm] = useState({
    nombre: "",
    tipo: "",
    productos: "",
    correo: "",
    telefono: "",
    estado: "",
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    async function MostrarProveedores(){
      const data = await fetchProveedores();
    setProveedores(data.data)
    }
    MostrarProveedores()
  }, []);


  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Enviando proveedor:", form);

    try {
      if (editingId) {
        await updateProveedor(editingId, form);
      } else {
        await createProveedor(form);
      }

      setForm({ nombre: "", tipo: "", productos: "", correo: "", telefono: "", estado: "" });
      setEditingId(null);
      setProveedores()
    } catch (error) {
      console.error("Error al registrar proveedor:", error.response?.data || error.message);
    }
  };

  const handleEdit = (Proveedor) => {
    setForm(Proveedor);
    setEditingId(Proveedor.id);
  };

  const handleDelete = async (id) => {
    try {
      await deleteProveedor(id);
      cargarProveedores();
    } catch (error) {
      console.error("Error al eliminar proveedor:", error.response?.data || error.message);
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="text-center fw-bold text-warning">Gestión de Proveedores</h2>

      {/* Formulario con Bootstrap */}
      <form onSubmit={handleSubmit} className="row g-3 bg-light p-4 rounded shadow">
        <div className="col-md-4">
          <input type="text" className="form-control" placeholder="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
        </div>
        <div className="col-md-4">
          <select className="form-select" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
            <option value="nacional">Nacional</option>
            <option value="importado">Importado</option>
          </select>
        </div>
        <div className="col-md-4">
          <input type="text" className="form-control" placeholder="Productos" value={form.productos} onChange={(e) => setForm({ ...form, productos: e.target.value })} />
        </div>
        <div className="col-md-6">
          <input type="email" className="form-control" placeholder="Correo" value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} />
        </div>
        <div className="col-md-6">
          <input type="tel" className="form-control" placeholder="Teléfono" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
        </div>
        <div className="col-12 text-center">
          <button type="button" className="btn btn-warning fw-bold px-4 shadow" onClick={handleSubmit}>
            {editingId ? "Actualizar Proveedor" : "Registrar Proveedor"}
          </button>
        </div>
      </form>

      {/* Tabla con Bootstrap */}
      <table className="table table-bordered table-hover table-striped mt-4">
        <thead className="bg-dark text-warning">
          <tr>
            <th>Nombre</th>
            <th>Tipo</th>
            <th>Productos</th>
            <th>Correo</th>
            <th>Teléfono</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {proveedores.map((p) => (
            <tr key={p.idProveedor}>
              <td>{p.nombre}</td>
              <td>{p.tipo}</td>
              <td>{p.productos}</td>
              <td>{p.correo}</td>
              <td>{p.telefono}</td>
              <td className={p.estado ? "fw-bold text-success" : "fw-bold text-danger"}>
                {p.estado ? "Activo" : "Inactivo"}
              </td>
              <td>
                <button onClick={() => handleEdit(p)} className="btn btn-sm btn-warning">Editar</button>
                <button onClick={() => handleDelete(p.id)} className="btn btn-sm btn-danger ms-2">Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};


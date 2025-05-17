import { useEffect, useState } from "react";
import React from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { fetchProveedores, createProveedor, updateProveedor, deleteProveedor, fetchUsuarios } from "../api/Proveedor.api.js";

export function AdminProveedores() {
  const [proveedores, setProveedores] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState({
    nombre: "",
    tipo: "nacional",
    productos: "",
    correo: "",
    telefono: "",
    estado: true,
    usuario: "", // ID del usuario seleccionado
  });
  const [editingId, setEditingId] = useState(null);

  const cargarProveedores = async () => {
    try {
      const data = await fetchProveedores();
      setProveedores(data.data);
    } catch (error) {
      console.error("Error al obtener proveedores:", error.response?.data || error.message);
    }
  };

  const cargarUsuarios = async () => {
    try {
      const response = await fetchUsuarios();
      setUsuarios(response.data);
    } catch (error) {
      console.error("Error al obtener usuarios:", error.response?.data || error.message);
    }
  };

  useEffect(() => {
    cargarProveedores();
    cargarUsuarios();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.usuario) {
      alert("Debe seleccionar un usuario.");
      return;
    }

    try {
      if (editingId) {
        await updateProveedor(editingId, form);
      } else {
        await createProveedor(form);
      }
      setForm({
        nombre: "",
        tipo: "nacional",
        productos: "",
        correo: "",
        telefono: "",
        estado: true,
        usuario: "",
      });
      setEditingId(null);
      cargarProveedores();
    } catch (error) {
      console.error("Error al registrar proveedor:", error.response?.data || error.message);
    }
  };

  const handleEdit = (proveedor) => {
    setForm({
      nombre: proveedor.nombre,
      tipo: proveedor.tipo,
      productos: proveedor.productos,
      correo: proveedor.correo,
      telefono: proveedor.telefono,
      estado: proveedor.estado,
      usuario: proveedor.usuario || "",  // Asegúrate que proveedor tenga usuario
    });
    setEditingId(proveedor.idProveedor);
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

      <form onSubmit={handleSubmit} className="row g-3 bg-light p-4 rounded shadow">
        <div className="col-md-4">
          <input
            type="text"
            className="form-control"
            placeholder="Nombre"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          />
        </div>

        <div className="col-md-4">
          <select
            className="form-select"
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value })}
          >
            <option value="nacional">Nacional</option>
            <option value="importado">Importado</option>
          </select>
        </div>

        <div className="col-md-4">
          <input
            type="text"
            className="form-control"
            placeholder="Productos"
            value={form.productos}
            onChange={(e) => setForm({ ...form, productos: e.target.value })}
          />
        </div>

        <div className="col-md-6">
          <input
            type="email"
            className="form-control"
            placeholder="Correo"
            value={form.correo}
            onChange={(e) => setForm({ ...form, correo: e.target.value })}
          />
        </div>

        <div className="col-md-6">
          <input
            type="tel"
            className="form-control"
            placeholder="Teléfono"
            value={form.telefono}
            onChange={(e) => setForm({ ...form, telefono: e.target.value })}
          />
        </div>

        <div className="col-md-6">
          <select
            className="form-select"
            value={form.usuario}
            onChange={(e) => setForm({ ...form, usuario: e.target.value })}
            required
          >
            <option value="">-- Seleccione un usuario --</option>
            {usuarios.map(usuario => (
              <option key={usuario.idUsuario} value={usuario.idUsuario}>
                {usuario.nombre} {usuario.apellido}
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-6">
          <select
            className="form-select"
            value={form.estado}
            onChange={(e) => setForm({ ...form, estado: e.target.value === "true" })}
          >
            <option value="true">Activo</option>
            <option value="false">Inactivo</option>
          </select>
        </div>

        <div className="col-12 text-center">
          <button type="submit" className="btn btn-warning fw-bold px-4 shadow">
            {editingId ? "Actualizar Proveedor" : "Registrar Proveedor"}
          </button>
        </div>
      </form>

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
                <button onClick={() => handleDelete(p.idProveedor)} className="btn btn-sm btn-danger ms-2">Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

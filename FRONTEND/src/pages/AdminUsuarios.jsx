import React, { useEffect, useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { fetchUsuario, updateUsuario, createUsuario, handleToggleEstado } from "../api/Usuario.api";
import {ListaUsuario} from './ListaUsuario';
import { Link } from "react-router-dom";

export function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    correo: "",
    password: "",
    telefono: "",
    rol: "",
    estado: true
  });
  const [editingId, setEditingId] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState("todos");

  const cargarUsuarios = async () => {
    try {
      const response = await fetchUsuario();
      setUsuarios(response.data);
    } catch (error) {
      console.error("Error al obtener usuarios:", error.response?.data || error.message);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateUsuario(editingId, form);
      } else {
        await createUsuario(form);
      }
      setForm({
        nombre: "",
        apellido: "",
        correo: "",
        telefono: "",
        password: "",
        rol: "usuario",
        estado: true
      });
      setEditingId(null);
      cargarUsuarios();
    } catch (error) {
      console.error("Error al registrar usuario:", error.response?.data || error.message);
    }
  };

  const handleEdit = (usuario) => {
    setForm({
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      correo: usuario.correo,
      telefono: usuario.telefono,
      password: usuario.password,
      rol: usuario.rol,
      estado: usuario.estado === true || usuario.estado === "true"
    });
    setEditingId(usuario.idUsuario);
  };

  const handleToggleEstado = async (usuario) => {
    try {
      const usuarioActualizado = { ...usuario, estado: !usuario.estado };
      await updateUsuario(usuario.idUsuario, usuarioActualizado);
      cargarUsuarios();
    } catch (error) {
      console.error("Error al cambiar el estado del usuario:", error.response?.data || error.message);
    }
  };

  const usuariosFiltrados = usuarios.filter(u => {
    if (filtroEstado === "activos") return u.estado === true;
    if (filtroEstado === "inactivos") return u.estado === false;
    return true;
  });

  const total = usuarios.length;
  const activos = usuarios.filter(u => u.estado).length;
  const inactivos = total - activos;

  return (
    <div className="container mt-4">
      <h2 className="text-center fw-bold text-primary">Gestión de Usuarios</h2>

      {/* Filtros y contadores */}
      <div className="d-flex justify-content-between align-items-center my-3">
        <div>
          <button className="btn btn-outline-secondary me-2" onClick={() => setFiltroEstado("todos")}>Todos</button>
          <button className="btn btn-outline-success me-2" onClick={() => setFiltroEstado("activos")}>Activos</button>
          <button className="btn btn-outline-danger" onClick={() => setFiltroEstado("inactivos")}>Inactivos</button>
        </div>
        <div>
          <span className="me-3">Total: <strong>{total}</strong></span>
          <span className="me-3">Activos: <strong className="text-success">{activos}</strong></span>
          <span>Inactivos: <strong className="text-danger">{inactivos}</strong></span>
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="row g-3 bg-light p-4 rounded shadow">
        <div className="col-md-6">
          <input
            type="text"
            className="form-control"
            placeholder="Nombre"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            required
          />
        </div>
        <div className="col-md-6">
          <input
            type="text"
            className="form-control"
            placeholder="Apellido"
            value={form.apellido}
            onChange={(e) => setForm({ ...form, apellido: e.target.value })}
            required
          />
        </div>
        <div className="col-md-6">
          <input
            type="email"
            className="form-control"
            placeholder="Correo"
            value={form.correo}
            onChange={(e) => setForm({ ...form, correo: e.target.value })}
            required
          />
        </div>
        <div className="col-md-6">
          <input
            type="tel"
            className="form-control"
            placeholder="Teléfono"
            value={form.telefono}
            onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            required
          />
        </div>
        <div className="col-md-6">
          <input type="password"
          className="form-control"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({...form, password: e.target.value})}
          required 
          />
        </div>

        <div className="col-md-6">
          <select
            className="form-select"
            value={form.rol}
            onChange={(e) => setForm({ ...form, rol: e.target.value })}
          >
            <option value="usuario">Usuario</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
        <div className="col-md-6">
          <select
            className="form-select"
            value={form.estado.toString()}
            onChange={(e) => setForm({ ...form, estado: e.target.value === "true" })}
          >
            <option value="true">Activo</option>
            <option value="false">Inactivo</option>
          </select>
        </div>
        <div className="col-12 text-start  mt-3">
          <button type="submit" className="btn btn-primary fw-bold px-4 shadow">
            {editingId ? "Actualizar Usuario" : "Registrar Usuario"}
          </button>
          <Link to="/ListaUsuario" className="btn btn-secondary">Ir a otra pagina</Link>
        </div>
      </form>

      {/* Tabla de usuarios */}
      {/*<table className="table table-striped mt-4">
        <thead className="bg-dark text-light">
          <tr>
            <th>Nombre</th>
            <th>Apellido</th>
            <th>Correo</th>
            <th>Teléfono</th>
            <th>Rol</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuariosFiltrados.map((u) => (
            <tr key={u.idUsuario}>
              <td>{u.nombre}</td>
              <td>{u.apellido}</td>
              <td>{u.correo}</td>
              <td>{u.telefono}</td>
              <td>{u.rol}</td>
              <td className={u.estado ? "fw-bold text-success" : "fw-bold text-danger"}>
                {u.estado ? "Activo" : "Inactivo"}
              </td>
              <td>
                <button onClick={() => handleEdit(u)} className="btn btn-sm btn-primary">Editar</button>
                <button onClick={() => handleToggleEstado(u)} className={`btn btn-sm ms-2 ${u.estado ? "btn-danger" : "btn-success"}`}>
                  {u.estado ? "Inactivar" : "Activar"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>*/}
    </div>
  );
}

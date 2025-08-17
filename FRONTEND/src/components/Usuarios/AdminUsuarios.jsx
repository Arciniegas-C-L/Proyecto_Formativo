import { useEffect, useState } from "react";
import React from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { fetchUsuario, updateUsuario } from "../../api/Usuario.api.js";
import { useAuth } from "../../context/AuthContext.jsx"; // ✅ nuevo import

export function AdminUsuarios() {
  const { token, rol } = useAuth(); // ✅ accedemos al contexto

  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    correo: "",
    telefono: "",
    rol: "usuario",
    estado: true
  });
  const [editingId, setEditingId] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState("todos");

  // ===================== FUNCIONES ===================== //

  const cargarUsuarios = async () => {
    try {
      const response = await fetchUsuario();
      setUsuarios(response.data);
    } catch (error) {
      console.error("Error al obtener usuarios:", error.response?.data || error.message);
    }
  };

  // ✅ solo carga usuarios si el token existe y el rol es administrador
  useEffect(() => {
    if (token && rol === "administrador") {
      cargarUsuarios();
    }
  }, [token, rol]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateUsuario(editingId, form);
      } else {
        await fetchUsuario.createUsuario(form); // Si tienes createUsuario, usarlo aquí
      }
      setForm({
        nombre: "",
        apellido: "",
        correo: "",
        telefono: "",
        rol: "usuario",
        estado: true
      });
      setEditingId(null);
      cargarUsuarios();
    } catch (error) {
      console.error("Error al registrar usuario:", error.response?.data || error.message);
    }
  };

  // Cargar datos al formulario para editar
  const handleEdit = (usuario) => {
    setForm({
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      correo: usuario.correo,
      telefono: usuario.telefono,
      rol: usuario.rol,
      estado: usuario.estado
    });
    setEditingId(usuario.idUsuario);
  };

  // Cambiar estado activo/inactivo
  const handleToggleEstado = async (usuario) => {
    try {
      const usuarioActualizado = { ...usuario, estado: !usuario.estado };
      await updateUsuario(usuario.idUsuario, usuarioActualizado);
      cargarUsuarios();
    } catch (error) {
      console.error("Error al cambiar el estado:", error.response?.data || error.message);
    }
  };

  // Filtrar usuarios
  const usuariosFiltrados = usuarios.filter(u => {
    if (filtroEstado === "activos") return u.estado === true;
    if (filtroEstado === "inactivos") return u.estado === false;
    return true;
  });

  const total = usuarios.length;
  const activos = usuarios.filter(u => u.estado).length;
  const inactivos = total - activos;

  // ✅ protección visual si no tiene acceso
  if (!token || rol !== "administrador") {
    return <p className="text-center text-danger mt-5">Acceso no autorizado</p>;
  }

  // ===================== RENDER ===================== //
  return (
    <>
      <h2>Gestión de Usuarios</h2>

    {/* Filtros */}
    <div>
      <button onClick={() => setFiltroEstado("todos")}>Todos</button>
      <button onClick={() => setFiltroEstado("activos")}>Activos</button>
      <button onClick={() => setFiltroEstado("inactivos")}>Inactivos</button>
    </div>

    <div>
      <span>Total: {total}</span> | 
      <span>Activos: {activos}</span> | 
      <span>Inactivos: {inactivos}</span>
    </div>  {/* ✅ cierre que faltaba */}
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
          <span className="me-3">activos: <strong className="text-success">{activos}</strong></span>
          <span>inactivos: <strong className="text-danger">{inactivos}</strong></span>
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Nombre"
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Apellido"
          value={form.apellido}
          onChange={(e) => setForm({ ...form, apellido: e.target.value })}
          required
        />
        <input
          type="email"
          placeholder="Correo"
          value={form.correo}
          onChange={(e) => setForm({ ...form, correo: e.target.value })}
          required
        />
        <input
          type="tel"
          placeholder="Teléfono"
          value={form.telefono}
          onChange={(e) => setForm({ ...form, telefono: e.target.value })}
          required
        />
        <select value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}>
          <option value="usuario">Usuario</option>
          <option value="admin">Administrador</option>
        </select>
        <select value={form.estado.toString()} onChange={(e) => setForm({ ...form, estado: e.target.value === "true" })}>
          <option value="true">Activo</option>
          <option value="false">Inactivo</option>
        </select>
        <button type="submit">{editingId ? "Actualizar Usuario" : "Registrar Usuario"}</button>
      </form>

      {/* Tabla de usuarios */}
      <table>
        <thead>
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
              <td>{u.estado ? "activo" : "inactivo"}</td>
              <td>
                <button onClick={() => handleEdit(u)}>Editar</button>
                <button onClick={() => handleToggleEstado(u)}>
                  {u.estado ? "Inactivar" : "Activar"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </>
  );
}
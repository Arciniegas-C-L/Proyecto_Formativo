import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  fetchUsuario,      // <- si tu API realmente es fetchUsuarios(), cámbialo aquí y abajo
  createUsuario,     // <- asegúrate que exista en ../../api/Usuario.api.js
  updateUsuario,
} from "../../api/Usuario.api.js";
import { useAuth } from "../../context/AuthContext.jsx";

export function AdminUsuarios() {
  const { token, rol } = useAuth();

  const [usuarios, setUsuarios] = useState([]);
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    correo: "",
    password: "",
    telefono: "",
    rol: "",          // usaremos "1" | "2" (string numérica) para el <select>
    estado: "true",   // "true" | "false" como string para el <select>
  });
  const [editingId, setEditingId] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState("todos");

  // ===================== DATA ===================== //

  const cargarUsuarios = async () => {
    try {
      const res = await fetchUsuario(); // si tu función real es fetchUsuarios(), ajusta
      const data = res?.data ?? res ?? [];
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al obtener usuarios:", error?.response?.data || error?.message);
      setUsuarios([]);
    }
  };

  useEffect(() => {
    if (token && rol === "administrador") {
      cargarUsuarios();
    }
  }, [token, rol]);

  // ===================== FORM ===================== //

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toPayload = (fd) => ({
    nombre: fd.nombre.trim(),
    apellido: fd.apellido.trim(),
    correo: fd.correo.trim(),
    password: fd.password, // si es edición puedes omitirlo del payload si va vacío
    telefono: fd.telefono.trim(),
    rol: parseInt(fd.rol, 10),           // backend espera idRol numérico (1, 2, ...)
    estado: fd.estado === "true",        // string -> boolean
  });

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      nombre: "",
      apellido: "",
      correo: "",
      password: "",
      telefono: "",
      rol: "",
      estado: "true",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = toPayload(formData);

      if (!payload.nombre || !payload.apellido || !payload.correo || !payload.telefono || !formData.rol) {
        alert("Completa los campos obligatorios");
        return;
      }

      if (editingId) {
        // Si no quieres cambiar password en edición cuando está vacío, puedes eliminarlo:
        if (!payload.password) delete payload.password;
        await updateUsuario(editingId, payload);
        alert("Usuario actualizado con éxito");
      } else {
        await createUsuario(payload);
        alert("Usuario registrado con éxito");
      }

      resetForm();
      cargarUsuarios();
    } catch (error) {
      console.error("Error al registrar/actualizar usuario:", error?.response?.data || error?.message);
      alert("Ocurrió un error al guardar.");
    }
  };

  // Cargar datos al formulario para editar
  const handleEdit = (usuario) => {
    setEditingId(usuario.idUsuario);
    setFormData({
      nombre: usuario?.nombre ?? "",
      apellido: usuario?.apellido ?? "",
      correo: usuario?.correo ?? "",
      password: "", // no rellenamos password por seguridad
      telefono: usuario?.telefono ?? "",
      rol: String(usuario?.rolId ?? usuario?.rol ?? ""), // ajusta según lo que devuelva tu API
      estado: usuario?.estado ? "true" : "false",
    });
  };

  // Cambiar estado activo/inactivo (toggle)
  const handleToggleEstado = async (usuario) => {
    try {
      const payload = {
        ...usuario,
        estado: !usuario.estado,
      };
      await updateUsuario(usuario.idUsuario, payload);
      cargarUsuarios();
    } catch (error) {
      console.error("Error al cambiar el estado:", error?.response?.data || error?.message);
    }
  };

  // ===================== FILTRO ===================== //

  const usuariosFiltrados = usuarios.filter((u) => {
    if (filtroEstado === "activos") return u.estado === true;
    if (filtroEstado === "inactivos") return u.estado === false;
    return true;
  });

  const total = usuarios.length;
  const activos = usuarios.filter((u) => u.estado).length;
  const inactivos = total - activos;

  // ===================== GUARD ===================== //

  if (!token || rol !== "administrador") {
    return <p className="text-center text-danger mt-5">Acceso no autorizado</p>;
    }

  // ===================== RENDER ===================== //
  return (
    <>
      <h2>Gestión de Usuarios</h2>

      {/* Filtros */}
      <div className="mb-2">
        <button className="btn btn-outline-secondary me-2" onClick={() => setFiltroEstado("todos")}>
          Todos
        </button>
        <button className="btn btn-outline-success me-2" onClick={() => setFiltroEstado("activos")}>
          Activos
        </button>
        <button className="btn btn-outline-danger" onClick={() => setFiltroEstado("inactivos")}>
          Inactivos
        </button>
      </div>

      <div className="mb-3">
        <span className="me-3">Total: {total}</span>
        <span className="me-3">Activos: {activos}</span>
        <span>Inactivos: {inactivos}</span>
      </div>

      <div className="container mt-4">
        <h3>{editingId ? "Editar Usuario" : "Registrar Usuario"}</h3>
        <form onSubmit={handleSubmit}>
          {/* Nombre */}
          <div className="mb-3">
            <label className="form-label">Nombre</label>
            <input
              type="text"
              className="form-control"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
            />
          </div>

          {/* Apellido */}
          <div className="mb-3">
            <label className="form-label">Apellido</label>
            <input
              type="text"
              className="form-control"
              name="apellido"
              value={formData.apellido}
              onChange={handleChange}
              required
            />
          </div>

          {/* Correo */}
          <div className="mb-3">
            <label className="form-label">Correo</label>
            <input
              type="email"
              className="form-control"
              name="correo"
              value={formData.correo}
              onChange={handleChange}
              required
            />
          </div>

          {/* Password */}
          <div className="mb-3">
            <label className="form-label">Contraseña {editingId ? "(deja vacío si no cambia)" : ""}</label>
            <input
              type="password"
              className="form-control"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required={!editingId}
            />
          </div>

          {/* Teléfono */}
          <div className="mb-3">
            <label className="form-label">Teléfono</label>
            <input
              type="text"
              className="form-control"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              required
            />
          </div>

          {/* Rol */}
          <div className="mb-3">
            <label className="form-label">Rol</label>
            <select
              className="form-select"
              name="rol"
              value={formData.rol}
              onChange={handleChange}
              required
            >
              <option value="">Seleccione un rol</option>
              <option value="1">Administrador</option>
              <option value="2">Usuario</option>
            </select>
          </div>

          {/* Estado */}
          <div className="mb-3">
            <label className="form-label">Estado</label>
            <select
              className="form-select"
              name="estado"
              value={formData.estado}
              onChange={handleChange}
              required
            >
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select>
          </div>

          {/* Botones */}
          <button type="submit" className="btn btn-primary me-2">
            {editingId ? "Actualizar" : "Registrar"}
          </button>
        </form>

        {/* Tabla de usuarios */}
        <div className="table-responsive mt-4">
          <table className="table table-striped align-middle">
            <thead className="table-light">
              <tr>
                <th>Nombre</th>
                <th>Apellido</th>
                <th>Correo</th>
                <th>Teléfono</th>
                <th>Rol</th>
                <th>Estado</th>
                <th style={{ width: 180 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.map((u) => (
                <tr key={u.idUsuario}>
                  <td>{u.nombre}</td>
                  <td>{u.apellido}</td>
                  <td>{u.correo}</td>
                  <td>{u.telefono}</td>
                  <td>{u.rolNombre ?? u.rol ?? "-"}</td>
                  <td>{u.estado ? "Activo" : "Inactivo"}</td>
                  <td>
                    <button className="btn btn-sm btn-warning me-2" onClick={() => handleEdit(u)}>
                      Editar
                    </button>
                    <button
                      className={`btn btn-sm ${u.estado ? "btn-danger" : "btn-success"}`}
                      onClick={() => handleToggleEstado(u)}
                    >
                      {u.estado ? "Inactivar" : "Activar"}
                    </button>
                  </td>
                </tr>
              ))}
              {usuariosFiltrados.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center text-muted py-3">
                    No hay usuarios para mostrar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

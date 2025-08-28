import React, { useEffect, useState } from "react";
import { fetchUsuario, updateUsuario, handleToggleEstado } from "../../api/Usuario.api.js";
import { useNavigate } from "react-router-dom";

const ListaUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]); // Lista completa de usuarios
  const [filtro, setFiltro] = useState("todos"); // Filtro de estado
  const [editando, setEditando] = useState(null); // idUsuario en edición
  const [formEdit, setFormEdit] = useState({}); // Datos del usuario que se edita
  const navigate = useNavigate();

  // 🔹 Traer todos los usuarios al cargar
  const fetchUsuarios = async () => {
    try {
      const res = await fetchUsuario();
      setUsuarios(res.data);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  // 🔹 Cambiar estado Activo/Inactivo usando PATCH
  const cambiarEstado = async (usuario) => {
    try {
      // Solo enviamos el campo 'estado' con PATCH
      await handleToggleEstado(usuario.idUsuario, !usuario.estado);
      fetchUsuarios(); // refrescar lista
    } catch (error) {
      console.error("Error al cambiar estado:", error);
    }
  };

  // 🔹 Preparar edición
  const iniciarEdicion = (usuario) => {
    setEditando(usuario.idUsuario);
    setFormEdit({
      ...usuario,
      estado: usuario.estado ? "true" : "false",
      rol: usuario.rol?.idRol || usuario.rol,
    });
  };

  // 🔹 Cambios en inputs de edición
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormEdit({ ...formEdit, [name]: value });
  };

  // 🔹 Guardar edición (PUT completo)
  const guardarEdicion = async () => {
    try {
      const payload = {
        nombre: formEdit.nombre,
        apellido: formEdit.apellido,
        correo: formEdit.correo,
        telefono: formEdit.telefono,
        estado: formEdit.estado === "true",
        rol: parseInt(formEdit.rol),
      };

      // Solo admins pueden cambiar contraseña
      if (formEdit.password && (payload.rol === 1 || payload.rol === "1")) {
        payload.password = formEdit.password;
      }

      await updateUsuario(formEdit.idUsuario, payload);
      alert("Usuario actualizado ");
      setEditando(null);
      fetchUsuarios();
    } catch (error) {
      console.error("Error al actualizar usuario:", error);
      alert("Error al actualizar ");
    }
  };

  // 🔹 Filtrar usuarios
  const usuariosFiltrados = usuarios.filter((u) => {
    if (filtro === "todos") return true;
    return filtro === "activo" ? u.estado === true : u.estado === false;
  });

  return (
    <div className="container mt-4">
      <h2>Lista de Usuarios</h2>

      {/* 🔹 Filtros */}
      <div className="mb-3">
        <button className={`btn me-2 ${filtro === "todos" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setFiltro("todos")}>Todos</button>
        <button className={`btn me-2 ${filtro === "activo" ? "btn-success" : "btn-outline-success"}`} onClick={() => setFiltro("activo")}>Activos</button>
        <button className={`btn ${filtro === "inactivo" ? "btn-danger" : "btn-outline-danger"}`} onClick={() => setFiltro("inactivo")}>Inactivos</button>
      </div>

      {/* 🔹 Botón volver a registro */}
      <button className="btn btn-secondary mb-3" onClick={() => navigate("/usuario")}>Volver a Registrar Usuario</button>

      {/* 🔹 Tabla de usuarios */}
      <table className="table table-bordered table-hover">
        <thead className="table-dark">
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
          {usuariosFiltrados.map((u) =>
            editando === u.idUsuario ? (
              // 🔹 Modo edición
              <tr key={u.idUsuario}>
                <td><input type="text" className="form-control" name="nombre" value={formEdit.nombre} onChange={handleChange} /></td>
                <td><input type="text" className="form-control" name="apellido" value={formEdit.apellido} onChange={handleChange} /></td>
                <td><input type="email" className="form-control" name="correo" value={formEdit.correo} onChange={handleChange} /></td>
                <td><input type="text" className="form-control" name="telefono" value={formEdit.telefono} onChange={handleChange} /></td>
                <td>{formEdit.rol === 1 ? "Administrador" : "Usuario"}</td>
                <td>
                  <select className="form-select" name="estado" value={formEdit.estado} onChange={handleChange}>
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                </td>
                <td>
                  {formEdit.rol === 1 || formEdit.rol === "1" ? (
                    <input type="password" className="form-control mb-2" name="password" placeholder="Nueva contraseña" value={formEdit.password || ""} onChange={handleChange} />
                  ) : null}
                  <button className="btn btn-success btn-sm me-2" onClick={guardarEdicion}>Guardar</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setEditando(null)}>Cancelar</button>
                </td>
              </tr>
            ) : (
              // 🔹 Modo vista
              <tr key={u.idUsuario}>
                <td>{u.nombre}</td>
                <td>{u.apellido}</td>
                <td>{u.correo}</td>
                <td>{u.telefono}</td>
                <td>{u.rol === 1 ? "Administrador" : "Usuario"}</td>
                <td><span className={`badge ${u.estado ? "bg-success" : "bg-danger"}`}>{u.estado ? "Activo" : "Inactivo"}</span></td>
                <td>
                  <button className={`btn btn-sm me-2 ${u.estado ? "btn-warning" : "btn-success"}`} onClick={() => cambiarEstado(u)}>
                    {u.estado ? "Inactivar" : "Activar"}
                  </button>
                  <button className="btn btn-sm btn-info" onClick={() => iniciarEdicion(u)}>Editar</button>
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ListaUsuarios;
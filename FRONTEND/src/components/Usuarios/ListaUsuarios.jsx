import React, { useEffect, useState } from "react";
import { fetchUsuario, updateUsuario } from "../../api/Usuario.api.js";

const ListaUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [filtro, setFiltro] = useState("todos");

  // 🔹 Cargar usuarios desde la API
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

  // 🔹 Cambiar estado de activo/inactivo
  const cambiarEstado = async (id, estado) => {
    try {
      await updateUsuario(id, { estado });
      fetchUsuarios(); // recargar lista
    } catch (error) {
      console.error("Error al cambiar estado:", error);
    }
  };

  // 🔹 Filtros de usuarios
  const usuariosFiltrados = usuarios.filter((u) => {
    if (filtro === "todos") return true;
    return u.estado === filtro;
  });

  return (
    <div className="container mt-4">
      <h2>Lista de Usuarios</h2>

      {/* 🔹 Botones de filtro */}
      <div className="mb-3">
        <button
          className={`btn me-2 ${filtro === "todos" ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => setFiltro("todos")}
        >
          Todos
        </button>
        <button
          className={`btn me-2 ${filtro === "activo" ? "btn-success" : "btn-outline-success"}`}
          onClick={() => setFiltro("activo")}
        >
          Activos
        </button>
        <button
          className={`btn ${filtro === "inactivo" ? "btn-danger" : "btn-outline-danger"}`}
          onClick={() => setFiltro("inactivo")}
        >
          Inactivos
        </button>
      </div>

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
          {usuariosFiltrados.map((u) => (
            <tr key={u.id}>
              <td>{u.nombre}</td>
              <td>{u.apellido}</td>
              <td>{u.correo}</td>
              <td>{u.telefono}</td>
              <td>{u.rol}</td>
              <td>
                <span
                  className={`badge ${u.estado === "activo" ? "bg-success" : "bg-danger"}`}
                >
                  {u.estado}
                </span>
              </td>
              <td>
                {u.estado === "activo" ? (
                  <button
                    className="btn btn-sm btn-warning"
                    onClick={() => cambiarEstado(u.id, "inactivo")}
                  >
                    Inactivar
                  </button>
                ) : (
                  <button
                    className="btn btn-sm btn-success"
                    onClick={() => cambiarEstado(u.id, "activo")}
                  >
                    Activar
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ListaUsuarios;
import React, { useEffect, useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { fetchUsuario, updateUsuario } from "../api/Usuario.api";

export function ListaUsuario() {
  const [usuarios, setUsuarios] = useState([]);

  useEffect(() => {
    const cargarUsuarios = async () => {
      try {
        const response = await fetchUsuario();
        setUsuarios(response.data);
      } catch (error) {
        console.error("Error al obtener usuarios:", error.response?.data || error.message);
      }
    };
    cargarUsuarios();
  }, []);

  const handleToggleEstado = async (usuario) => {
    try {
      const usuarioActualizado = { ...usuario, estado: !usuario.estado };
      await updateUsuario(usuario.idUsuario, usuarioActualizado);
      const response = await fetchUsuario();
      setUsuarios(response.data);
    } catch (error) {
      console.error("Error al cambiar estado:", error.response?.data || error.message);
    }
  };

  return (
    <table className="table table-striped mt-4">
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
        {usuarios.map((u) => (
          <tr key={u.idUsuario}>
            <td>{u.nombre}</td>
            <td>{u.apellido}</td>
            <td>{u.correo}</td>
            <td>{u.telefono}</td>
            <td>{u.rol}</td>
            <td className={u.estado ? "fw-bold text-success" : "fw-bold text-danger"}>
              {u.estado ? "activo" : "inactivo"}
            </td>
            <td>
              <button className="btn btn-sm btn-primary" disabled>Editar</button>
              <button onClick={() => handleToggleEstado(u)} className={`btn btn-sm ms-2 ${u.estado ? "btn-danger" : "btn-success"}`}>
                {u.estado ? "Inactivar" : "Activar"}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

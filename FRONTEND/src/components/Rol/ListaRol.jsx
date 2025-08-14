import React, { useEffect, useState } from "react";
import { getALLRoles } from "../../api/Rol.api";
import { Link } from "react-router-dom";
import "../../assets/css/Rol/ListaRol.css";

export function ListaRol() {
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    async function MostrarRoles() {
      const res = await getALLRoles();
      setRoles(res.data);
    }
    MostrarRoles();
  }, []);

  return (
    <div className="lista-rol-container">
      <div className="lista-rol-header">
        <h2 className="lista-rol-titulo">Listado de Roles</h2>
        <Link to="/rol-create" className="boton-crear-rol">
          Crear Rol
        </Link>
      </div>

      <div className="tabla-rol-container">
        <table className="tabla-rol">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((rol) => (
              <tr key={rol.idROL}>
                <td>{rol.idROL}</td>
                <td>{rol.nombre}</td>
                <td>
                  <Link
                    to={`/rol-edit/${rol.idROL}`}
                    className="boton-editar-rol"
                  >
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

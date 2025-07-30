import React, { useEffect, useState } from 'react';
import { getALLRoles } from '../../api/Rol.api';
import { Link } from 'react-router-dom';

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
    <div className="container mt-5">
      <div className="d-flex justify-content-around mb-4">
        <h3>Roles</h3>
        <Link to="/rol-create" className="text-decoration-none btn btn-outline-success">
          Crear Rol
        </Link>
      </div>
      <div className="m-auto w-50 mt-2 bg-white rounded-2 overflow-hidden shadow">
        <table className="w-100">
          <thead>
            <tr className="justify-content-around">
              <th className="bg-white text-muted border py-3 px-2 font-weight-bold border-bottom text-lg-center text-uppercase">
                Id
              </th>
              <th className="bg-white text-muted border py-3 px-2 font-weight-bold border-bottom text-lg-center text-uppercase">
                Nombre
              </th>
              <th className="bg-white text-muted border py-3 px-2 font-weight-bold border-bottom text-lg-center text-uppercase">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {roles.map((rol) => (
              <tr key={rol.idROL} className="justify-content-around">
                <td className="py-3 px-2 border align-middle text-center">{rol.idROL}</td>
                <td className="py-3 px-2 border align-middle mx-2">{rol.nombre}</td>
                <td className="py-3 px-2 align-center border text-center">
                  <Link to={`/rol-edit/${rol.idROL}`} className="text-decoration-none btn btn-warning">
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
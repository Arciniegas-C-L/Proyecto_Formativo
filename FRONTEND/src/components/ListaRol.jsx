import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getRolesPorPagina } from '../api/Rol.api';

export function ListaRol() {
  const [roles, setRoles] = useState([]);
  const [next, setNext] = useState(null);
  const [previous, setPrevious] = useState(null);
  const [currentPageUrl, setCurrentPageUrl] = useState(""); // ← "" = baseURL

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await getRolesPorPagina(currentPageUrl); // puede ser "", "?page=2", etc.
        setRoles(res.data.results);
        setNext(res.data.next);
        setPrevious(res.data.previous);
      } catch (error) {
        console.error('Error al cargar roles:', error);
      }
    };

    fetchRoles();
  }, [currentPageUrl]);

  // Función auxiliar para limpiar la URL completa (quita host)
  const getRelativeUrl = (fullUrl) => {
    if (!fullUrl) return "";
    const base = "http://127.0.0.1:8000/BACKEND/api/rol/";
    return fullUrl.replace(base, "");
  };

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
              <th className="bg-white text-muted border py-3 px-2 font-weight-bold border-bottom text-lg-center text-uppercase">Id</th>
              <th className="bg-white text-muted border py-3 px-2 font-weight-bold border-bottom text-lg-center text-uppercase">Nombre</th>
              <th className="bg-white text-muted border py-3 px-2 font-weight-bold border-bottom text-lg-center text-uppercase">Acciones</th>
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

      {/* Navegación entre páginas */}
      <div className="d-flex justify-content-center mt-3">
        <button
          className="btn btn-outline-primary mx-2"
          onClick={() => setCurrentPageUrl(getRelativeUrl(previous))}
          disabled={!previous}
        >
          Anterior
        </button>
        <button
          className="btn btn-outline-primary mx-2"
          onClick={() => setCurrentPageUrl(getRelativeUrl(next))}
          disabled={!next}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { getALLRoles } from "../../api/Rol.api";
import { Link } from "react-router-dom";
import "../../assets/css/Rol/ListaRol.css";

    export function ListaRol() {
       // Estado para almacenar todos los roles obtenidos desde la API
const [roles, setRoles] = useState([]);

// Estado para controlar la página actual de la paginación
const [currentPage, setCurrentPage] = useState(1);

// Estado para almacenar el rol actualmente seleccionado para editar
const [rolSeleccionado, setRolSeleccionado] = useState(null);

// Estado para almacenar el nuevo nombre del rol durante la edición
const [nombreEditado, setNombreEditado] = useState('');

// Cantidad de elementos a mostrar por página
const itemsPerPage = 5;

// useEffect que se ejecuta al montar el componente para cargar los roles
useEffect(() => {
    async function MostrarRoles() {
        const res = await getALLRoles();
        setRoles(res.data);
    }
    MostrarRoles();
}, []);

// Calcular el número total de páginas
const totalPages = Math.ceil(roles.length / itemsPerPage);

// Índices para cortar la lista de roles según la página actual
const indexOfLastItem = currentPage * itemsPerPage;
const indexOfFirstItem = indexOfLastItem - itemsPerPage;

// Obtener los roles a mostrar en la página actual
const currentItems = roles.slice(indexOfFirstItem, indexOfLastItem);

// Función para cambiar de página si está dentro del rango válido
const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
        setCurrentPage(pageNumber);
    }
};

// Función para seleccionar un rol y preparar su edición
const seleccionarRol = (rol) => {
    setRolSeleccionado(rol);
    setNombreEditado(rol.nombre);
};

// Función para guardar los cambios del rol editado
const guardarCambios = async () => {
    if (rolSeleccionado) {
        await updateRol(rolSeleccionado.idROL, { nombre: nombreEditado });

        // Recargar los roles actualizados
        const res = await getALLRoles();
        setRoles(res.data);

        // Limpiar la selección y el estado de edición
        setRolSeleccionado(null);
        setNombreEditado('');
    }
};


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

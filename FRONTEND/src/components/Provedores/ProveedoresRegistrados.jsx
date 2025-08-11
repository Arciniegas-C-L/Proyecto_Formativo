import React, { useEffect, useState } from "react";
import {
  fetchProveedores,
  updateProveedor,
  deleteProveedor,
} from "../../api/Proveedor.api";
import "../../assets/css/ProveedorRegistro.css";
import { } from "../context/AuthContext";

export function ProveedoresRegistrados() {
 // Estado para almacenar la lista de proveedores obtenida de la API
const [proveedores, setProveedores] = useState([]);

// Estado para almacenar el ID del proveedor que se está editando
const [editId, setEditId] = useState(null);

// Estado para almacenar los datos del proveedor durante la edición
const [editData, setEditData] = useState({});

// Estado para almacenar el ID del proveedor que se desea eliminar (para confirmar)
const [proveedorAEliminar, setProveedorAEliminar] = useState(null);

// useEffect se ejecuta solo una vez al montar el componente para cargar los proveedores
useEffect(() => {
  cargarProveedores();
}, []);

// Función asincrónica para obtener proveedores desde la API y actualizar el estado
const cargarProveedores = async () => {
  try {
    const response = await fetchProveedores(); // Llama a la función que obtiene los proveedores
    setProveedores(response.data); // Actualiza el estado con los datos recibidos
  } catch (error) {
    console.error("Error al cargar proveedores:", error); // Muestra error en consola si falla
  }
};

// Función que guarda el ID del proveedor que se quiere eliminar (para mostrar confirmación)
const confirmarEliminar = (id) => setProveedorAEliminar(id);

// Función que cancela la acción de eliminar (oculta confirmación)
const cancelarEliminar = () => setProveedorAEliminar(null);

// Función para eliminar un proveedor de la API y actualizar el estado local
const eliminarProveedor = async () => {
  try {
    await deleteProveedor(proveedorAEliminar); // Elimina el proveedor de la API
    // Filtra el proveedor eliminado del estado local
    setProveedores(proveedores.filter((p) => p.idProveedor !== proveedorAEliminar));
    setProveedorAEliminar(null); // Limpia el estado de eliminación
  } catch (error) {
    console.error("Error al eliminar proveedor:", error); // Muestra error si falla
  }
};

// Función que prepara el formulario para editar un proveedor cargando sus datos
const comenzarEdicion = (proveedor) => {
  setEditId(proveedor.idProveedor); // Guarda el ID que se está editando
  setEditData({
    nombre: proveedor.nombre,
    correo: proveedor.correo,
    telefono: proveedor.telefono,
    tipo: proveedor.tipo,
    estado: proveedor.estado,
  }); // Carga los datos del proveedor en el estado editData
};

// Función para cancelar la edición y limpiar los estados relacionados
const cancelarEdicion = () => {
  setEditId(null); // Limpia el ID en edición
  setEditData({}); // Limpia los datos del formulario
};

// Función para guardar los cambios editados de un proveedor
const guardarEdicion = async (id) => {
  try {
    await updateProveedor(id, editData); // Envía los datos editados a la API
    // Actualiza el proveedor en el estado local con los nuevos datos
    setProveedores(
      proveedores.map((p) =>
        p.idProveedor === id ? { ...p, ...editData } : p
      )
    );
    cancelarEdicion(); // Limpia los estados de edición
  } catch (error) {
    console.error("Error al actualizar proveedor:", error); // Muestra error si falla
  }
};

// Función que maneja el cambio de los inputs del formulario de edición
const manejarCambio = ({ target: { name, value, type, checked } }) => {
  setEditData((prev) => ({
    ...prev,
    [name]: type === "checkbox" ? checked : value, // Maneja tanto campos normales como checkboxes
  }));
};


  return (
    <>
      <div className="container">
        <h2 className="titulo-proveedores">
          Lista de Proveedores Registrados
        </h2>

        {proveedorAEliminar && (
          <div className="alert">
            <p>¿Seguro que quieres eliminar este proveedor?</p>
            <div>
              <button
                className="btn btn-eliminar"
                onClick={eliminarProveedor}
              >
                Aceptar
              </button>
              <button
                className="btn btn-cancelar"
                onClick={cancelarEliminar}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        <table className="table table-bordered">
          <thead className="table-dark">
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Teléfono</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {proveedores.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center">
                  No hay proveedores registrados
                </td>
              </tr>
            ) : (
              proveedores.map((proveedor) => {
                const isEditing = editId === proveedor.idProveedor;
                return (
                  <tr key={proveedor.idProveedor}>
                    <td>
                      {isEditing ? (
                        <input
                          className="form-control"
                          type="text"
                          name="nombre"
                          value={editData.nombre}
                          onChange={manejarCambio}
                        />
                      ) : (
                        proveedor.nombre
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          className="form-control"
                          type="email"
                          name="correo"
                          value={editData.correo}
                          onChange={manejarCambio}
                        />
                      ) : (
                        proveedor.correo
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          className="form-control"
                          type="text"
                          name="telefono"
                          value={editData.telefono}
                          onChange={manejarCambio}
                        />
                      ) : (
                        proveedor.telefono
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          className="form-control"
                          type="text"
                          name="tipo"
                          value={editData.tipo}
                          onChange={manejarCambio}
                        />
                      ) : (
                        proveedor.tipo
                      )}
                    </td>
                    <td className="text-center">
                      {isEditing ? (
                        <input
                          type="checkbox"
                          name="estado"
                          checked={editData.estado}
                          onChange={manejarCambio}
                        />
                      ) : proveedor.estado ? (
                        <span className="badge bg-success">Activo</span>
                      ) : (
                        <span className="badge bg-secondary">Inactivo</span>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <>
                          <button
                            className="btn btn-guardar me-2"
                            onClick={() => guardarEdicion(proveedor.idProveedor)}
                          >
                            Guardar
                          </button>
                          <button
                            className="btn btn-cancelar"
                            onClick={cancelarEdicion}
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="btn btn-editar"
                            onClick={() => comenzarEdicion(proveedor)}
                          >
                            Editar
                          </button>
                          <button
                            className="btn btn-eliminar"
                            onClick={() => confirmarEliminar(proveedor.idProveedor)}
                          >
                            Eliminar
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
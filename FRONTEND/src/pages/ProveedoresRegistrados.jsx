import React, { useEffect, useState } from "react";
import {
  fetchProveedores,
  updateProveedor,
  deleteProveedor,
} from "../api/Proveedor.api";
import "../assets/css/ProveedorRegistro.css";

export default function ProveedoresRegistrados() {
  const [proveedores, setProveedores] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [proveedorAEliminar, setProveedorAEliminar] = useState(null);

  useEffect(() => {
    cargarProveedores();
  }, []);

  const cargarProveedores = async () => {
    try {
      const response = await fetchProveedores();
      setProveedores(response.data);
    } catch (error) {
      console.error("Error al cargar proveedores:", error);
    }
  };

  const confirmarEliminar = (id) => setProveedorAEliminar(id);
  const cancelarEliminar = () => setProveedorAEliminar(null);

  const eliminarProveedor = async () => {
    try {
      await deleteProveedor(proveedorAEliminar);
      setProveedores(proveedores.filter((p) => p.idProveedor !== proveedorAEliminar));
      setProveedorAEliminar(null);
    } catch (error) {
      console.error("Error al eliminar proveedor:", error);
    }
  };

  const comenzarEdicion = (proveedor) => {
    setEditId(proveedor.idProveedor);
    setEditData({
      nombre: proveedor.nombre,
      correo: proveedor.correo,
      telefono: proveedor.telefono,
      tipo: proveedor.tipo,
      estado: proveedor.estado,
    });
  };

  const cancelarEdicion = () => {
    setEditId(null);
    setEditData({});
  };

  const guardarEdicion = async (id) => {
    try {
      await updateProveedor(id, editData);
      setProveedores(
        proveedores.map((p) =>
          p.idProveedor === id ? { ...p, ...editData } : p
        )
      );
      cancelarEdicion();
    } catch (error) {
      console.error("Error al actualizar proveedor:", error);
    }
  };

  const manejarCambio = ({ target: { name, value, type, checked } }) => {
    setEditData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
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
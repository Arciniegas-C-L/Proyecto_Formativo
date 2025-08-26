// Importación de React y hooks necesarios
import React, { useEffect, useState } from "react";

// Importación de funciones de la API para manejar proveedores
import {
  fetchProveedores,
  updateProveedor,
  deleteProveedor,
} from "../../api/Proveedor.api";
import { useAuth } from "../../context/AuthContext";
import "../../assets/css/Proveedores/ProveedorRegistro.css";

// Importación de íconos que se utilizan en los botones
import {
  FaEdit,
  FaTrash,
  FaSave,
  FaTimes,
  FaPlane,
} from "react-icons/fa";
import { PiFlagBannerBold } from "react-icons/pi";

// Definición del componente principal
export function ProveedoresRegistrados() {
  const { autenticado } = useAuth(); // 👈 Verificamos si hay sesión

  const [proveedores, setProveedores] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [proveedorAEliminar, setProveedorAEliminar] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!autenticado) return; // 👈 No cargar si no hay sesión
    cargarProveedores();
  }, [autenticado]);

  const cargarProveedores = async () => {
    try {
      const response = await fetchProveedores();
      setProveedores(response.data);
    } catch (error) {
      console.error("Error al cargar proveedores:", error);
      setError("No autorizado o error de conexión");
    }
  };

  const confirmarEliminar = (id) => setProveedorAEliminar(id);
  const cancelarEliminar = () => setProveedorAEliminar(null);

  const eliminarProveedor = async () => {
    try {
      await deleteProveedor(proveedorAEliminar);
      setProveedores(
        proveedores.filter((p) => p.idProveedor !== proveedorAEliminar)
      );
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
    <div className="proveedores-registrados">
      <h2 className="titulo-proveedores">Lista de Proveedores Registrados</h2>

      {proveedorAEliminar && (
        <div className="alerta">
          <p>¿Seguro que quieres eliminar este proveedor?</p>
          <div className="alerta-botones">
            <button className="btn-eliminar" onClick={eliminarProveedor}>
              Eliminar
            </button>
            <button className="btn-cancelar" onClick={cancelarEliminar}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="tabla-responsive">
        <table className="tabla-proveedores">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Teléfono</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>

          {/*  AQUI AGREGO EL <tbody> PARA QUE FUNCIONE EL HOVER */}
          <tbody>
            {proveedores.length === 0 ? (
              <tr>
                <td colSpan="6" className="sin-proveedores">
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
                          className="input-proveedor"
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
                          className="input-proveedor"
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
                          className="input-proveedor"
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
                        <select
                          className="input-proveedor"
                          name="tipo"
                          value={editData.tipo}
                          onChange={manejarCambio}
                        >
                          <option value="nacional">Nacional</option>
                          <option value="importado">Importado</option>
                        </select>
                      ) : (
                        <span className="badge">
                          {proveedor.tipo === "nacional" ? (
                            <span>
                              <PiFlagBannerBold /> Nacional
                            </span>
                          ) : (
                            <span>
                              <FaPlane /> Importado
                            </span>
                          )}
                        </span>
                      )}
                    </td>
                    <td className="col-estado">
                      {isEditing ? (
                        <input
                          type="checkbox"
                          name="estado"
                          checked={editData.estado}
                          onChange={manejarCambio}
                          className="checkbox-proveedor"
                        />
                      ) : proveedor.estado ? (
                        <span className="badge bg-success">Activo</span>
                      ) : (
                        <span className="badge bg-secondary">Inactivo</span>
                      )}
                    </td>
                    <td>
                      <div className="botones-acciones">
                        {isEditing ? (
                          <>
                            <button
                              className="btn btn-guardar"
                              onClick={() =>
                                guardarEdicion(proveedor.idProveedor)
                              }
                              title="Guardar cambios"
                            >
                              <FaSave />
                            </button>
                            <button
                              className="btn btn-cancelar"
                              onClick={cancelarEdicion}
                              title="Cancelar edición"
                            >
                              <FaTimes />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="btn-editar"
                              onClick={() => comenzarEdicion(proveedor)}
                              title="Editar proveedor"
                            >
                              <FaEdit />
                            </button>
                            <button
                              className="btn-eliminar"
                              onClick={() =>
                                confirmarEliminar(proveedor.idProveedor)
                              }
                              title="Eliminar proveedor"
                            >
                              <FaTrash />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

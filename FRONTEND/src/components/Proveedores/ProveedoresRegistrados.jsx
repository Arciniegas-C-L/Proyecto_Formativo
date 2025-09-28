import React, { useEffect, useState } from "react";
import { fetchProveedores, updateProveedor, deleteProveedor } from "../../api/Proveedor.api";
import { useAuth } from "../../context/AuthContext";
import "../../assets/css/Proveedores/ProveedorRegistro.css";
import "../../assets/css/Proveedores/Proveedores.css";

import { FaEdit, FaTrash, FaSave, FaTimes } from "react-icons/fa";
import { EliminarModal } from "../EliminarModal/EliminarModal.jsx";

export function ProveedoresRegistrados() {
  const { autenticado } = useAuth();
  const [proveedores, setProveedores] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [proveedorAEliminar, setProveedorAEliminar] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!autenticado) return;
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
      setProveedores(proveedores.map((p) => (p.idProveedor === id ? { ...p, ...editData } : p)));
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


      {/* Modal global de eliminar */}
      <EliminarModal
        abierto={!!proveedorAEliminar}
        mensaje={"¿Seguro que quieres eliminar este proveedor?"}
        onCancelar={cancelarEliminar}
        onConfirmar={eliminarProveedor}
      />


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
          <tbody>
            {proveedores.length === 0 ? (
              <tr>
                <td colSpan="6" className="sin-proveedores">No hay proveedores registrados</td>
              </tr>
            ) : (
              proveedores.map((proveedor) => {
                const isEditing = editId === proveedor.idProveedor;
                return (
                  <tr key={proveedor.idProveedor}>
                    <td>{proveedor.nombre}</td>
                    <td>{proveedor.correo}</td>
                    <td>{proveedor.telefono}</td>
                    <td><span className="badge">{proveedor.tipo === "nacional" ? "Nacional" : "Importado"}</span></td>
                    <td className="col-estado">
                      {proveedor.estado ? (
                        <span className="badge bg-success">Activo</span>
                      ) : (
                        <span className="badge bg-secondary">Inactivo</span>
                      )}
                    </td>
                    <td>
                      <div className="botones-acciones">
                        <button className="btn-editar" onClick={() => comenzarEdicion(proveedor)} title="Editar proveedor"><FaEdit /></button>
                        <button className="btn-eliminar" onClick={() => confirmarEliminar(proveedor.idProveedor)} title="Eliminar proveedor"><FaTrash /></button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de edición tipo Tallas, adaptado para proveedores */}
      {editId && (
        <div className="dialog-talla-modal">
          <div className="form-talla-modal">
            <h3>Editar Proveedor</h3>
            {/* No hay error, pero puedes agregar validación si lo deseas */}

            <label className="form-label">Nombre *</label>
            <input
              className="form-control mb-2"
              name="nombre"
              value={editData.nombre}
              onChange={manejarCambio}
              maxLength={50}
            />

            <label className="form-label">Correo *</label>
            <input
              className="form-control mb-2"
              type="email"
              name="correo"
              value={editData.correo}
              onChange={manejarCambio}
              maxLength={40}
            />

            <label className="form-label">Teléfono *</label>
            <input
              className="form-control mb-2"
              name="telefono"
              value={editData.telefono}
              onChange={manejarCambio}
              maxLength={20}
              minLength={10}
            />

            <label className="form-label">Tipo *</label>
            <select
              className="form-select mb-2"
              name="tipo"
              value={editData.tipo}
              onChange={manejarCambio}
            >
              <option value="nacional">Nacional</option>
              <option value="importado">Importado</option>
            </select>

            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                name="estado"
                checked={!!editData.estado}
                onChange={manejarCambio}
              />
              <label className="form-check-label">Activo</label>
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button className="btn btn-secondary" onClick={cancelarEdicion}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={() => guardarEdicion(editId)}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
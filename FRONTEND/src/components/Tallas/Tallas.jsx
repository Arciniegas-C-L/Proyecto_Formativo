import React, { useState, useEffect } from "react";
import {
  getAllTallas,
  createTalla,
  updateTalla,
  deleteTalla,
  cambiarEstadoTalla,
} from "../../api/Talla.api.js";
import { getAllGruposTalla } from "../../api/GrupoTalla.api.js";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../assets/css/Tallas/Tallas.css";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import { useLocation } from "react-router-dom";

const Tallas = () => {
  const location = useLocation();
  const [tallas, setTallas] = useState([]);
  const [gruposTalla, setGruposTalla] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [tallaToDelete, setTallaToDelete] = useState(null);
  const [editingTalla, setEditingTalla] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    grupo_id: "",
    estado: true,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    cargarTallas();
    cargarGruposTalla();
  }, []);

  const cargarTallas = async () => {
    try {
      const res = await getAllTallas();
      setTallas(res.data || []);
    } catch {
      toast.error("Error al cargar tallas");
      setTallas([]);
    }
  };

  const cargarGruposTalla = async () => {
    try {
      const res = await getAllGruposTalla();
      setGruposTalla(res.data || []);
    } catch {
      toast.error("Error al cargar grupos de talla");
      setGruposTalla([]);
    }
  };

  const handleOpenDialog = (talla = null) => {
    setError("");

    if (talla) {
      // EDITAR TALLA EXISTENTE
      setEditingTalla(talla);
      setFormData({
        nombre: talla.nombre,
        grupo_id: talla.grupo?.id ?? talla.grupo_id ?? "",
        estado: talla.estado,
      });
    } else {
      // NUEVA TALLA
      setEditingTalla(null);
      let grupoIdDesdeNavegacion = location.state?.grupoId || "";
      setFormData({
        nombre: "",
        grupo_id: grupoIdDesdeNavegacion,
        estado: true,
      });
    }

    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTalla(null);
    setFormData({ nombre: "", grupo_id: "", estado: true });
    setError("");
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim() || !formData.grupo_id) {
      setError("Todos los campos son obligatorios");
      return;
    }
    try {
      if (editingTalla) {
        await updateTalla(editingTalla.id, formData);
        toast.success("Talla actualizada exitosamente");
      } else {
        await createTalla(formData);
        toast.success("Talla creada exitosamente");
      }
      handleCloseDialog();
      cargarTallas();
    } catch {
      toast.error("Error al guardar la talla");
    }
  };

  const handleDeleteClick = (talla) => {
    setTallaToDelete(talla);
    setOpenDeleteDialog(true);
  };

  const confirmDelete = async () => {
    try {
      if (!tallaToDelete) return;
      await deleteTalla(tallaToDelete.id);
      toast.success("Talla eliminada exitosamente");
      setOpenDeleteDialog(false);
      setTallaToDelete(null);
      cargarTallas();
    } catch {
      toast.error("Error al eliminar la talla");
    }
  };

  const handleEstadoChange = async (talla) => {
    try {
      await cambiarEstadoTalla(talla.id, !talla.estado);
      toast.success("Estado actualizado");
      cargarTallas();
    } catch {
      toast.error("Error al cambiar estado");
    }
  };

  return (
    <div className="lista-tallas-container">
      <div className="header-acciones">
        <h2>Gestión de Tallas</h2>
        <div className="header-controls">
          <button
            className="btn-nueva-talla"
            onClick={() => handleOpenDialog()}
          >
            <FaPlus />
            Nueva Talla
          </button>
        </div>
      </div>

      <div className="tabla-container">
        <table className="tabla-tallas">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Grupo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tallas.length === 0 ? (
              <tr>
                <td colSpan="4" className="loading">
                  No hay tallas registradas
                </td>
              </tr>
            ) : (
              tallas.map((talla, index) => (
                <tr key={talla.id ?? index}>
                  <td>{talla.nombre}</td>
                  <td>{talla.grupo?.nombre}</td>
                  <td className="estado-talla">
                    {talla.estado ? "Activo" : "Inactivo"}
                  </td>
                  <td className="celda-acciones">
                    <button
                      className="btn-editar"
                      onClick={() => handleOpenDialog(talla)}
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="btn-eliminar"
                      onClick={() => handleDeleteClick(talla)}
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Crear/Editar */}
      {openDialog && (
        <div className="dialog-talla-modal">
          <div className="form-talla-modal">
            <h3>{editingTalla ? "Editar Talla" : "Nueva Talla"}</h3>
            {error && <div className="text-danger mb-2">{error}</div>}

            <label className="form-label">Nombre *</label>
            <input
              className="form-control mb-2"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              maxLength={10}
            />
            <small className="text-muted mb-2 d-block">
              {formData.nombre.length}/10 caracteres
            </small>

            <label className="form-label">Grupo de Talla *</label>
            <select
              className="form-select mb-2"
              name="grupo_id"
              value={formData.grupo_id}
              onChange={handleInputChange}
            >
              <option value="">Seleccione un grupo</option>
              {gruposTalla.map((g, idx) => (
                <option key={g.id ?? idx} value={g.id ?? g.idGrupoTalla}>
                  {g.nombre}
                </option>
              ))}
            </select>

            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                name="estado"
                checked={formData.estado}
                onChange={handleInputChange}
              />
              <label className="form-check-label">Activo</label>
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button className="btn btn-secondary" onClick={handleCloseDialog}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleSubmit}>
                {editingTalla ? "Actualizar" : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal eliminar */}
      {openDeleteDialog && (
        <div className="dialog-talla-modal">
          <div className="form-talla-modal text-center">
            <p>
              ¿Seguro que quieres eliminar la talla "{tallaToDelete?.nombre}"?
            </p>
            <div className="d-flex justify-content-center gap-2 mt-3">
              <button
                className="btn btn-secondary"
                onClick={() => setOpenDeleteDialog(false)}
              >
                Cancelar
              </button>
              <button className="btn btn-eliminar" onClick={confirmDelete}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tallas;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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

export const Tallas = () => {
  const navigate = useNavigate();

  const [tallas, setTallas] = useState([]);
  const [gruposTalla, setGruposTalla] = useState([]);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingTalla, setEditingTalla] = useState(null);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingGrupos, setLoadingGrupos] = useState(true);

  // ---- estados para eliminar ----
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [tallaToDelete, setTallaToDelete] = useState(null);

  const [formData, setFormData] = useState({
    nombre: '',
    grupo_id: '',
    estado: true,
  });

  // ---------------- Helpers ----------------
  const handleError = (error) => {
    const errorMessage = error?.response?.data?.detail || 'Error al realizar la operación';
    setError(errorMessage);
    toast.error(errorMessage);
  };

  const validateForm = () => {
    if (!formData.nombre.trim()) {
      setError('El nombre es requerido');
      return false;
    }
    if (formData.nombre.length > 10) {
      setError('El nombre no puede tener más de 10 caracteres');
      return false;
    }
    if (!formData.grupo_id) {
      setError('Debe seleccionar un grupo de talla');
      return false;
    }
    return true;
  };

  // --------------- Cargas -------------------
  const cargarTallas = async () => {
    try {
      setLoading(true);
      const response = await getAllTallas();
      setTallas(response.data || []);
    } catch (err) {
      handleError(err);
      setTallas([]);
    } finally {
      setLoading(false);
    }
  };

  const cargarGruposTalla = async () => {
    try {
      setLoadingGrupos(true);
      const response = await getAllGruposTalla();
      setGruposTalla(response.data || []);
    } catch (err) {
      handleError(err);
      setGruposTalla([]);
    } finally {
      setLoadingGrupos(false);
    }
  };

  useEffect(() => {
    cargarTallas();
    cargarGruposTalla();
  }, []);

  // --------------- Dialog Crear/Editar ---------------
  const handleOpenDialog = (talla = null) => {
    setError('');
    if (talla) {
      setEditingTalla(talla);
      setFormData({
        nombre: talla.nombre ?? '',
        grupo_id: talla.grupo?.idGrupoTalla ?? talla.grupo?.id ?? '',
        estado: !!talla.estado,
      });
    } else {
      setEditingTalla(null);
      setFormData({ nombre: '', grupo_id: '', estado: true });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTalla(null);
    setError('');
    setFormData({ nombre: '', grupo_id: '', estado: true });
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
    if (!validateForm()) return;

    try {
      if (editingTalla) {
        await updateTalla(editingTalla.id ?? editingTalla.idTalla ?? editingTalla.id_talla, formData);
        toast.success('Talla actualizada exitosamente');
      } else {
        await createTalla(formData);
        toast.success('Talla creada exitosamente');
      }
      handleCloseDialog();
      cargarTallas();
    } catch (err) {
      handleError(err);
    }
  };

  // --------------- Eliminar ---------------
  const handleDeleteClick = (talla) => {
    setTallaToDelete(talla);
    setOpenDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!tallaToDelete) return;
    try {
      const id = tallaToDelete.id ?? tallaToDelete.idTalla ?? tallaToDelete.id_talla;
      await deleteTalla(id);
      toast.success('Talla eliminada exitosamente');
      setOpenDeleteDialog(false);
      setTallaToDelete(null);
      cargarTallas();
    } catch (err) {
      handleError(err);
    }
  };

  // --------------- Estado ---------------
  const handleEstadoChange = async (id, estado) => {
    try {
      await cambiarEstadoTalla(id, !estado);
      toast.success('Estado de la talla actualizado exitosamente');
      cargarTallas();
    } catch (err) {
      handleError(err);
    }
  };

  // --------------- Render ----------------
  return (
    <div className="lista-tallas-container">
      <div className="header-acciones">
        <h2>Gestión de Tallas</h2>
        <div className="header-controls">
          <button className="btn-nueva-talla" onClick={() => handleOpenDialog()}>
            <FaPlus /> Nueva Talla
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
            {loading ? (
              <tr><td colSpan="4" className="loading">Cargando...</td></tr>
            ) : tallas.length === 0 ? (
              <tr><td colSpan="4" className="loading">No hay tallas registradas</td></tr>
            ) : (
              tallas.map((talla, index) => {
                const id = talla.id ?? talla.idTalla ?? talla.id_talla ?? index;
                return (
                  <tr key={id}>
                    <td>{talla.nombre}</td>
                    <td>{talla.grupo?.nombre ?? '-'}</td>
                    <td className="estado-talla">
                      <button
                        className={`chip-estado ${talla.estado ? 'on' : 'off'}`}
                        onClick={() => handleEstadoChange(id, talla.estado)}
                        title="Cambiar estado"
                      >
                        {talla.estado ? "Activo" : "Inactivo"}
                      </button>
                    </td>
                    <td className="celda-acciones">
                      <button className="btn-editar" onClick={() => handleOpenDialog(talla)}>
                        <FaEdit />
                      </button>
                      <button className="btn-eliminar" onClick={() => handleDeleteClick(talla)}>
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                );
              })
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
              required
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
              required
            >
              <option value="">Seleccione un grupo</option>
              {loadingGrupos ? (
                <option disabled>Cargando grupos...</option>
              ) : (
                gruposTalla.map((g, idx) => (
                  <option key={g.id ?? g.idGrupoTalla ?? idx} value={g.id ?? g.idGrupoTalla}>
                    {g.nombre}
                  </option>
                ))
              )}
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
            <p>¿Seguro que quieres eliminar la talla "{tallaToDelete?.nombre}"?</p>
            <div className="d-flex justify-content-center gap-2 mt-3">
              <button className="btn btn-secondary" onClick={() => setOpenDeleteDialog(false)}>
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

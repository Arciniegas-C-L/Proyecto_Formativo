import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAllGruposTalla,
  createGrupoTalla,
  updateGrupoTalla,
  deleteGrupoTalla,
} from "../../api/GrupoTalla.api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../assets/css/Tallas/GrupoTalla.css";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";

const GrupoTalla = () => {
  const navigate = useNavigate();
  const [gruposTalla, setGruposTalla] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingGrupo, setEditingGrupo] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ nombre: "", descripcion: "" });
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [deleteGrupoId, setDeleteGrupoId] = useState(null);

  useEffect(() => {
    cargarGruposTalla();
  }, []);

  const handleError = (error) => {
    const errorMessage =
      error.response?.data?.detail || "Error al realizar la operación";
    setError(errorMessage);
    toast.error(errorMessage);
  };

  const cargarGruposTalla = async () => {
    try {
      setLoading(true);
      const response = await getAllGruposTalla();
      setGruposTalla(response.data || []);
    } catch (error) {
      handleError(error);
      setGruposTalla([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (grupo = null) => {
    setError("");
    if (grupo) {
      setEditingGrupo(grupo);
      setFormData({
        nombre: grupo.nombre,
        descripcion: grupo.descripcion || "",
      });
    } else {
      setEditingGrupo(null);
      setFormData({ nombre: "", descripcion: "" });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingGrupo(null);
    setError("");
    setFormData({ nombre: "", descripcion: "" });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError("");
  };

  const validateForm = () => {
    if (!formData.nombre.trim()) {
      setError("El nombre es requerido");
      return false;
    }
    if (formData.nombre.length > 45) {
      setError("El nombre no puede tener más de 45 caracteres");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (editingGrupo) {
        await updateGrupoTalla(editingGrupo.idGrupoTalla, formData);
        toast.success("Grupo de talla actualizado exitosamente");
      } else {
        await createGrupoTalla(formData);
        toast.success("Grupo de talla creado exitosamente");
      }
      handleCloseDialog();
      cargarGruposTalla();
    } catch (error) {
      handleError(error);
    }
  };

  const handleDeleteModalOpen = (id) => {
    setDeleteGrupoId(id);
    setOpenDeleteModal(true);
  };

  const handleDeleteModalClose = () => {
    setDeleteGrupoId(null);
    setOpenDeleteModal(false);
  };

  const handleDelete = async () => {
    try {
      await deleteGrupoTalla(deleteGrupoId);
      toast.success("Grupo de talla eliminado exitosamente");
      cargarGruposTalla();
    } catch (error) {
      handleError(error);
    } finally {
      handleDeleteModalClose();
    }
  };

  const handleAsignarTallas = (grupo) => {
    // Pasamos el id del grupo al estado de navegación
    navigate("/tallas", { state: { grupoId: grupo.idGrupoTalla } });
  };

  return (
    <div className="grupo-talla-container">
      {/* HEADER */}
      <div className="grupo-header">
        <h2>Gestión de Grupos de Talla</h2>
        <button className="btn-grupo-nuevo" onClick={() => handleOpenDialog()}>
          <FaPlus /> Nuevo Grupo
        </button>
      </div>

      {/* TABLA PRINCIPAL */}
      <div className="grupo-tabla-container">
        {loading ? (
          <div className="loading">Cargando...</div>
        ) : gruposTalla.length === 0 ? (
          <div className="loading">No hay grupos de talla registrados</div>
        ) : (
          <table className="grupo-tabla">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Tallas</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {gruposTalla.map((grupo) => (
                <tr key={grupo.idGrupoTalla}>
                  <td>{grupo.nombre}</td>
                  <td>{grupo.descripcion || "-"}</td>
                  <td>
                    {(grupo.Tallas || []).map((talla) => (
                      <span key={talla.id} className="chip-talla">
                        {talla.nombre}
                      </span>
                    ))}
                  </td>
                  <td className="acciones-grupo">
                    <button
                      className="btn-grupo-editar"
                      onClick={() => handleOpenDialog(grupo)}
                    >
                      <FaEdit />
                    </button>

                    {/* BOTÓN PARA ASIGNAR TALLAS */}
                    <button
                      className="btn-grupo-asignar"
                      onClick={() => handleAsignarTallas(grupo)}
                    >
                      Asignar
                    </button>

                    <button
                      className="btn-grupo-eliminar"
                      onClick={() => handleDeleteModalOpen(grupo.idGrupoTalla)}
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL CREAR / EDITAR */}
      {openDialog && (
        <div className="grupo-modal">
          <div className="grupo-modal-content">
            <h3>
              {editingGrupo ? "Editar Grupo de Talla" : "Nuevo Grupo de Talla"}
            </h3>
            {error && <div className="text-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <label>Nombre *</label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                maxLength={45}
                required
              />
              <label>Descripción</label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleInputChange}
                rows="3"
              ></textarea>
              <div className="grupo-modal-buttons">
                <button
                  type="button"
                  className="btn-cancelar"
                  onClick={handleCloseDialog}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-guardar">
                  {editingGrupo ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR */}
      {openDeleteModal && (
        <div className="grupo-modal-eliminar">
          <div className="grupo-modal-eliminar-content">
            <p>¿Está seguro de eliminar este grupo de talla?</p>
            <div className="grupo-modal-eliminar-buttons">
              <button className="btn-cancelar" onClick={handleDeleteModalClose}>
                Cancelar
              </button>
              <button className="btn-eliminar" onClick={handleDelete}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GrupoTalla;

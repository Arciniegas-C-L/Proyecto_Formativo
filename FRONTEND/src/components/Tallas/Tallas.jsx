import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  getAllTallas,
  createTalla,
  updateTalla,
  deleteTalla,
  cambiarEstadoTalla,
  agregarTallaAProductosExistentes,
} from "../../api/Talla.api.js";
import { getAllGruposTalla } from "../../api/GrupoTalla.api.js";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../assets/css/Tallas/Tallas.css";
import { FaEdit, FaTrash, FaPlus, FaBoxes } from "react-icons/fa";
import { EliminarModal } from "../EliminarModal/EliminarModal.jsx";

export function Tallas() {
  const location = useLocation();
  const navigate = useNavigate();

  const [tallas, setTallas] = useState([]);
  const [gruposTalla, setGruposTalla] = useState([]);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingTalla, setEditingTalla] = useState(null);

  //  estados para eliminar (una sola vez) 
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [tallaToDelete, setTallaToDelete] = useState(null);

  //  estados para agregar talla a productos existentes 
  const [openAgregarDialog, setOpenAgregarDialog] = useState(false);
  const [tallaToAdd, setTallaToAdd] = useState(null);
  const [loadingAgregar, setLoadingAgregar] = useState(false);

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
      setTallas(res?.data || []);
    } catch {
      toast.error("Error al cargar tallas");
      setTallas([]);
    }
  };

  const cargarGruposTalla = async () => {
    try {
      const res = await getAllGruposTalla();
      setGruposTalla(res?.data || []);
    } catch {
      toast.error("Error al cargar grupos de talla");
      setGruposTalla([]);
    }
  };

  const handleOpenDialog = (talla = null) => {
    setError("");
    if (talla) {
      setEditingTalla(talla);
      setFormData({
        nombre: talla?.nombre ?? "",
        grupo_id: talla?.grupo?.id ?? talla?.grupo_id ?? "",
        estado: Boolean(talla?.estado),
      });
    } else {
      setEditingTalla(null);
      const grupoIdDesdeNavegacion = location.state?.grupoId || "";
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
      await cargarTallas();
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
    } catch (err) {
      toast.error("Error al eliminar la talla");
    }
  };

  const handleEstadoChange = async (id, estado) => {
    try {
      await cambiarEstadoTalla(id, !estado);
      toast.success('Estado de la talla actualizado exitosamente');
      cargarTallas();
    } catch (err) {
      toast.error("Error al cambiar estado");
    }
  };

  const handleAgregarAProductosClick = (talla) => {
    setTallaToAdd(talla);
    setOpenAgregarDialog(true);
  };

  const confirmAgregarAProductos = async () => {
    if (!tallaToAdd) return;
    try {
      setLoadingAgregar(true);
      const id = tallaToAdd.id ?? tallaToAdd.idTalla ?? tallaToAdd.id_talla;
      await agregarTallaAProductosExistentes(id);
      setOpenAgregarDialog(false);
      setTallaToAdd(null);
    } catch (err) {
      toast.error("Error al agregar la talla a productos existentes");
    } finally {
      setLoadingAgregar(false);
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
            <span className="btn-text-desktop">Nueva Talla</span>
          </button>
        </div>
      </div>

      {/* Vista Desktop - Tabla */}
      <div className="tabla-container desktop-view">
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
                      {talla.estado && (
                        <button 
                          className="btn-agregar-productos" 
                          onClick={() => handleAgregarAProductosClick(talla)}
                          title="Agregar a productos existentes"
                        >
                          <FaBoxes />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Vista Mobile - Cards */}
      <div className="mobile-view">
        {tallas.length === 0 ? (
          <div className="loading-mobile">
            No hay tallas registradas
          </div>
        ) : (
          <div className="tallas-cards">
            {tallas.map((talla, index) => {
              const id = talla.id ?? talla.idTalla ?? talla.id_talla ?? index;
              return (
                <div key={id} className="talla-card">
                  <div className="card-header">
                    <div className="talla-info">
                      <h3 className="talla-nombre">{talla.nombre}</h3>
                      <p className="talla-grupo">{talla.grupo?.nombre ?? '-'}</p>
                    </div>
                    <button
                      className={`chip-estado-mobile ${talla.estado ? 'on' : 'off'}`}
                      onClick={() => handleEstadoChange(id, talla.estado)}
                    >
                      {talla.estado ? "Activo" : "Inactivo"}
                    </button>
                  </div>
                  <div className="card-actions">
                    <button className="btn-card btn-editar-card" onClick={() => handleOpenDialog(talla)}>
                      <FaEdit />
                      <span>Editar</span>
                    </button>
                    <button className="btn-card btn-eliminar-card" onClick={() => handleDeleteClick(talla)}>
                      <FaTrash />
                      <span>Eliminar</span>
                    </button>
                    {talla.estado && (
                      <button 
                        className="btn-card btn-agregar-card" 
                        onClick={() => handleAgregarAProductosClick(talla)}
                      >
                        <FaBoxes />
                        <span>Agregar</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
              maxLength={20}
            />
            <small className="text-muted mb-2 d-block">
              {(formData.nombre || "").length}/10 caracteres
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
                <option key={g?.id ?? idx} value={g?.id ?? g?.idGrupoTalla}>
                  {g?.nombre}
                </option>
              ))}
            </select>

            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                name="estado"
                checked={!!formData.estado}
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

      {/* Nuevo Modal Eliminar Global */}
      <EliminarModal
        abierto={openDeleteDialog}
        mensaje={`¿Seguro que quieres eliminar la talla "${tallaToDelete?.nombre}"?`}
        onCancelar={() => setOpenDeleteDialog(false)}
        onConfirmar={confirmDelete}
      />
    </div>
  );
}
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
import { EliminarModal } from "../EliminarModal/EliminarModal.jsx";
import { FaQuestionCircle } from "react-icons/fa";
import { Modal, Button } from "react-bootstrap";
import { Link } from "react-router-dom";

// Rutas internas (por si luego quieres navegar a pantallas separadas)
const ADMIN_ROUTES = {
  GRUPOS_TALLA: '/admin/tallas/grupo',
  EDITAR_GRUPO_TALLA: (id) => `/admin/tallas/grupo/editar/${id}`,
  CREAR_GRUPO_TALLA: '/admin/tallas/grupo/crear',
  ASIGNAR_TALLAS: (id) => `/admin/tallas?grupoId=${id}`,
};

export function GrupoTalla() {
  const navigate = useNavigate();

  const [gruposTalla, setGruposTalla] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingGrupo, setEditingGrupo] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ nombre: "", descripcion: "" });
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [deleteGrupoId, setDeleteGrupoId] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false); /* para el modal del flujo en panel del admin */

  useEffect(() => {
    cargarGruposTalla();
  }, []);

  const extractErrorMessage = (err) => {
    return (
      err?.response?.data?.detail ||
      err?.response?.data?.error ||
      err?.response?.data?.message ||
      err?.message ||
      "Error al realizar la operación"
    );
  };

  const handleError = (err) => {
    const msg = extractErrorMessage(err);
    setError(msg);
    toast.error(msg);
  };

  const cargarGruposTalla = async () => {
    try {
      setLoading(true);
      const response = await getAllGruposTalla();
      setGruposTalla(response?.data || []);
    } catch (err) {
      handleError(err);
      console.error("Error:", err);
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
        nombre: grupo?.nombre ?? "",
        descripcion: grupo?.descripcion ?? "",
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
    setFormData((prev) => ({ ...prev, [name]: value }));
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
    } catch (err) {
      handleError(err);
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
    navigate(ADMIN_ROUTES.ASIGNAR_TALLAS(grupo.idGrupoTalla));
  };

  // Para usar el modal al editar:
  const handleEditar = (grupo) => {
    handleOpenDialog(grupo);
  };

  // Para usar el modal al crear:
  const handleCrear = () => {
    handleOpenDialog();
  };

  return (
    <div className="grupo-talla-container">
      <div className="grupo-header">
        <h2>Gestión de Grupos de Talla</h2>
          {/* Icono de ayuda */}
          <FaQuestionCircle
          size={22}
          style={{ cursor: "pointer", color: "#0d6efd" }}
          onClick={() => setMostrarModal(true)}
          />
        {/* Modal emergente */}
          <Modal show={mostrarModal} onHide={() => setMostrarModal(false)} centered>
            <Modal.Header closeButton>
            <Modal.Title>Próximo paso</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              En este panel de gestión de grupo tallas, asigna las
              <strong style={{ cursor: "pointer", color: "#0d6efd" }}> tallas</strong>
              correspondientes al grupo talla.
              Después de hacer esto dirígete a
              <Link to="/admin/productos/crear">
                <strong style={{ cursor: "pointer", color: "#0d6efd" }}>Crear Producto</strong>
              </Link>
            </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={() => setMostrarModal(false)}>
                  Cerrar
                  </Button>
              </Modal.Footer>
          </Modal>
        <button className="btn-grupo-nuevo" onClick={handleCrear}>
          <FaPlus /> Nuevo Grupo
        </button>
      </div>

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
                    {(grupo.tallas || grupo.Tallas || []).map((talla, index) => (
                      <span
                        key={talla?.idTalla ?? talla?.id ?? index}
                        className="chip-talla"
                      >
                        {talla?.nombre ?? "-"}
                      </span>
                    ))}
                  </td>
                  <td className="acciones-grupo">
                    <button
                      className="btn-grupo-editar"
                      onClick={() => handleEditar(grupo)}
                    >
                      <FaEdit />
                    </button>

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
            <h3>{editingGrupo ? "Editar Grupo de Talla" : "Nuevo Grupo de Talla"}</h3>
            {error && <div className="text-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <label>Nombre *</label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                maxLength={20}
                required
              />

              <label>Descripción</label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleInputChange}
                rows={3}
              />

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

      {/* Modal global de eliminar */}
      <EliminarModal
        abierto={openDeleteModal}
        mensaje={"¿Está seguro de eliminar este grupo de talla?"}
        onCancelar={handleDeleteModalClose}
        onConfirmar={handleDelete}
      />
    </div>
  );
}

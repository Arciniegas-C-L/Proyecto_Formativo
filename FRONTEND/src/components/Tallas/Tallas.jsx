import React, { useState, useEffect } from 'react';
import { getAllTallas, createTalla, updateTalla, deleteTalla } from '../../api/Talla.api';
import { getAllGruposTalla } from '../../api/GrupoTalla.api';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Modal, Button, Form, Table, Alert, Pagination } from 'react-bootstrap';

export function Tallas() {
  const [tallas, setTallas] = useState([]);
  const [gruposTalla, setGruposTalla] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTalla, setEditingTalla] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ nombre: '', grupo_id: '' });

  const [currentPage, setCurrentPage] = useState(1);
  const tallasPerPage = 10;

  useEffect(() => {
    cargarTallas();
    cargarGruposTalla();
  }, []);

  const handleError = (error) => {
    const errorMessage = error.response?.data?.detail || 'Error al realizar la operación';
    setError(errorMessage);
    toast.error(errorMessage);
  };

  const cargarTallas = async () => {
    try {
      setLoading(true);
      const response = await getAllTallas();
      setTallas(response.data || []);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const cargarGruposTalla = async () => {
    try {
      const response = await getAllGruposTalla();
      setGruposTalla(response.data || []);
    } catch (error) {
      handleError(error);
    }
  };

  const handleOpenModal = (talla = null) => {
    setError('');
    if (talla) {
      setEditingTalla(talla);
      setFormData({ nombre: talla.nombre, grupo_id: talla.grupo.idGrupoTalla });
    } else {
      setEditingTalla(null);
      setFormData({ nombre: '', grupo_id: '' });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTalla(null);
    setFormData({ nombre: '', grupo_id: '' });
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validateForm = () => {
    if (!formData.nombre.trim()) return setError('El nombre es requerido');
    if (!formData.grupo_id) return setError('Debe seleccionar un grupo de talla');
    if (formData.nombre.length > 10) return setError('El nombre no puede tener más de 10 caracteres');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      if (editingTalla) {
        await updateTalla(editingTalla.id, formData);
        toast.success('Talla actualizada exitosamente');
      } else {
        await createTalla(formData);
        toast.success('Talla creada exitosamente');
      }
      handleCloseModal();
      cargarTallas();
    } catch (error) {
      handleError(error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de eliminar esta talla?')) {
      try {
        await deleteTalla(id);
        toast.success('Talla eliminada exitosamente');
        cargarTallas();
      } catch (error) {
        handleError(error);
      }
    }
  };

  const indexOfLast = currentPage * tallasPerPage;
  const indexOfFirst = indexOfLast - tallasPerPage;
  const currentTallas = tallas.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(tallas.length / tallasPerPage);

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>Gestión de Tallas</h3>
        <Button variant="primary" onClick={() => handleOpenModal()}>Nueva Talla</Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Table striped bordered hover responsive>
        <thead className="table-dark">
          <tr>
            <th>Nombre</th>
            <th>Grupo de Talla</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan="3" className="text-center">Cargando tallas...</td></tr>
          ) : currentTallas.length === 0 ? (
            <tr><td colSpan="3" className="text-center">No hay tallas</td></tr>
          ) : (
            currentTallas.map((talla) => (
              <tr key={talla.id}>
                <td>{talla.nombre}</td>
                <td>{talla.grupo.nombre}</td>
                <td>
                  <Button size="sm" variant="warning" className="me-2" onClick={() => handleOpenModal(talla)}>Editar</Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(talla.id)}>Eliminar</Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>

      {totalPages > 1 && (
        <Pagination className="justify-content-center">
          {[...Array(totalPages)].map((_, idx) => (
            <Pagination.Item
              key={idx + 1}
              active={idx + 1 === currentPage}
              onClick={() => setCurrentPage(idx + 1)}
            >
              {idx + 1}
            </Pagination.Item>
          ))}
        </Pagination>
      )}

      <Modal show={showModal} onHide={handleCloseModal} backdrop="static">
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>{editingTalla ? 'Editar Talla' : 'Nueva Talla'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}

            <Form.Group controlId="formNombre">
              <Form.Label>Nombre</Form.Label>
              <Form.Control
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                required
                maxLength={10}
              />
              <Form.Text muted>{formData.nombre.length}/10 caracteres</Form.Text>
            </Form.Group>

            <Form.Group className="mt-3" controlId="formGrupoTalla">
              <Form.Label>Grupo de Talla</Form.Label>
              <Form.Select
                name="grupo_id"
                value={formData.grupo_id}
                onChange={handleInputChange}
                required
              >
                <option value="">Selecciona un grupo</option>
                {gruposTalla.map((grupo) => (
                  <option key={grupo.idGrupoTalla} value={grupo.idGrupoTalla}>{grupo.nombre}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>Cancelar</Button>
            <Button type="submit" variant="primary">{editingTalla ? 'Actualizar' : 'Crear'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

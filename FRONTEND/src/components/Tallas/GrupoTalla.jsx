import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Typography, Alert, Chip, Stack,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import {
  getAllGruposTalla,
  createGrupoTalla,
  updateGrupoTalla,
  deleteGrupoTalla,
} from '../../api/GrupoTalla.api';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export const GrupoTalla = () => {
  const navigate = useNavigate();

  const [gruposTalla, setGruposTalla] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingGrupo, setEditingGrupo] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ nombre: '', descripcion: '' });

  // Modal eliminar
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    cargarGruposTalla();
  }, []);

  // Maneja errores y muestra mensaje en pantalla
  const handleError = (error) => {
    const errorMessage =
      error?.response?.data?.detail ||
      error?.response?.data?.message ||
      'Error al realizar la operación';
    setError(errorMessage);
    toast.error(errorMessage);
  };

  // Trae todos los grupos de talla desde la API
  const cargarGruposTalla = async () => {
    try {
      setLoading(true);
      const response = await getAllGruposTalla();
      setGruposTalla(response?.data || []);
    } catch (err) {
      handleError(err);
      console.error('Error:', err);
      setGruposTalla([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (grupo = null) => {
    setError('');
    if (grupo) {
      setEditingGrupo(grupo);
      setFormData({
        nombre: grupo.nombre ?? '',
        descripcion: grupo.descripcion ?? '',
      });
    } else {
      setEditingGrupo(null);
      setFormData({ nombre: '', descripcion: '' });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingGrupo(null);
    setError('');
    setFormData({ nombre: '', descripcion: '' });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  // Valida los datos del formulario antes de enviar
  const validateForm = () => {
    if (!formData.nombre.trim()) {
      setError('El nombre es requerido');
      return false;
    }
    if (formData.nombre.length > 45) {
      setError('El nombre no puede tener más de 45 caracteres');
      return false;
    }
    return true;
  };

  // Envía el formulario para crear o actualizar un grupo
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (editingGrupo) {
        await updateGrupoTalla(editingGrupo.idGrupoTalla, formData);
        toast.success('Grupo de talla actualizado exitosamente');
      } else {
        await createGrupoTalla(formData);
        toast.success('Grupo de talla creado exitosamente');
      }
      handleCloseDialog();
      cargarGruposTalla();
    } catch (err) {
      handleError(err);
    }
  };

  // Abrir/Cerrar modal eliminar
  const handleDeleteModalOpen = (id) => {
    setDeleteId(id);
    setOpenDeleteModal(true);
  };
  const handleDeleteModalClose = () => {
    setOpenDeleteModal(false);
    setDeleteId(null);
  };

  // Elimina un grupo (confirmado en modal)
  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteGrupoTalla(deleteId);
      toast.success('Grupo de talla eliminado exitosamente');
      handleDeleteModalClose();
      cargarGruposTalla();
    } catch (err) {
      handleError(err);
    }
  };

  const handleAsignarTallas = (grupo) => {
    // Redirigir a la página de tallas
    navigate('/tallas');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Gestión de Grupos de Talla
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleOpenDialog()}
        >
          Nuevo Grupo de Talla
        </Button>
      </Box>

      <TableContainer component={Paper}>
        {loading ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography>Cargando grupos de talla...</Typography>
          </Box>
        ) : error ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        ) : !gruposTalla || gruposTalla.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography>No hay grupos de talla disponibles</Typography>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell>Tallas Asociadas</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {gruposTalla.map((grupo) => (
                <TableRow key={grupo.idGrupoTalla}>
                  <TableCell>{grupo.nombre}</TableCell>
                  <TableCell>{grupo.descripcion || '-'}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {(grupo.Tallas || []).map((talla) => (
                        <Chip
                          key={talla.id ?? `${talla.nombre}-${talla.valor ?? ''}`}
                          label={talla.nombre}
                          size="small"
                          color="primary"
                        />
                      ))}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      color="primary"
                      onClick={() => handleOpenDialog(grupo)}
                      title="Editar"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="secondary"
                      onClick={() => handleAsignarTallas(grupo)}
                      title="Asignar Tallas"
                    >
                      <AddIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteModalOpen(grupo.idGrupoTalla)}
                      title="Eliminar"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {/* MODAL CREAR / EDITAR */}
      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>
          {editingGrupo ? 'Editar Grupo de Talla' : 'Nuevo Grupo de Talla'}
        </DialogTitle>
        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
            <TextField
              label="Nombre *"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              inputProps={{ maxLength: 45 }}
              fullWidth
              required
              margin="normal"
            />
            <TextField
              label="Descripción"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleInputChange}
              fullWidth
              multiline
              rows={3}
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {editingGrupo ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* MODAL ELIMINAR */}
      <Dialog open={openDeleteModal} onClose={handleDeleteModalClose}>
        <DialogTitle>Eliminar Grupo de Talla</DialogTitle>
        <DialogContent dividers>
          <Typography>¿Está seguro de eliminar este grupo de talla?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteModalClose}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GrupoTalla;

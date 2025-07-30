import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import {
  getAllTallas,
  createTalla,
  updateTalla,
  deleteTalla,
  cambiarEstadoTalla,
} from '../api/Talla.api';
import { getAllGruposTalla } from '../api/GrupoTalla.api';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export const Tallas = () => {
  const navigate = useNavigate();
  const [tallas, setTallas] = useState([]);
  const [gruposTalla, setGruposTalla] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTalla, setEditingTalla] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingGrupos, setLoadingGrupos] = useState(true);
  const [formData, setFormData] = useState({
    nombre: '',
    grupo_id: '',
    estado: true,
  });

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
    } catch (error) {
      handleError(error);
      setGruposTalla([]);
    } finally {
      setLoadingGrupos(false);
    }
  };

  const handleOpenDialog = (talla = null) => {
    setError('');
    if (talla) {
      setEditingTalla(talla);
      setFormData({
        nombre: talla.nombre,
        grupo_id: talla.grupo.idGrupoTalla,
        estado: talla.estado,
      });
    } else {
      setEditingTalla(null);
      setFormData({
        nombre: '',
        grupo_id: '',
        estado: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTalla(null);
    setError('');
    setFormData({
      nombre: '',
      grupo_id: '',
      estado: true,
    });
  };

  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'estado' ? checked : value,
    });
    setError('');
  };

  const validateForm = () => {
    if (!formData.nombre.trim()) {
      setError('El nombre es requerido');
      return false;
    }
    if (!formData.grupo_id) {
      setError('Debe seleccionar un grupo de talla');
      return false;
    }
    if (formData.nombre.length > 10) {
      setError('El nombre no puede tener más de 10 caracteres');
      return false;
    }
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
      handleCloseDialog();
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

  const handleEstadoChange = async (id, estado) => {
    try {
      await cambiarEstadoTalla(id, !estado);
      toast.success('Estado de la talla actualizado exitosamente');
      cargarTallas();
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Gestión de Tallas
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleOpenDialog()}
        >
          Nueva Talla
        </Button>
      </Box>

      <TableContainer component={Paper}>
        {loading ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography>Cargando tallas...</Typography>
          </Box>
        ) : error ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        ) : !tallas || tallas.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography>No hay tallas disponibles</Typography>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Grupo de Talla</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tallas.map((talla) => (
                <TableRow key={talla.id}>
                  <TableCell>{talla.nombre}</TableCell>
                  <TableCell>{talla.grupo.nombre}</TableCell>
                  <TableCell>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={talla.estado}
                          onChange={() => handleEstadoChange(talla.id, talla.estado)}
                          color="primary"
                        />
                      }
                      label={talla.estado ? 'Activo' : 'Inactivo'}
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      color="primary"
                      onClick={() => handleOpenDialog(talla)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDelete(talla.id)}
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

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingTalla ? 'Editar Talla' : 'Nueva Talla'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <TextField
              fullWidth
              label="Nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              margin="normal"
              required
              inputProps={{ maxLength: 10 }}
              helperText={`${formData.nombre.length}/10 caracteres`}
            />
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Grupo de Talla</InputLabel>
              <Select
                name="grupo_id"
                value={formData.grupo_id}
                onChange={handleInputChange}
                label="Grupo de Talla"
                disabled={loadingGrupos}
              >
                {loadingGrupos ? (
                  <MenuItem disabled>Cargando grupos...</MenuItem>
                ) : !gruposTalla || gruposTalla.length === 0 ? (
                  <MenuItem disabled>No hay grupos disponibles</MenuItem>
                ) : (
                  gruposTalla.map((grupo) => (
                    <MenuItem key={grupo.idGrupoTalla} value={grupo.idGrupoTalla}>
                      {grupo.nombre}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.estado}
                  onChange={handleInputChange}
                  name="estado"
                  color="primary"
                />
              }
              label="Activo"
              margin="normal"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button type="submit" variant="contained" color="primary">
              {editingTalla ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Tallas;
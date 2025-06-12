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
  Switch,
  FormControlLabel,
  Alert,
  Chip,
  Stack,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import {
  getAllGruposTalla,
  createGrupoTalla,
  updateGrupoTalla,
  deleteGrupoTalla,
  cambiarEstadoGrupoTalla,
} from '../api/GrupoTalla.api';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export const GrupoTalla = () => {
  const navigate = useNavigate();
  const [gruposTalla, setGruposTalla] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingGrupo, setEditingGrupo] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    estado: true,
  });

  useEffect(() => {
    cargarGruposTalla();
  }, []);

  const handleError = (error) => {
    const errorMessage = error.response?.data?.detail || 'Error al realizar la operación';
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
      console.error('Error:', error);
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
        nombre: grupo.nombre,
        descripcion: grupo.descripcion || '',
        estado: grupo.estado,
      });
    } else {
      setEditingGrupo(null);
      setFormData({
        nombre: '',
        descripcion: '',
        estado: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingGrupo(null);
    setError('');
    setFormData({
      nombre: '',
      descripcion: '',
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
    if (formData.nombre.length > 45) {
      setError('El nombre no puede tener más de 45 caracteres');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (editingGrupo) {
        await updateGrupoTalla(editingGrupo.id, formData);
        toast.success('Grupo de talla actualizado exitosamente');
      } else {
        await createGrupoTalla(formData);
        toast.success('Grupo de talla creado exitosamente');
      }
      handleCloseDialog();
      cargarGruposTalla();
    } catch (error) {
      handleError(error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de eliminar este grupo de talla?')) {
      try {
        await deleteGrupoTalla(id);
        toast.success('Grupo de talla eliminado exitosamente');
        cargarGruposTalla();
      } catch (error) {
        handleError(error);
      }
    }
  };

  const handleEstadoChange = async (id, estado) => {
    try {
      await cambiarEstadoGrupoTalla(id, !estado);
      toast.success('Estado del grupo de talla actualizado exitosamente');
      cargarGruposTalla();
    } catch (error) {
      handleError(error);
    }
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
                <TableCell>Estado</TableCell>
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
                      {(grupo.Tallas  || []).map((talla) => (
                        <Chip
                          key={talla.id}
                          label={talla.nombre}
                          size="small"
                          color={talla.estado ? "primary" : "default"}
                        />
                      ))}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={grupo.estado}
                          onChange={(e) => handleEstadoChange(grupo.idGrupoTalla, grupo.estado)}
                          name="estado"
                          color="primary"
                        />
                      }
                      label={grupo.estado ? 'Activo' : 'Inactivo'}
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      color="primary"
                      onClick={() => handleOpenDialog(grupo)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDelete(grupo.idGrupoTalla)}
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
          {editingGrupo ? 'Editar Grupo de Talla' : 'Nuevo Grupo de Talla'}
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
              inputProps={{ maxLength: 45 }}
              helperText={`${formData.nombre.length}/45 caracteres`}
            />
            <TextField
              fullWidth
              label="Descripción"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleInputChange}
              margin="normal"
              multiline
              rows={3}
            />
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
              {editingGrupo ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default GrupoTalla;

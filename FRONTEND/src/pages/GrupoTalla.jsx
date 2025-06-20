import React, { useEffect, useState } from 'react';
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  TextField, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, IconButton, Typography, Alert, Stack, Chip, Pagination
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import {
  getGruposTallaPaginados,
  createGrupoTalla,
  updateGrupoTalla,
  deleteGrupoTalla
} from '../api/GrupoTalla.api';
import { toast } from 'react-toastify';

const GrupoTalla = () => {
  const [gruposTalla, setGruposTalla] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingGrupo, setEditingGrupo] = useState(null);
  const [formData, setFormData] = useState({ nombre: '', descripcion: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Paginación
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 5;

  useEffect(() => {
    cargarGruposTalla(page);
  }, [page]);

  const cargarGruposTalla = async (pagina) => {
    try {
      setLoading(true);
      const { resultados, count } = await getGruposTallaPaginados(pagina, pageSize);
      setGruposTalla(resultados);
      setTotalCount(count);
    } catch (err) {
      toast.error('Error al cargar los grupos de talla');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (grupo = null) => {
    setError('');
    setEditingGrupo(grupo);
    setFormData(grupo ? {
      nombre: grupo.nombre,
      descripcion: grupo.descripcion || ''
    } : { nombre: '', descripcion: '' });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingGrupo(null);
    setFormData({ nombre: '', descripcion: '' });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.nombre.trim()) {
      return setError('El nombre es requerido');
    }
    if (formData.nombre.length > 45) {
      return setError('Máximo 45 caracteres');
    }

    try {
      if (editingGrupo) {
        await updateGrupoTalla(editingGrupo.idGrupoTalla, formData);
        toast.success('Actualizado correctamente');
      } else {
        await createGrupoTalla(formData);
        toast.success('Creado correctamente');
      }
      handleCloseDialog();
      cargarGruposTalla(page);
    } catch (err) {
      setError('Ocurrió un error al guardar');
      toast.error('Error al guardar el grupo');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Desea eliminar este grupo?')) return;
    try {
      await deleteGrupoTalla(id);
      toast.success('Eliminado correctamente');
      cargarGruposTalla(page);
    } catch (err) {
      toast.error('Error al eliminar');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Gestión de Grupos de Talla</Typography>
        <Button variant="contained" color="primary" onClick={() => handleOpenDialog()}>
          Nuevo Grupo
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell>Tallas</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4}>Cargando...</TableCell>
              </TableRow>
            ) : gruposTalla.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4}>No hay grupos disponibles</TableCell>
              </TableRow>
            ) : (
              gruposTalla.map((grupo) => (
                <TableRow key={grupo.idGrupoTalla}>
                  <TableCell>{grupo.nombre}</TableCell>
                  <TableCell>{grupo.descripcion || '-'}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {(grupo.Tallas || []).map((talla) => (
                        <Chip key={talla.id} label={talla.nombre} size="small" />
                      ))}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleOpenDialog(grupo)} title="Editar">
                      <Edit />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(grupo.idGrupoTalla)} title="Eliminar">
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Paginación */}
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
        <Pagination
          count={Math.ceil(totalCount / pageSize)}
          page={page}
          onChange={(e, value) => setPage(value)}
          color="primary"
        />
      </Box>

      {/* Diálogo para Crear/Editar */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{editingGrupo ? 'Editar' : 'Nuevo'} Grupo</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <TextField
              fullWidth
              label="Nombre"
              name="nombre"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              required
              inputProps={{ maxLength: 45 }}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Descripción"
              name="descripcion"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              margin="normal"
              multiline
              rows={3}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button type="submit" variant="contained">Guardar</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default GrupoTalla;

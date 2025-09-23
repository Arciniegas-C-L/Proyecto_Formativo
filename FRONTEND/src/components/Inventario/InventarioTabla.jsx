import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Breadcrumbs,
  Link,
  Typography,
  Box,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Stack,
  Alert,
  FormHelperText,
  Snackbar
} from "@mui/material";
import {
  NavigateNext as NavigateNextIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Home as HomeIcon,
  ImageNotSupported as ImageNotSupportedIcon,
  Save as SaveIcon,
  Warning as WarningIcon,
  Add as AddIcon
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import {
  getTablaCategorias,
  getTablaSubcategorias,
  getTablaProductos,
  actualizarStockTallas
} from "../../api/InventarioApi";
import { updateGrupoTalla, asignarGrupoTallaDefault } from "../../api/Subcategoria.api";
import { getAllGruposTalla } from "../../api/GrupoTalla.api";



const InventarioTabla = () => {
  const [selectedCategoria, setSelectedCategoria] = useState(null);
  const [selectedSubcategoria, setSelectedSubcategoria] = useState(null);
  const [gruposTalla, setGruposTalla] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState("categorias"); // categorias, subcategorias, productos
  const [currentData, setCurrentData] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [openStockDialog, setOpenStockDialog] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState(null);
  const [stockForm, setStockForm] = useState({});
  const [stockMinimoForm, setStockMinimoForm] = useState({});
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info' // 'error', 'warning', 'info', 'success'
  });
  const navigate = useNavigate();
  const [openNoCategoriasDialog, setOpenNoCategoriasDialog] = useState(false);
  const [contador, setContador] = useState(10);
  const [openNoGrupoTallaDialog, setOpenNoGrupoTallaDialog] = useState(false);
  const [contadorGrupoTalla, setContadorGrupoTalla] = useState(5);

  // Cargar categorías y grupos de talla al montar el componente
  useEffect(() => {
    const inicializar = async () => {
      try {
        setLoading(true);
        
        // Primero asignar grupo de tallas por defecto a las subcategorías que no lo tienen
        try {
          await asignarGrupoTallaDefault();
        } catch (error) {
          console.error('Error al asignar grupo de tallas por defecto:', error);
          // Continuar con la carga aunque falle la asignación por defecto
        }
        
        // Primero cargar grupos de talla, luego categorías
        await cargarGruposTalla();
        await cargarCategorias();
        
      } catch (error) {
        console.error('Error al inicializar:', error);
        showSnackbar('Error al inicializar el componente', 'error');
      } finally {
        setLoading(false);
      }
    };
    inicializar();
  }, []); // Solo se ejecuta al montar el componente

  // useEffect para el contador de redirección
  useEffect(() => {
    let interval;
    if (openNoCategoriasDialog && contador > 0) {
      interval = setInterval(() => {
        setContador(prev => {
          if (prev <= 1) {
            navigate('/categorias');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [openNoCategoriasDialog, contador, navigate]);

  // useEffect para el contador de redirección de grupos de talla
  useEffect(() => {
    let interval;
    if (openNoGrupoTallaDialog && contadorGrupoTalla > 0) {
      interval = setInterval(() => {
        setContadorGrupoTalla(prev => {
          if (prev <= 1) {
            navigate('/grupo-talla');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [openNoGrupoTallaDialog, contadorGrupoTalla, navigate]);

  const cargarCategorias = async () => {
    try {
      setLoading(true);
      const data = await getTablaCategorias();
      
      // Verificar si no hay categorías
      if (!data || !data.datos || data.datos.length === 0) {
        setOpenNoCategoriasDialog(true);
        return;
      }
      
      setCurrentData(data);
      setCurrentView("categorias");
      setBreadcrumbs([{ text: "Categorías", active: true }]);
      setSelectedCategoria(null);
      setSelectedSubcategoria(null);
    } catch (error) {
      console.error("Error al cargar las categorías:", error);
      showSnackbar("Error al cargar las categorías", "error");
    } finally {
      setLoading(false);
    }
  };

  const cargarSubcategorias = async (categoriaId, categoriaNombre) => {
    try {
      setLoading(true);
      
      const data = await getTablaSubcategorias(categoriaId);
      
      // Verificar si hay grupos de talla disponibles en el sistema
      if (!gruposTalla || gruposTalla.length === 0) {
        setOpenNoGrupoTallaDialog(true);
        return;
      }
      
      // Verificar si hay subcategorías
      if (!data.datos || data.datos.length === 0) {
        showSnackbar(`No hay subcategorías en la categoría "${categoriaNombre}"`, 'info');
        return;
      }
      
      setCurrentData(data);
      setCurrentView("subcategorias");
      setSelectedCategoria({ id: categoriaId, nombre: categoriaNombre });
      setBreadcrumbs([
        { text: "Categorías", active: false, onClick: cargarCategorias },
        { text: categoriaNombre, active: true }
      ]);
      setSelectedSubcategoria(null);
    } catch (error) {
      console.error("Error al cargar las subcategorías:", error);
      showSnackbar("Error al cargar las subcategorías", "error");
    } finally {
      setLoading(false);
    }
  };

  const cargarProductos = async (subcategoriaId, subcategoriaNombre) => {
    try {
      setLoading(true);
      const data = await getTablaProductos(subcategoriaId);
      
      // Verificar si hay productos
      if (!data.datos || data.datos.length === 0) {
        showSnackbar(`No hay productos en la subcategoría "${subcategoriaNombre}"`, 'info');
        return;
      }
      
      setCurrentData(data);
      setCurrentView("productos");
      setSelectedSubcategoria({ id: subcategoriaId, nombre: subcategoriaNombre });
      setBreadcrumbs([
        { text: "Categorías", active: false, onClick: cargarCategorias },
        { 
          text: selectedCategoria.nombre, 
          active: false, 
          onClick: () => cargarSubcategorias(selectedCategoria.id, selectedCategoria.nombre)
        },
        { text: subcategoriaNombre, active: true }
      ]);
    } catch (error) {
      console.error("Error al cargar los productos:", error);
      showSnackbar("Error al cargar los productos", "error");
    } finally {
      setLoading(false);
    }
  };

  const cargarGruposTalla = async () => {
    try {
      const response = await getAllGruposTalla();
      const gruposData = response.data;
      
      const gruposFormateados = gruposData.map(grupo => ({
        idGrupoTalla: Number(grupo.idGrupoTalla || grupo.id),
        nombre: grupo.nombre,
        estado: grupo.estado
      }));
      
      setGruposTalla(gruposFormateados);
    } catch (error) {
      console.error("Error al cargar grupos de talla:", error);
      showSnackbar("Error al cargar los grupos de talla", "error");
      setGruposTalla([]);
    }
  };

  const handleOpenStockDialog = (producto) => {
    setSelectedProducto(producto);
    const stockInicial = {};
    const stockMinimoInicial = {};
    Object.entries(producto.stock_por_talla).forEach(([talla, info]) => {
      stockInicial[talla] = info.stock;
      stockMinimoInicial[talla] = info.stock_minimo;
    });
    setStockForm(stockInicial);
    setStockMinimoForm(stockMinimoInicial);
    setOpenStockDialog(true);
  };

  const handleCloseStockDialog = () => {
    setOpenStockDialog(false);
    setSelectedProducto(null);
    setStockForm({});
    setStockMinimoForm({});
    setError('');
  };

  const handleGrupoTallaChange = async (event, subcategoria) => {
    try {
      const nuevoGrupoId = Number(event.target.value);
      
      // Validar que se seleccionó un grupo
      if (!nuevoGrupoId) {
        showSnackbar('Debe seleccionar un grupo de tallas', 'error');
        return;
      }

      // Validar que el grupo existe
      const grupoExiste = gruposTalla.some(grupo => grupo.idGrupoTalla === nuevoGrupoId);
      if (!grupoExiste) {
        showSnackbar('El grupo de talla seleccionado no existe', 'error');
        return;
      }

      // Validar que no es el mismo grupo
      const grupoActualId = Number(subcategoria.grupoTalla?.idGrupoTalla);
      if (grupoActualId === nuevoGrupoId) {
        showSnackbar('Ya está seleccionado este grupo de tallas', 'info');
        return;
      }

      // Mostrar indicador de carga
      setLoading(true);
      
      try {
        await updateGrupoTalla(subcategoria.id, nuevoGrupoId);
        showSnackbar('Grupo de talla actualizado correctamente', 'success');
        await cargarSubcategorias(selectedCategoria.id, selectedCategoria.nombre); // Recargar datos
      } catch (error) {
        // Si el error es porque ya tiene asignado ese grupo, mostrarlo como info
        if (error.message.includes('ya tiene asignado este grupo de talla')) {
          showSnackbar('Ya está seleccionado este grupo de tallas', 'info');
        } else {
          throw error; // Propagar otros errores
        }
      }
    } catch (error) {
      console.error('Error al actualizar grupo de talla:', error);
      showSnackbar(
        error.response?.data?.error || error.message || 'Error al actualizar el grupo de talla',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStockChange = (talla, value) => {
    const newValue = parseInt(value) || 0;
    const stockTotal = selectedProducto?.stock || 0;
    const stockActual = Object.values(stockForm).reduce((sum, stock) => sum + (parseInt(stock) || 0), 0);
    const stockActualSinTalla = stockActual - (parseInt(stockForm[talla]) || 0);
    const stockDisponible = stockTotal - stockActualSinTalla;

    if (newValue > stockDisponible) {
      setError(`No puedes asignar más de ${stockDisponible} unidades a la talla ${talla}`);
      return;
    }

    setStockForm(prev => ({
      ...prev,
      [talla]: newValue
    }));
    setError(null);
  };

  const handleSaveStock = async () => {
    try {
      const stockTotal = Object.values(stockForm).reduce((sum, stock) => sum + (parseInt(stock) || 0), 0);
      if (stockTotal > selectedProducto.stock) {
        setError('La suma de los stocks por talla no puede exceder el stock total del producto');
        return;
      }

      // Preparar los datos para la actualización
      const tallasData = Object.entries(selectedProducto.stock_por_talla).map(([talla, info]) => ({
        talla_id: info.talla_id,
        stock: stockForm[talla] || 0,
        stock_minimo: stockMinimoForm[talla] || info.stock_minimo
      }));

      await actualizarStockTallas(selectedProducto.id, tallasData);
      showSnackbar('Stock por tallas actualizado exitosamente', 'success');
      handleCloseStockDialog();
      cargarProductos(selectedSubcategoria.id, selectedSubcategoria.nombre);
    } catch (error) {
      console.error('Error al actualizar stock:', error);
      showSnackbar(error.response?.data?.error || 'Error al distribuir el stock', 'error');
    }
  };

  const renderCategoriasTable = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            {currentData.columnas.map((columna) => (
              <TableCell key={columna.campo}>{columna.titulo}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {currentData.datos.map((categoria) => (
            <TableRow key={categoria.id}>
              <TableCell>{categoria.nombre}</TableCell>
              <TableCell>{categoria.subcategorias_count}</TableCell>
              <TableCell>{categoria.productos_count}</TableCell>
              <TableCell>
                <Chip
                  label={categoria.estado ? "Activo" : "Inactivo"}
                  color={categoria.estado ? "success" : "error"}
                  size="small"
                />
              </TableCell>
              <TableCell>
                <IconButton
                  color="primary"
                  onClick={() => cargarSubcategorias(categoria.id, categoria.nombre)}
                >
                  <VisibilityIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderSubcategoriasTable = () => {
    if (loading) {
      return <CircularProgress />;
    }

    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {currentData.columnas.map((columna) => (
                <TableCell key={columna.campo}>{columna.titulo}</TableCell>
              ))}
              <TableCell>Grupo de Talla</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {currentData.datos.map((subcategoria) => (
              <TableRow key={subcategoria.id}>
                <TableCell>{subcategoria.nombre}</TableCell>
                <TableCell align="right">{subcategoria.productos_count}</TableCell>
                <TableCell>
                  <Chip
                    label={`${subcategoria.stock_total} unidades`}
                    color={subcategoria.stock_total <= 5 ? "error" : "success"}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">5</TableCell>
                <TableCell>
                  <Chip
                    label={subcategoria.estado ? "Activo" : "Inactivo"}
                    color={subcategoria.estado ? "success" : "error"}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      color="primary"
                      onClick={() => cargarProductos(subcategoria.id, subcategoria.nombre)}
                    >
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton
                      color="primary"
                      onClick={() => handleCrearProducto(subcategoria)}
                      title="Crear producto"
                    >
                      <AddIcon />
                    </IconButton>
                  </Box>
                </TableCell>
                <TableCell>
                  {renderGrupoTallaSelect(subcategoria)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderProductosTable = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Producto</TableCell>
            <TableCell align="right">Precio</TableCell>
            <TableCell align="right">Stock Total</TableCell>
            <TableCell>Stock Mínimo</TableCell>
            <TableCell>Stock por Tallas</TableCell>
            <TableCell>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {currentData.datos.map((producto) => (
            <TableRow key={producto.id}>
              {/* Columna de Producto (imagen y nombre) */}
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {producto.imagen ? (
                    <>
                      <img
                        src={producto.imagen || "https://via.placeholder.com/100"}
                        alt={producto.nombre}
                        style={{ 
                          width: 40, 
                          height: 40, 
                          objectFit: 'cover', 
                          borderRadius: 4,
                          border: '1px solid #e0e0e0'
                        }}
                        onError={e => {
                          e.target.onerror = null;
                          e.target.src = "https://via.placeholder.com/100";
                        }}
                        loading="lazy"
                      />
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          display: 'none',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#f5f5f5',
                          borderRadius: 1,
                          border: '1px solid #e0e0e0'
                        }}
                      >
                        <ImageNotSupportedIcon sx={{ color: '#9e9e9e' }} />
                      </Box>
                    </>
                  ) : (
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#f5f5f5',
                        borderRadius: 1,
                        border: '1px solid #e0e0e0'
                      }}
                    >
                      <ImageNotSupportedIcon sx={{ color: '#9e9e9e' }} />
                    </Box>
                  )}
                  <Typography variant="body2" noWrap>
                    {producto.nombre}
                  </Typography>
                </Box>
              </TableCell>

              {/* Columna de Precio */}
              <TableCell align="right">
                ${producto.precio.toLocaleString('es-CO')}
              </TableCell>

              {/* Columna de Stock Total */}
              <TableCell align="right">
                <Chip
                  label={`${Object.values(producto.stock_por_talla).reduce((sum, info) => sum + (info.stock || 0), 0)} unidades`}
                  color={Object.values(producto.stock_por_talla).reduce((sum, info) => sum + (info.stock || 0), 0) <= 5 ? "error" : "success"}
                  size="small"
                />
              </TableCell>

              {/* Columna de Stock Mínimo */}
              <TableCell>
                <Typography>5</Typography>
              </TableCell>

              {/* Columna de Stock por Tallas */}
              <TableCell>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleOpenStockDialog(producto)}
                  startIcon={<EditIcon />}
                >
                  Distribuir Stock
                </Button>
                <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {Object.entries(producto.stock_por_talla).map(([talla, info]) => (
                    <Chip
                      key={talla}
                      label={`${talla}: ${info.stock}`}
                      size="small"
                      color={info.stock <= 5 ? "error" : "success"}
                    />
                  ))}
                </Box>
              </TableCell>

              {/* Columna de Acciones */}
              <TableCell>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton 
                    color="primary" 
                    size="small"
                    onClick={() => handleSaveStock(producto)}
                    title="Guardar cambios"
                  >
                    <SaveIcon />
                  </IconButton>
                  <IconButton 
                    color="primary" 
                    size="small"
                    onClick={() => window.location.href = producto.acciones.ver_detalle}
                    title="Ver detalles"
                  >
                    <VisibilityIcon />
                  </IconButton>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  {/* Diálogo para gestionar el stock por talla */}
  const StockDialog = () => {
    const stockTotal = selectedProducto?.stock || 0;
    const stockDistribuido = Object.values(stockForm).reduce((sum, stock) => sum + (parseInt(stock) || 0), 0);
    const stockRestante = stockTotal - stockDistribuido;

    return (
      <Dialog open={openStockDialog} onClose={handleCloseStockDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Distribuir Stock por Talla</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            {selectedProducto?.nombre}
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Stock Total del Producto: {stockTotal} unidades
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Stock Distribuido: {stockDistribuido} unidades
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ 
              color: stockRestante < 0 ? 'error.main' : 'text.secondary',
              fontWeight: stockRestante < 0 ? 'bold' : 'normal'
            }}>
              Stock Restante: {stockRestante} unidades
            </Typography>
          </Box>
          <Stack spacing={2}>
            {Object.entries(selectedProducto?.stock_por_talla || {}).map(([talla]) => {
              const stockActualSinTalla = stockDistribuido - (parseInt(stockForm[talla]) || 0);
              const stockDisponible = stockTotal - stockActualSinTalla;

              return (
                <Box key={talla} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Typography sx={{ minWidth: 60 }}>{talla}:</Typography>
                  <TextField
                    label="Stock"
                    type="number"
                    size="small"
                    value={stockForm[talla] || 0}
                    onChange={(e) => handleStockChange(talla, e.target.value)}
                    sx={{ width: 120 }}
                    inputProps={{ 
                      min: 0,
                      max: stockDisponible
                    }}
                    helperText={`Máximo disponible: ${stockDisponible} unidades`}
                    error={parseInt(stockForm[talla] || 0) > stockDisponible}
                  />
                </Box>
              );
            })}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseStockDialog}>Cancelar</Button>
          <Button 
            onClick={handleSaveStock} 
            variant="contained" 
            color="primary"
            disabled={stockRestante < 0}
          >
            Guardar Distribución
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  const renderGrupoTallaSelect = (subcategoria) => {
    if (!subcategoria.grupoTalla) {
      return (
        <Alert severity="warning" sx={{ mb: 1 }}>
          No tiene grupo de tallas asignado
        </Alert>
      );
    }

    const grupoTallaId = Number(subcategoria.grupoTalla?.idGrupoTalla || subcategoria.grupoTalla?.id);

    if (!grupoTallaId) {
      return (
        <Alert severity="warning" sx={{ py: 0 }}>
          Se requiere asignar un grupo de tallas
        </Alert>
      );
    }

    return (
      <FormControl fullWidth size="small">
        <Select
          value={grupoTallaId}
          onChange={(e) => handleGrupoTallaChange(e, subcategoria)}
          displayEmpty={false}
          disabled={loading}
        >
          {Array.isArray(gruposTalla) && gruposTalla.length > 0 ? (
            gruposTalla
              .filter(grupo => grupo.estado) // Solo mostrar grupos activos
              .map((grupo) => (
                <MenuItem 
                  key={grupo.idGrupoTalla} 
                  value={grupo.idGrupoTalla}
                  disabled={grupo.idGrupoTalla === grupoTallaId}
                >
                  {grupo.nombre}
                </MenuItem>
              ))
          ) : (
            <MenuItem disabled>No hay grupos disponibles</MenuItem>
          )}
        </Select>
      </FormControl>
    );
  };

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleRedireccionManual = () => {
    navigate('/categorias');
  };

  const handleCerrarDialogo = () => {
    setOpenNoCategoriasDialog(false);
    setContador(10);
  };

  const handleRedireccionManualGrupoTalla = () => {
    navigate('/grupo-talla');
  };

  const handleCerrarDialogoGrupoTalla = () => {
    setOpenNoGrupoTallaDialog(false);
    setContadorGrupoTalla(5);
  };

  const handleCrearProducto = (subcategoria) => {
    navigate(`/producto/crear?subcategoria=${subcategoria.id}&subcategoriaNombre=${encodeURIComponent(subcategoria.nombre)}`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Si el diálogo de no categorías está abierto, solo mostrar el diálogo
  if (openNoCategoriasDialog) {
    return (
      <Box sx={{ width: '100%' }}>
        {/* Diálogo para cuando no hay categorías */}
        <Dialog 
          open={openNoCategoriasDialog} 
          onClose={handleCerrarDialogo}
          maxWidth="sm"
          fullWidth
          disableEscapeKeyDown
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningIcon color="warning" />
            No hay categorías disponibles
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              No se encontraron categorías en el sistema. Para continuar, necesitas crear al menos una categoría.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Serás redirigido automáticamente a la página de categorías en {contador} segundos.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={handleRedireccionManual} 
              variant="contained" 
              color="primary"
            >
              Ir a Categorías Ahora
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  // Si el diálogo de no grupos de talla está abierto, solo mostrar el diálogo
  if (openNoGrupoTallaDialog) {
    return (
      <Box sx={{ width: '100%' }}>
        {/* Diálogo para cuando no hay grupos de talla */}
        <Dialog 
          open={openNoGrupoTallaDialog} 
          onClose={handleCerrarDialogoGrupoTalla}
          maxWidth="sm"
          fullWidth
          disableEscapeKeyDown
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningIcon color="warning" />
            Grupos de Talla Requeridos
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              No se encontraron grupos de talla en el sistema. Para continuar, necesitas crear al menos un grupo de talla antes de poder gestionar las subcategorías.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Serás redirigido automáticamente a la página de grupos de talla en {contadorGrupoTalla} segundos.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={handleRedireccionManualGrupoTalla} 
              variant="contained" 
              color="primary"
            >
              Ir a Grupos de Talla Ahora
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  // Si no hay datos actuales, mostrar un mensaje de carga
  if (!currentData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        aria-label="breadcrumb"
        sx={{ mb: 2 }}
      >
        <Link
          component="button"
          variant="body1"
          onClick={() => cargarCategorias()}
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
          Inventario
        </Link>
        {breadcrumbs.map((crumb, index) => (
          crumb.active ? (
            <Typography key={index} color="text.primary">
              {crumb.text}
            </Typography>
          ) : (
            <Link
              key={index}
              component="button"
              variant="body1"
              onClick={crumb.onClick}
              color="inherit"
            >
              {crumb.text}
            </Link>
          )
        ))}
      </Breadcrumbs>

      <Typography variant="h5" sx={{ mb: 2 }}>
        {currentData.titulo}
      </Typography>

      {currentView === "categorias" && renderCategoriasTable()}
      {currentView === "subcategorias" && renderSubcategoriasTable()}
      {currentView === "productos" && renderProductosTable()}
      <StockDialog />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default InventarioTabla;

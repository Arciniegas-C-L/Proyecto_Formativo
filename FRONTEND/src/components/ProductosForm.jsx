import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Box,
  Typography,
  Pagination,
} from "@mui/material";
import {
  getProductosPaginados,
  deleteProducto,
} from "../api/Producto.api";
import { toast } from "react-toastify";

export function ProductosForm() {
  const [productos, setProductos] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [loading, setLoading] = useState(true);

  const cargarProductos = async (pagina = 1) => {
    try {
      setLoading(true);
      const response = await getProductosPaginados(pagina);
      const data = response.data;

      if (Array.isArray(data.results)) {
        setProductos(data.results);
        setTotalPaginas(Math.ceil(data.count / 10)); // 10 es el PAGE_SIZE
      } else {
        toast.error("Error: estructura de datos inesperada");
        setProductos([]);
      }
    } catch (error) {
      toast.error("Error al cargar productos");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Eliminar producto?")) {
      try {
        await deleteProducto(id);
        toast.success("Producto eliminado");
        cargarProductos(pagina);
      } catch (error) {
        toast.error(error.message || "Error al eliminar producto");
      }
    }
  };

  useEffect(() => {
    cargarProductos(pagina);
  }, [pagina]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Lista de Productos
      </Typography>

      {loading ? (
        <Typography>Cargando productos...</Typography>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Precio</TableCell>
                  <TableCell>Categoría</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {productos.map((producto) => (
                  <TableRow key={producto.id}>
                    <TableCell>{producto.nombre}</TableCell>
                    <TableCell>${producto.precio}</TableCell>
                    <TableCell>{producto.categoria?.nombre || "-"}</TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        color="error"
                        onClick={() => handleDelete(producto.id)}
                      >
                        Eliminar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
            <Pagination
              count={totalPaginas}
              page={pagina}
              onChange={(e, value) => setPagina(value)}
              color="primary"
            />
          </Box>
        </>
      )}
    </Box>
  );
};


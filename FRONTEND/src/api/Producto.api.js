import axios from "axios";

// API para productos
const ProductoApi = axios.create({
  baseURL: "http://127.0.0.1:8000/BACKEND/api/producto/",
});

export const getALLProductos = () => ProductoApi.get("/");
export const createProducto = (producto) => ProductoApi.post("/", producto);
export const deleteProducto = (id) => ProductoApi.delete(`${id}`);
export const updateProducto = (id, producto) => ProductoApi.put(`${id}/`, producto);

// API para categorías
const CategoriaApi = axios.create({
  baseURL: "http://127.0.0.1:8000/BACKEND/api/categoria/",
});

export const getCategorias = () => CategoriaApi.get("/");

const SubcategoriaApi = axios.create({
  baseURL: "http://127.0.0.1:8000/BACKEND/api/subcategoria/",
});

export const getSubcategoriasPorCategoria = (idCategoria) =>
  SubcategoriaApi.get(`?categoria=${idCategoria}`);

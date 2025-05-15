import axios from "axios";

const ProductoApi = axios.create({
    baseURL: "http://127.0.0.1:8000/BACKEND/api/producto/"
})

export const getALLProductos = () => ProductoApi.get("/");
export const createProducto = (Producto) => ProductoApi.post("/", Producto);
export const deleteProducto = (id) => ProductoApi.delete(`/${id}`);
export const updateProducto = (id, Producto) => ProductoApi.put(`/${id}`, Producto);
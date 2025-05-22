import axios from "axios";

const InventarioApi = axios.create({
  baseURL: "http://127.0.0.1:8000/BACKEND/api/inventario/"
});

export const getAllInventario = async () => {
  try {
    const res = await InventarioApi.get("/");
    return res.data;
  } catch (error) {
    console.error("Error al obtener inventario:", error);
    throw error;
  }
};

export const createInventario = async (inventario) => {
  try {
    const res = await InventarioApi.post("/", inventario);
    return res.data;
  } catch (error) {
    console.error("Error al crear inventario:", error);
    throw error;
  }
};

export const updateInventario = async (id, inventario) => {
  try {
    const res = await InventarioApi.put(`/${id}/`, inventario);
    return res.data;
  } catch (error) {
    console.error("Error al actualizar inventario:", error);
    throw error;
  }
};

export const deleteInventario = async (id) => {
  try {
    await InventarioApi.delete(`/${id}/`);
  } catch (error) {
    console.error("Error al eliminar inventario:", error);
    throw error;
  }
};

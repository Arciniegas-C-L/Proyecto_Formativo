import axios from "axios";

const CategoriaApi = axios.create({
  baseURL: "http://127.0.0.1:8000/BACKEND/api/categoria/"
});

export const getAllCategorias = async () => {
  try {
    const res = await CategoriaApi.get("/");
    return res.data;
  } catch (error) {
    console.error("Error al obtener categorías:", error);
    throw error;
  }
};

export const createCategoria = async (categoria) => {
  try {
    const res = await CategoriaApi.post("/", categoria);
    return res.data;
  } catch (error) {
    console.error("Error al crear categoría:", error);
    throw error;
  }
};

export const updateCategoria = async (id, categoria) => {
  try {
    const res = await CategoriaApi.put(`/${id}/`, categoria);
    return res.data;
  } catch (error) {
    console.error("Error al actualizar categoría:", error);
    throw error;
  }
};

export const deleteCategoria = async (id) => {
  try {
    await CategoriaApi.delete(`/${id}/`);
  } catch (error) {
    console.error("Error al eliminar categoría:", error);
    throw error;
  }
};

import axios from "axios";

const SubcategoriaApi = axios.create({
  baseURL: "http://127.0.0.1:8000/BACKEND/api/subcategoria/",
});

export const getAllSubcategorias = async () => {
  try {
    const res = await SubcategoriaApi.get("/");
    return res.data;
  } catch (error) {
    console.error("Error al obtener subcategorías:", error);
    throw error;
  }
};

export const getSubcategoriasByCategoria = async (categoriaId) => {
  try {
    const res = await SubcategoriaApi.get("/", {
      params: { categoria: categoriaId },
    });
    return res.data;
  } catch (error) {
    console.error("Error al obtener subcategorías por categoría:", error);
    throw error;
  }
};

export const createSubcategoria = async (subcategoria) => {
  try {
    const res = await SubcategoriaApi.post("/", subcategoria);
    return res.data;
  } catch (error) {
    console.error("Error al crear subcategoría:", error);
    throw error;
  }
};

export const updateSubcategoria = async (id, subcategoria) => {
  try {
    const res = await SubcategoriaApi.put(`${id}/`, subcategoria);
    return res.data;
  } catch (error) {
    console.error("Error al actualizar subcategoría:", error);
    throw error;
  }
};

export const deleteSubcategoria = async (id) => {
  try {
    await SubcategoriaApi.delete(`${id}/`);
  } catch (error) {
    console.error("Error al eliminar subcategoría:", error);
    throw error;
  }
};

import { api } from "./roles";

export const getDirecciones = async () => {
  const res = await api.get("direccion/");
  return res.data;
};

export const createDireccion = async (data) => {
  const res = await api.post("direccion/", data);
  return res.data;
};

export const updateDireccion = async (id, data) => {
  const res = await api.put(`direccion/${id}/`, data);
  return res.data;
};

export const deleteDireccion = async (id) => {
  const res = await api.delete(`direccion/${id}/`);
  return res.data;
};

export const setPrincipalDireccion = async (id) => {
  const res = await api.patch(`direccion/${id}/`, { principal: true });
  return res.data;
};

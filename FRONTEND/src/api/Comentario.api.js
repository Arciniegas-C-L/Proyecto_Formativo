import axios from "./axios";

export const enviarComentario = (data) => axios.post("/comentarios/", data);
export const obtenerComentarios = () => axios.get("/comentarios/");

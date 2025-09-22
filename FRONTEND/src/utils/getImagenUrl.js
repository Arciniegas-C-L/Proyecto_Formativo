// Utilidad para obtener la URL completa de la imagen de producto
const BACKEND_URL = import.meta.env.VITE_BACK_URL || "http://127.0.0.1:8000";

export function getImagenUrl(img) {
  if (!img) return "https://via.placeholder.com/250x350?text=Imagen+no+disponible";
  if (typeof img === "string" && img.startsWith("http")) return img;
  return `${BACKEND_URL}/${img}`;
}

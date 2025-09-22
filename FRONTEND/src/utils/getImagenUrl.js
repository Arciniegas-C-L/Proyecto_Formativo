// Utilidad para obtener la URL completa de la imagen de producto
const BACKEND_URL = import.meta.env.VITE_BACK_URL || "http://127.0.0.1:8000";

// Ruta relativa a la imagen local de "no disponible"
import noDisponible from '../assets/images/no-disponible.png';

export function getImagenUrl(img) {
  if (!img) return noDisponible;
  if (typeof img === "string" && img.startsWith("http")) return img;
  // Si la ruta ya empieza con 'media/', úsala tal cual, si no, anteponer 'media/'
  let path = img;
  if (!img.startsWith('media/')) {
    path = `media/${img.replace(/^\/+/, '')}`;
  }
  return `${BACKEND_URL}/${path}`;
}

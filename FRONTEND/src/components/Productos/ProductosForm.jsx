import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useNavigate, useLocation } from "react-router-dom";
import "../../assets/css/Productos/ProductosForm.css";
import {
  getCategorias,
  getSubcategoriasPorCategoria,
  createProducto,
  updateProducto,
} from "../../api/Producto.api";

export function ProductosForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const productoEditar = location.state?.producto || null;

  const [formData, setFormData] = useState({
    nombre: productoEditar?.nombre || "",
    descripcion: productoEditar?.descripcion || "",
    precio: productoEditar?.precio ? String(productoEditar.precio) : "",
    stock: productoEditar?.stock ? String(productoEditar.stock) : "",
    categoria: productoEditar?.categoria ? String(productoEditar.categoria.idCategoria) : "",
    subcategoria: productoEditar?.subcategoria ? String(productoEditar.subcategoria.idSubcategoria) : "",
    imagen: productoEditar?.imagen || "",
    imagenFile: null,
  });

  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [cargandoSubcategorias, setCargandoSubcategorias] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategorias();
  }, []);

  useEffect(() => {
    if (formData.categoria) {
      loadSubcategorias(formData.categoria);
    } else {
      setSubcategorias([]);
      setFormData(prev => ({ ...prev, subcategoria: "" }));
    }
  }, [formData.categoria]);

  const loadCategorias = async () => {
    try {
      const res = await getCategorias();
      setCategorias(res.data);
    } catch {
      toast.error("Error al cargar categorías");
    }
  };

  const loadSubcategorias = async (categoriaId) => {
    setCargandoSubcategorias(true);
    try {
      const res = await getSubcategoriasPorCategoria(categoriaId);
      setSubcategorias(res.data);
    } catch {
      toast.error("Error al cargar subcategorías");
    } finally {
      setCargandoSubcategorias(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === "file") {
      const file = files[0];
      if (file) {
        const localImageUrl = URL.createObjectURL(file);
        setFormData(prev => ({
          ...prev,
          imagenFile: file,
          imagen: localImageUrl,
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const validateForm = () => {
    const errores = {};
    if (!formData.nombre.trim()) errores.nombre = "El nombre es obligatorio";
    if (!formData.descripcion.trim()) errores.descripcion = "La descripción es obligatoria";
    if (!formData.precio || isNaN(formData.precio) || parseFloat(formData.precio) <= 0)
      errores.precio = "Precio inválido";
    if (!formData.stock || isNaN(formData.stock) || parseInt(formData.stock) < 0)
      errores.stock = "Stock inválido";
    if (!formData.categoria) errores.categoria = "Seleccione una categoría";
    if (!formData.subcategoria) errores.subcategoria = "Seleccione una subcategoría";
    setErrors(errores);
    return Object.keys(errores).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    const formDataToSend = new FormData();
    formDataToSend.append("nombre", formData.nombre.trim());
    formDataToSend.append("descripcion", formData.descripcion.trim());
    formDataToSend.append("precio", parseFloat(formData.precio));
    formDataToSend.append("stock", parseInt(formData.stock));
    formDataToSend.append("subcategoria", parseInt(formData.subcategoria));
    if (formData.imagenFile) {
      formDataToSend.append("imagen", formData.imagenFile);
    }

    try {
      if (productoEditar) {
        await updateProducto(productoEditar.idProducto, formDataToSend);
        toast.success("Producto actualizado correctamente");
        navigate('/producto');
      } else {
        await createProducto(formDataToSend);
        toast.success("Producto creado correctamente");
        navigate('/producto');
      }
    } catch (error) {
      toast.error("Error al guardar el producto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2 className="form-title">
        {productoEditar ? "Editar producto" : "Crear producto"}
      </h2>
      <form onSubmit={handleSubmit} className="producto-form" noValidate>
        <div className="form-row">
          <div className="form-group">
            <label>Nombre</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              className={errors.nombre ? "error" : ""}
            />
            <span className="error-message">{errors.nombre}</span>
          </div>

          <div className="form-group">
            <label>Precio</label>
            <input
              type="number"
              name="precio"
              value={formData.precio}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              className={errors.precio ? "error" : ""}
            />
            <span className="error-message">{errors.precio}</span>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Stock</label>
            <input
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleInputChange}
              min="0"
              className={errors.stock ? "error" : ""}
            />
            <span className="error-message">{errors.stock}</span>
          </div>

          <div className="form-group">
            <label>Categoría</label>
            <select
              name="categoria"
              value={formData.categoria}
              onChange={handleInputChange}
              className={errors.categoria ? "error" : ""}
            >
              <option value="">Seleccione una categoría</option>
              {categorias.map((cat) => (
                <option key={cat.idCategoria} value={cat.idCategoria}>
                  {cat.nombre}
                </option>
              ))}
            </select>
            <span className="error-message">{errors.categoria}</span>
          </div>
        </div>

        <div className="form-group">
          <label>Subcategoría</label>
          <select
            name="subcategoria"
            value={formData.subcategoria}
            onChange={handleInputChange}
            disabled={!formData.categoria || cargandoSubcategorias}
            className={errors.subcategoria ? "error" : ""}
          >
            <option value="">Seleccione una subcategoría</option>
            {subcategorias.map((sub) => (
              <option key={sub.idSubcategoria} value={sub.idSubcategoria}>
                {sub.nombre}
              </option>
            ))}
          </select>
          <span className="error-message">{errors.subcategoria}</span>
        </div>

        <div className="form-group">
          <label>Descripción</label>
          <textarea
            name="descripcion"
            value={formData.descripcion}
            onChange={handleInputChange}
            rows={3}
            className={errors.descripcion ? "error" : ""}
          />
          <span className="error-message">{errors.descripcion}</span>
        </div>

        <div className="form-group">
          <label>Imagen</label>
          <input
            type="file"
            name="imagen"
            onChange={handleInputChange}
            accept="image/*"
          />
          {formData.imagen && (
            <div className="image-preview">
              <img src={formData.imagen} alt="Producto" />
            </div>
          )}
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-guardar" disabled={loading}>
            {loading ? "Guardando..." : productoEditar ? "Actualizar" : "Crear"}
          </button>
        </div>
      </form>
    </div>
  );
}
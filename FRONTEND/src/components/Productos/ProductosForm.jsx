import React, { useState, useEffect } from "react";
import { Cloudinary } from "@cloudinary/url-gen";
import { fill } from "@cloudinary/url-gen/actions/resize";
// Widget de Cloudinary
function CloudinaryUpload({ onUrl }) {
  const openWidget = () => {
    if (!window.cloudinary) {
      alert("Cloudinary widget no cargado");
      return;
    }
    window.cloudinary.createUploadWidget(
      {
        cloudName: 'dkwr4gcpl',
        uploadPreset: 'default-preset', // Debes crear este preset en Cloudinary
      },
      (error, result) => {
        if (!error && result && result.event === "success") {
          onUrl(result.info.secure_url);
        }
      }
    ).open();
  };
  return (
    <button type="button" onClick={openWidget} style={{marginBottom:8}}>
      Subir imagen a Cloudinary
    </button>
  );
}
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

  // Estado inicial del formulario
  const [formData, setFormData] = useState({
    nombre: productoEditar?.nombre || "",
    descripcion: productoEditar?.descripcion || "",
    // Guardamos el precio como string para poder poner puntos
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

  // Cargar categorías al montar el componente
  useEffect(() => {
    loadCategorias();
  }, []);

  useEffect(() => {
    if (formData.categoria) {
      loadSubcategorias(formData.categoria);
    } else {
      setSubcategorias([]);
      if (formData.subcategoria !== "") {
        setFormData(prev => ({ ...prev, subcategoria: "" }));
      }
    }
  }, [formData.categoria]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    const subId = parseInt(formData.subcategoria, 10);
    // Usar FormData para evitar error de media type
    const form = new FormData();
    form.append('nombre', formData.nombre);
    form.append('descripcion', formData.descripcion);
    form.append('precio', Number(String(formData.precio).replace(",", ".")));
    form.append('stock', Number(formData.stock));
    form.append('categoria', formData.categoria);
    form.append('subcategoria', subId);
    form.append('imagen', formData.imagen); // URL pública de Cloudinary

    try {
      if (productoEditar) {
        await updateProducto(productoEditar.idProducto, form);
        toast.success("Producto actualizado correctamente");
      } else {
        await createProducto(form);
        toast.success("Producto creado correctamente");
        setFormData({
          nombre: "",
          descripcion: "",
          precio: "",
          stock: "",
          categoria: "",
          subcategoria: "",
          imagen: "",
        });
      }
      navigate("/admin/productos");
    } catch (error) {
      console.error(" Error guardando producto:", error);
      toast.error("Error al guardar el producto");
    } finally {
      setLoading(false);
    }
  };

    setErrors(errores);
    return Object.keys(errores).length === 0;
  };

  // Envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Corrige los errores antes de continuar");
      return;
    }

    setLoading(true);

    const subId = parseInt(formData.subcategoria, 10);
    const precioNum = Number(String(formData.precio).replace(",", "."));
    const stockNum = Number(formData.stock);

    // Usar FormData para evitar error de media type
    const form = new FormData();
    form.append('nombre', formData.nombre.trim());
    form.append('descripcion', formData.descripcion.trim());
    form.append('precio', precioNum);
    form.append('stock', stockNum);
    form.append('subcategoria', subId);
    form.append('imagen', formData.imagen);

    try {
      if (productoEditar) {
        await updateProducto(productoEditar.idProducto, form);
        toast.success("Producto actualizado correctamente");
      } else {
        await createProducto(form);
        toast.success("Producto creado correctamente");
        setFormData({
          nombre: "",
          descripcion: "",
          precio: "",
          stock: "",
          categoria: "",
          subcategoria: "",
          imagen: "",
        });
      }
      navigate("/admin/productos");
    } catch (error) {
      console.error(" Error guardando producto:", error);
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
              type="text" // Para poder ingresar valores  con puntos
              name="precio"
              value={formData.precio}
              onChange={handleInputChange}
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
          <CloudinaryUpload onUrl={url => setFormData(prev => ({ ...prev, imagen: url }))} />
          {formData.imagen && (() => {
            let imagenUrl = formData.imagen;
            if (imagenUrl && imagenUrl.includes('res.cloudinary.com')) {
              const matches = imagenUrl.match(/upload\/(?:v\d+\/)?(.+)$/);
              const publicId = matches ? matches[1] : null;
              if (publicId) {
                const cld = new Cloudinary({ cloud: { cloudName: "dkwr4gcpl" } });
                imagenUrl = cld.image(publicId).resize(fill().width(300).height(300)).toURL();
              }
            }
            return (
              <div className="image-preview">
                <img src={imagenUrl} alt="Producto" />
              </div>
            );
          })()}
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
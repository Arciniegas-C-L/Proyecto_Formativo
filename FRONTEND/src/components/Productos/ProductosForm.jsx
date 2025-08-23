import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useNavigate, useLocation } from "react-router-dom";
import "../../assets/css/ProductosForm.css";
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
      if (formData.subcategoria !== "") {
        setFormData(prev => ({ ...prev, subcategoria: "" }));
      }
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
    const subId = parseInt(formData.subcategoria, 10);
    const precioNum = Number(String(formData.precio).replace(",", "."));
    const stockNum = Number(formData.stock);

    if (!formData.nombre.trim()) errores.nombre = "El nombre es obligatorio";
    if (!formData.descripcion.trim()) errores.descripcion = "La descripción es obligatoria";
    if (isNaN(precioNum) || precioNum <= 0) errores.precio = "Precio inválido";
    if (!Number.isInteger(stockNum) || stockNum < 0) errores.stock = "Stock inválido";
    if (!formData.categoria) errores.categoria = "Seleccione una categoría";
    if (!Number.isInteger(subId) || subId <= 0) errores.subcategoria = "Seleccione una subcategoría válida";

    setErrors(errores);
    return Object.keys(errores).length === 0;
  };

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

    const formDataToSend = new FormData();
    formDataToSend.append("nombre", formData.nombre.trim());
    formDataToSend.append("descripcion", formData.descripcion.trim());
    formDataToSend.append("precio", precioNum);
    formDataToSend.append("stock", stockNum);
    formDataToSend.append("subcategoria", subId);

    if (formData.imagenFile) {
      formDataToSend.append("imagen", formData.imagenFile);
    }

    console.log("📦 FormData enviado:");
    for (let pair of formDataToSend.entries()) {
      console.log(pair[0], ":", pair[1]);
    }

    try {
      if (productoEditar) {
        await updateProducto(productoEditar.idProducto, formDataToSend);
        toast.success("Producto actualizado correctamente");
      } else {
        await createProducto(formDataToSend);
        toast.success("Producto creado correctamente");
      }
      navigate("/producto");
    } catch (error) {
      console.error("❌ Error guardando producto:", error);
      toast.error("Error al guardar el producto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <h2>{productoEditar ? "Editar producto" : "Crear producto"}</h2>
      <form onSubmit={handleSubmit} className="row g-3 mt-2" noValidate>
        {/* Nombre */}
        <div className="col-md-6">
          <label htmlFor="nombre" className="form-label">Nombre</label>
          <input
            type="text"
            className={`form-control ${errors.nombre ? "is-invalid" : ""}`}
            id="nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleInputChange}
          />
          <div className="invalid-feedback">{errors.nombre}</div>
        </div>

        {/* Precio */}
        <div className="col-md-6">
          <label htmlFor="precio" className="form-label">Precio</label>
          <input
            type="number"
            className={`form-control ${errors.precio ? "is-invalid" : ""}`}
            id="precio"
            name="precio"
            value={formData.precio}
            onChange={handleInputChange}
            step="0.01"
            min="0"
          />
          <div className="invalid-feedback">{errors.precio}</div>
        </div>

        {/* Stock */}
        <div className="col-md-6">
          <label htmlFor="stock" className="form-label">Stock</label>
          <input
            type="number"
            className={`form-control ${errors.stock ? "is-invalid" : ""}`}
            id="stock"
            name="stock"
            value={formData.stock}
            onChange={handleInputChange}
            min="0"
          />
          <div className="invalid-feedback">{errors.stock}</div>
        </div>

        {/* Categoría */}
        <div className="col-md-6">
          <label htmlFor="categoria" className="form-label">Categoría</label>
          <select
            className={`form-select ${errors.categoria ? "is-invalid" : ""}`}
            id="categoria"
            name="categoria"
            value={formData.categoria}
            onChange={handleInputChange}
          >
            <option value="">Seleccione una categoría</option>
            {categorias.map((cat) => (
              <option key={cat.idCategoria} value={String(cat.idCategoria)}>
                {cat.nombre}
              </option>
            ))}
          </select>
          <div className="invalid-feedback">{errors.categoria}</div>
        </div>

        {/* Subcategoría */}
        <div className="col-md-6">
          <label htmlFor="subcategoria" className="form-label">Subcategoría</label>
          <select
            className={`form-select ${errors.subcategoria ? "is-invalid" : ""}`}
            id="subcategoria"
            name="subcategoria"
            value={formData.subcategoria}
            onChange={handleInputChange}
            disabled={!formData.categoria || cargandoSubcategorias}
          >
            <option value="">Seleccione una subcategoría</option>
            {subcategorias.map((sub) => (
              <option key={sub.idSubcategoria} value={String(sub.idSubcategoria)}>
                {sub.nombre}
              </option>
            ))}
          </select>
          <div className="invalid-feedback">{errors.subcategoria}</div>
        </div>

        {/* Descripción */}
        <div className="col-md-12">
          <label htmlFor="descripcion" className="form-label">Descripción</label>
          <textarea
            className={`form-control ${errors.descripcion ? "is-invalid" : ""}`}
            id="descripcion"
            name="descripcion"
            value={formData.descripcion}
            onChange={handleInputChange}
            rows={3}
          />
          <div className="invalid-feedback">{errors.descripcion}</div>
        </div>

        {/* Imagen */}
        <div className="col-md-6">
          <label htmlFor="imagen" className="form-label">Imagen</label>
          <input
            type="file"
            className="form-control"
            id="imagen"
            name="imagen"
            onChange={handleInputChange}
            accept="image/*"
          />
          {formData.imagen && (
            <div className="mt-2">
              <strong>Imagen actual:</strong><br />
              <img src={formData.imagen} alt="Producto" className="img-thumbnail" width="150" />
            </div>
          )}
        </div>

        {/* Botón submit */}
        <div className="col-12">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Guardando..." : productoEditar ? "Actualizar" : "Crear"}
          </button>
        </div>
      </form>
    </div>
  );
}

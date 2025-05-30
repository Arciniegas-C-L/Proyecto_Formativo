import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { createProducto, updateProducto, getCategorias } from "../api/Producto.api";
import { toast } from "react-hot-toast";
import "../assets/css/ProductosForm.css";

export function ProductosForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const productoEditar = location.state?.producto;
  const esEdicion = Boolean(productoEditar);

  const [categorias, setCategorias] = useState([]);
  const [formData, setFormData] = useState({
    nombre: productoEditar?.nombre || "",
    descripcion: productoEditar?.descripcion || "",
    precio: productoEditar?.precio || "",
    stock: productoEditar?.stock || "",
    categoria: productoEditar?.categoria?.idCategoria || "",
    imagen: productoEditar?.imagen || "",
    imagenFile: null
  });
  const [errors, setErrors] = useState({});
  const [previewImage, setPreviewImage] = useState(productoEditar?.imagen || null);
  const [loading, setLoading] = useState(false);
  const [cargandoCategorias, setCargandoCategorias] = useState(true);

  const VALIDATION_RULES = {
    nombre: {
      maxLength: 45,
      required: true
    },
    descripcion: {
      maxLength: 200,
      required: true
    },
    precio: {
      required: true,
      min: 0,
      maxDecimals: 2
    },
    categoria: {
      required: true
    },
    imagen: {
      required: !productoEditar,
      maxSize: 5 * 1024 * 1024,
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif']
    }
  };

  useEffect(() => {
    cargarCategorias();
    if (esEdicion) {
      setFormData({
        nombre: productoEditar.nombre || "",
        descripcion: productoEditar.descripcion || "",
        precio: productoEditar.precio || "",
        stock: productoEditar.stock || "",
        categoria: productoEditar.categoria?.idCategoria || "",
        imagen: productoEditar.imagen || "",
        imagenFile: null
      });
    }
  }, [esEdicion, productoEditar]);

  const cargarCategorias = async () => {
    try {
      const response = await getCategorias();
      setCategorias(response.data);
    } catch (error) {
      console.error("Error al cargar categorías:", error);
      toast.error("Error al cargar las categorías");
    } finally {
      setCargandoCategorias(false);
    }
  };

  const validateField = (name, value) => {
    const rules = VALIDATION_RULES[name];
    const newErrors = { ...errors };

    if (rules.required && !value) {
      newErrors[name] = "Este campo es obligatorio";
    } else if (value) {
      switch (name) {
        case 'nombre':
          if (value.length > rules.maxLength) {
            newErrors[name] = `El nombre no puede tener más de ${rules.maxLength} caracteres`;
          }
          break;
        case 'descripcion':
          if (value.length > rules.maxLength) {
            newErrors[name] = `La descripción no puede tener más de ${rules.maxLength} caracteres`;
          }
          break;
        case 'precio':
          const precioNum = parseFloat(value);
          if (isNaN(precioNum) || precioNum < 0) {
            newErrors[name] = "El precio debe ser un número positivo";
          } else if (!/^\d+(\.\d{0,2})?$/.test(value)) {
            newErrors[name] = "El precio no puede tener más de 2 decimales";
          }
          break;
        case 'categoria':
          if (!value) {
            newErrors[name] = "Debe seleccionar una categoría";
          }
          break;
        default:
          break;
      }
    }

    if (!newErrors[name]) {
      delete newErrors[name];
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    validateField(name, value);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de archivo
      if (!VALIDATION_RULES.imagen.allowedTypes.includes(file.type)) {
        toast.error("Por favor, seleccione una imagen válida (JPEG, PNG o GIF)");
        return;
      }

      // Validar tamaño
      if (file.size > VALIDATION_RULES.imagen.maxSize) {
        toast.error("La imagen no debe superar los 5MB");
        return;
      }

      setFormData(prev => ({
        ...prev,
        imagen: URL.createObjectURL(file),
        imagenFile: file
      }));

      // Crear preview de la imagen
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
      
      validateField('imagen', file);
    }
  };

  const validateForm = () => {
    let isValid = true;
    Object.keys(VALIDATION_RULES).forEach(field => {
      if (!validateField(field, formData[field])) {
        isValid = false;
      }
    });
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Por favor, corrija los errores en el formulario");
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('nombre', formData.nombre.trim());
      formDataToSend.append('descripcion', formData.descripcion.trim());
      formDataToSend.append('precio', parseFloat(formData.precio));
      formDataToSend.append('stock', parseInt(formData.stock));
      formDataToSend.append('categoria', parseInt(formData.categoria));
      
      // Solo agregamos la imagen si hay un nuevo archivo o es una creación
      if (formData.imagenFile) {
        formDataToSend.append('imagen', formData.imagenFile);
      } else if (!esEdicion) {
        // Si es una creación y no hay imagen, mostramos error
        toast.error("Debe seleccionar una imagen para el producto");
        setLoading(false);
        return;
      }

      if (esEdicion) {
        await updateProducto(productoEditar.idProducto, formDataToSend);
        toast.success("Producto actualizado correctamente");
      } else {
        await createProducto(formDataToSend);
        toast.success("Producto creado correctamente");
      }

      // Limpiar el formulario
      setFormData({
        nombre: "",
        descripcion: "",
        precio: "",
        stock: "",
        categoria: "",
        imagen: "",
        imagenFile: null
      });
      setPreviewImage(null);
      setErrors({});
      navigate('/producto');
    } catch (error) {
      console.error("Error al guardar el producto:", error);
      const errorMessage = error.response?.data?.message || "Error al guardar el producto";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (cargandoCategorias) {
    return (
      <div className="form-container">
        <div className="loading">Cargando categorías...</div>
      </div>
    );
  }

  return (
    <div className="form-container">
      <h2>{esEdicion ? "Editar Producto" : "Crear Nuevo Producto"}</h2>
      
      <form onSubmit={handleSubmit} className="producto-form">
        <div className="form-group">
          <label htmlFor="nombre">Nombre del Producto</label>
          <input
            type="text"
            id="nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleInputChange}
            required
            maxLength={VALIDATION_RULES.nombre.maxLength}
            placeholder={`Ingrese el nombre del producto (máx. ${VALIDATION_RULES.nombre.maxLength} caracteres)`}
            className={errors.nombre ? 'error' : ''}
          />
          {errors.nombre && <span className="error-message">{errors.nombre}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="descripcion">Descripción</label>
          <textarea
            id="descripcion"
            name="descripcion"
            value={formData.descripcion}
            onChange={handleInputChange}
            required
            maxLength={VALIDATION_RULES.descripcion.maxLength}
            placeholder={`Ingrese la descripción del producto (máx. ${VALIDATION_RULES.descripcion.maxLength} caracteres)`}
            rows="3"
            className={errors.descripcion ? 'error' : ''}
          />
          {errors.descripcion && <span className="error-message">{errors.descripcion}</span>}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="precio">Precio</label>
            <input
              type="number"
              id="precio"
              name="precio"
              value={formData.precio}
              onChange={handleInputChange}
              required
              min="0"
              step="0.01"
              placeholder="Ingrese el precio (máx. 2 decimales)"
              className={errors.precio ? 'error' : ''}
            />
            {errors.precio && <span className="error-message">{errors.precio}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="stock">Stock</label>
            <input
              type="number"
              id="stock"
              name="stock"
              value={formData.stock}
              onChange={handleInputChange}
              required
              min="0"
              placeholder="Ingrese el stock"
              className={errors.stock ? 'error' : ''}
            />
            {errors.stock && <span className="error-message">{errors.stock}</span>}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="categoria">Categoría</label>
          <select
            id="categoria"
            name="categoria"
            value={formData.categoria}
            onChange={handleInputChange}
            required
            className={errors.categoria ? 'error' : ''}
          >
            <option value="">Seleccione una categoría</option>
            {categorias.map(categoria => (
              <option key={categoria.idCategoria} value={categoria.idCategoria}>
                {categoria.nombre}
              </option>
            ))}
          </select>
          {errors.categoria && <span className="error-message">{errors.categoria}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="imagen">Imagen del Producto</label>
          <input
            type="file"
            id="imagen"
            name="imagen"
            onChange={handleImageChange}
            accept="image/jpeg,image/png,image/gif"
            required={!esEdicion}
            className={errors.imagen ? 'error' : ''}
          />
          <small className="help-text">
            Formatos permitidos: JPEG, PNG, GIF. Tamaño máximo: 5MB
          </small>
          {errors.imagen && <span className="error-message">{errors.imagen}</span>}
          {previewImage && (
            <div className="image-preview">
              <img src={previewImage} alt="Vista previa" />
            </div>
          )}
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            className="btn-cancelar"
            onClick={() => navigate('/producto')}
            disabled={loading || Object.keys(errors).length > 0}
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            className="btn-guardar"
            disabled={loading || Object.keys(errors).length > 0}
          >
            {loading ? "Procesando..." : (esEdicion ? "Actualizar Producto" : "Crear Producto")}
          </button>
        </div>
      </form>
    </div>
  );
}


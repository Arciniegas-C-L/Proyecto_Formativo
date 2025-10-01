import React, { useState, useEffect } from "react";
import { Cloudinary } from "@cloudinary/url-gen";
import { fill } from "@cloudinary/url-gen/actions/resize";
import { toast } from "react-hot-toast";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Modal, Button } from "react-bootstrap";
import { FaQuestionCircle } from "react-icons/fa";
import "../../assets/css/Productos/ProductosForm.css";

import {
  getCategorias,
  getSubcategoriasPorCategoria,
  createProducto,
  updateProducto,
} from "../../api/Producto.api";

// Widget de Cloudinary
function CloudinaryUpload({ onUrl }) {
  const openWidget = () => {
    if (!window.cloudinary) {
      alert("Cloudinary widget no cargado");
      return;
    }
    window.cloudinary
      .createUploadWidget(
        {
          cloudName: "dkwr4gcpl",
          uploadPreset: "default-preset", // Asegúrate de crearlo en Cloudinary
        },
        (error, result) => {
          if (!error && result && result.event === "success") {
            onUrl(result.info.secure_url);
          }
        }
      )
      .open();
  };

  return (
    <button type="button" onClick={openWidget} style={{ marginBottom: 8 }}>
      Subir imagen
    </button>
  );
}

export function ProductosForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const productoEditar = location.state?.producto || null;

  const [formData, setFormData] = useState({
    nombre: productoEditar?.nombre || "",
    descripcion: productoEditar?.descripcion || "",
    precio: productoEditar?.precio ? String(productoEditar.precio) : "",
    stock: productoEditar?.stock ? String(productoEditar.stock) : "",
    categoria: productoEditar?.categoria
      ? String(productoEditar.categoria.idCategoria)
      : "",
    subcategoria: productoEditar?.subcategoria
      ? String(productoEditar.subcategoria.idSubcategoria)
      : "",
    imagen: productoEditar?.imagen || "",
  });

  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [cargandoSubcategorias, setCargandoSubcategorias] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);

  // Cargar categorías al montar
  useEffect(() => {
    loadCategorias();
  }, []);

  // Si vienes editando, fuerza la carga de subcategorías de su categoría al montar
  useEffect(() => {
    const catId = productoEditar?.categoria?.idCategoria;
    if (catId) {
      loadSubcategorias(String(catId));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intencional

  // Cuando cambia la categoría en el formulario, cargar subcategorías o limpiar
  useEffect(() => {
    if (formData.categoria) {
      loadSubcategorias(formData.categoria);
    } else {
      setSubcategorias([]);
      if (formData.subcategoria !== "") {
        setFormData((prev) => ({ ...prev, subcategoria: "" }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.categoria]);

  const loadCategorias = async () => {
    try {
      const res = await getCategorias();
      setCategorias(res.data || []);
    } catch {
      toast.error("Error al cargar categorías");
      setCategorias([]);
    }
  };

  const loadSubcategorias = async (categoriaId) => {
    setCargandoSubcategorias(true);
    try {
      const res = await getSubcategoriasPorCategoria(categoriaId);
      let list = res.data || [];

      // ✅ Solo filtra en cliente si viene info de categoría
      const hasCategoryInfo = list.some(
        (sub) =>
          sub?.categoria?.idCategoria !== undefined ||
          sub?.idCategoria !== undefined
      );

      if (hasCategoryInfo) {
        const catNum = Number(categoriaId);
        list = list.filter((sub) => {
          const byNested =
            sub?.categoria?.idCategoria !== undefined
              ? Number(sub.categoria.idCategoria) === catNum
              : null;
          const byFlat =
            sub?.idCategoria !== undefined
              ? Number(sub.idCategoria) === catNum
              : null;
          if (byNested !== null) return byNested;
          if (byFlat !== null) return byFlat;
          return false;
        });
      }
      // Si no hay info de categoría, asumimos que el backend ya filtró

      setSubcategorias(list);

      // Si la subcategoría seleccionada ya no pertenece a la categoría, limpiarla
      if (formData.subcategoria) {
        const stillValid = list.some(
          (s) => String(s.idSubcategoria) === String(formData.subcategoria)
        );
        if (!stillValid) {
          setFormData((prev) => ({ ...prev, subcategoria: "" }));
        }
      }
    } catch {
      toast.error("Error al cargar subcategorías");
      setSubcategorias([]);
    } finally {
      setCargandoSubcategorias(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // ✅ Reset subcategoría si cambia la categoría
    if (name === "categoria") {
      setFormData((prev) => ({
        ...prev,
        categoria: value,
        subcategoria: "",
      }));
      return; // el useEffect cargará subcategorías
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const errores = {};
    const subId = parseInt(formData.subcategoria, 10);
    const precioNum = Number(String(formData.precio).replace(",", "."));
    const stockNum = Number(formData.stock);

    if (!formData.nombre.trim()) errores.nombre = "El nombre es obligatorio";
    if (!formData.descripcion.trim())
      errores.descripcion = "La descripción es obligatoria";
    if (isNaN(precioNum) || precioNum <= 0) errores.precio = "Precio inválido";
    if (!Number.isInteger(stockNum) || stockNum < 0)
      errores.stock = "Stock inválido";
    if (!formData.categoria) errores.categoria = "Seleccione una categoría";
    if (!Number.isInteger(subId) || subId <= 0)
      errores.subcategoria = "Seleccione una subcategoría válida";
    if (
      !formData.imagen ||
      typeof formData.imagen !== "string" ||
      !formData.imagen.includes("res.cloudinary.com")
    ) {
      errores.imagen = "Debe subir una imagen válida de Cloudinary";
    }

    setErrors(errores);
    return Object.keys(errores).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    const precioNum = Number(String(formData.precio).replace(",", "."));
    const stockNum = Number(formData.stock);
    const subId = parseInt(formData.subcategoria, 10);

    // Usamos FormData para ser compatibles con tu backend
    const form = new FormData();
    form.append("nombre", formData.nombre.trim());
    form.append("descripcion", formData.descripcion.trim());
    form.append("precio", precioNum);
    form.append("stock", stockNum);
    form.append("categoria", formData.categoria);
    form.append("subcategoria", subId);
    form.append("imagen", formData.imagen); // URL de Cloudinary

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
        setSubcategorias([]);
      }
      navigate("/admin/productos");
    } catch (error) {
      console.error("Error guardando producto:", error);
      toast.error("Error al guardar el producto");
    } finally {
      setLoading(false);
    }
  };

  // Previsualización optimizada (si es Cloudinary)
  const renderPreview = () => {
    if (!formData.imagen || typeof formData.imagen !== "string") return null;

    if (!formData.imagen.includes("res.cloudinary.com")) {
      return (
        <div className="image-preview-error">
          <span style={{ color: "red" }}>
            La URL de la imagen no es válida para Cloudinary
          </span>
        </div>
      );
    }

    let imagenUrl = formData.imagen;
    const matches = imagenUrl.match(/upload\/(?:v\d+\/)?(.+)$/);
    const publicId = matches ? matches[1] : null;

    if (publicId) {
      const cld = new Cloudinary({ cloud: { cloudName: "dkwr4gcpl" } });
      imagenUrl = cld
        .image(publicId)
        .resize(fill().width(300).height(300))
        .toURL();
    }

    return (
      <div className="image-preview">
  <img src={imagenUrl} alt="Previsualización de producto" loading="lazy" />
      </div>
    );
  };

  return (
    <div className="form-container">
      <h2 className="form-title">
        {productoEditar ? "Editar producto" : "Crear producto"}
      </h2>

      <FaQuestionCircle
        size={22}
        style={{ cursor: "pointer", color: "#0d6efd" }}
        onClick={() => setMostrarModal(true)}
      />

      <Modal show={mostrarModal} onHide={() => setMostrarModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Próximo paso</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Ahora debes llenar cada campo según la información correspondiente del
          producto que deseas crear. Terminado esto dirígete a{" "}
          <Link to="/admin/inventario">
            <strong style={{ cursor: "pointer", color: "#0d6efd" }}>
              Inventario
            </strong>
          </Link>{" "}
          para continuar con la gestión de inventario.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setMostrarModal(false)}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>

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
              maxLength={20}
            />
            <span className="error-message">{errors.nombre}</span>
          </div>

          <div className="form-group">
            <label>Precio</label>
            <input
              type="text"
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
            <label>Stock Maximo de productos</label>
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
              {Array.isArray(categorias) &&
                categorias.map((cat) => (
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
            <option value="">
              {cargandoSubcategorias
                ? "Cargando..."
                : subcategorias.length
                ? "Seleccione una subcategoría"
                : "No hay subcategorías"}
            </option>
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
          <CloudinaryUpload
            onUrl={(url) => setFormData((prev) => ({ ...prev, imagen: url }))}
          />
          {renderPreview()}
          <span className="error-message">{errors.imagen}</span>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-guardar" disabled={loading}>
            {loading
              ? "Guardando..."
              : productoEditar
              ? "Actualizar"
              : "Crear"}
          </button>
        </div>
      </form>
    </div>
  );
}

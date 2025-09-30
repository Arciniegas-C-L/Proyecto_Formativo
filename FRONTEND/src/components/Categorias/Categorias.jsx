import React, { useState, useEffect } from "react";
import { createCategoria, getAllCategorias } from "../../api/Categoria.api";
import { createSubcategoria, getAllSubcategorias } from "../../api/Subcategoria.api";
import ListaCategorias from "./ListaCategorias";
import "../../assets/css/Categoria/Categorias.css";
import { FaQuestionCircle } from "react-icons/fa";
import { Modal, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast"; // ⬅️ NUEVO

function SubcategoriaForm({ subcategoria, onChange }) {
  return (
    <>
      <div className="row">
        <div className="col-md-6 mb-3">
          <label className="form-label fw-medium">Nombre Subcategoría</label>
          <input
            type="text"
            className="form-control custom-input"
            name="nombre"
            value={subcategoria.nombre}
            onChange={onChange}
            placeholder="Ingresa el nombre de la subcategoría"
            required
            maxLength={20}
          />
        </div>
        <div className="col-md-6 mb-3">
          <label className="form-label fw-medium">Stock Maximo</label>
          <input
            type="number"
            className="form-control custom-input"
            name="stockMinimo"
            value={subcategoria.stockMinimo}
            onChange={onChange}
            placeholder="0"
            min="0"
            required
          />
        </div>
      </div>

      <div className="form-check mb-4">
        <input
          type="checkbox"
          className="form-check-input custom-checkbox"
          name="estado"
          checked={!!subcategoria.estado}
          onChange={onChange}
          id="estadoSubcategoria"
        />
        <label className="form-check-label fw-medium" htmlFor="estadoSubcategoria">
          Subcategoría activa
        </label>
      </div>
    </>
  );
}

// ⬇️⬇️⬇️ Helper pequeño para mostrar mensajes de error claros
function parseApiError(err) {
  // Axios error shapes comunes
  const resp = err?.response;
  if (resp?.data) {
    // detail clásico
    if (typeof resp.data.detail === "string") return resp.data.detail;

    // Errores de validación: { campo: ["msg1", "msg2"] }
    if (typeof resp.data === "object") {
      // Intenta tomar el primer string que encuentre
      for (const key of Object.keys(resp.data)) {
        const val = resp.data[key];
        if (Array.isArray(val) && val.length && typeof val[0] === "string") {
          return `${key}: ${val[0]}`;
        }
        if (typeof val === "string") return `${key}: ${val}`;
      }
    }
  }
  // Mensaje genérico
  return err?.message || "Ocurrió un error inesperado";
}

export function CategoriaForm() {
  const [categoria, setCategoria] = useState({
    nombre: "",
    estado: true,
    usarSubcategorias: true, // Siempre true ahora
  });

  const [subcategoria, setSubcategoria] = useState({
    nombre: "",
    estado: true,
    stockMinimo: 0,
  });

  const [categorias, setCategorias] = useState([]);
  const [modoCategoria, setModoCategoria] = useState("nueva");
  const [categoriaExistenteId, setCategoriaExistenteId] = useState("");
  const [modoVista, setModoVista] = useState("formulario");
  const [mostrarModal, setMostrarModal] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const categoriasData = await getAllCategorias();
      const subcategoriasData = await getAllSubcategorias();

      const cats = Array.isArray(categoriasData) ? categoriasData : (categoriasData?.data ?? []);
      const subs = Array.isArray(subcategoriasData) ? subcategoriasData : (subcategoriasData?.data ?? []);

      const categoriasConSubcategorias = cats.map((cat) => ({
        ...cat,
        subcategorias: subs.filter((sub) => sub.categoria === cat.idCategoria),
      }));

      setCategorias(categoriasConSubcategorias);
      // ✅ Opcional: toast suave indicando que se cargó (solo al montar puede ser ruidoso, por eso lo dejo sin loading)
      // toast.success("Datos cargados");
    } catch (error) {
      console.error("Error cargando datos", error);
      toast.error(`Error cargando datos: ${parseApiError(error)}`);
    }
  };

  const handleCategoriaChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCategoria((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubcategoriaChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSubcategoria((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let idCategoria = null;

      if (modoCategoria === "nueva") {
        const nuevaCategoria = await createCategoria({
          nombre: categoria.nombre,
          estado: Boolean(categoria.estado),
        });
        const payload = nuevaCategoria?.data ?? nuevaCategoria;
        idCategoria = payload?.idCategoria;
      } else {
        if (!categoriaExistenteId) {
          toast.error("Debes seleccionar una categoría existente");
          return;
        }
        idCategoria = categoriaExistenteId;
      }

      if (!idCategoria) {
        toast.error("No se pudo obtener el ID de la categoría.");
        return;
      }

      // Siempre crear subcategoría ya que es obligatorio
      const loadingId = toast.loading("Guardando información…");
      try {
        await createSubcategoria({
          nombre: subcategoria.nombre,
          estado: Boolean(subcategoria.estado),
          stockMinimo: Number(subcategoria.stockMinimo) || 0,
          categoria: Number(idCategoria),
        });

        setCategoria({ nombre: "", estado: true, usarSubcategorias: true });
        setSubcategoria({ nombre: "", estado: true, stockMinimo: 0 });
        setModoCategoria("nueva");
        setCategoriaExistenteId("");

        await cargarDatos();
        setModoVista("lista");

        toast.success("Guardado correctamente", { id: loadingId });
      } catch (errSub) {
        toast.error(`Error al crear subcategoría: ${parseApiError(errSub)}`, { id: loadingId });
      }
    } catch (error) {
      console.error("Error al crear categoría o subcategoría", error);
      toast.error(`Error al crear categoría o subcategoría: ${parseApiError(error)}`);
    }
  };

  return (
    <div className="container-fluid px-4 py-4">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-10 col-xl-8">
          {/* Icono de ayuda */}
          <FaQuestionCircle
            size={22}
            style={{ cursor: "pointer", color: "#e7561dff" }}
            onClick={() => setMostrarModal(true)}
          />
          {/* Modal emergente */}
          <Modal show={mostrarModal} onHide={() => setMostrarModal(false)} centered>
            <Modal.Header closeButton>
              <Modal.Title>Próximo paso</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              Después de crear una categoría y la subcategoría correspondiente, dirígete a{" "}
              <Link to="/admin/tallas/grupo">
                <strong style={{ cursor: "pointer", color: "#0d6efd" }}>Grupo de Tallas</strong>
              </Link>{" "}
              para continuar con la gestión de tallas.
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setMostrarModal(false)}>
                Cerrar
              </Button>
            </Modal.Footer>
          </Modal>

          {/* Header */}
          <div className="text-center mb-4">
            <h1 className="display-6 fw-bold text-primary mb-3">Gestión de Categorías</h1>
            <button
              type="button"
              className="btn btn-outline-primary px-4"
              onClick={() =>
                setModoVista(modoVista === "formulario" ? "lista" : "formulario")
              }
            >
              {modoVista === "formulario" ? "Ver Lista de Categorías" : "Crear Nueva Categoría"}
            </button>
          </div>

          {modoVista === "formulario" ? (
            <div className="card shadow-sm border-0 custom-card">
              <div className="card-body p-4">
                <form onSubmit={handleSubmit}>
                  {/* Selector de Modo */}
                  <div className="mb-4">
                    <label className="form-label fw-semibold text-secondary mb-3">
                      Selecciona el modo de creación
                    </label>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <button
                          type="button"
                          className={`btn w-100 py-3 fw-medium ${
                            modoCategoria === "nueva" ? "btn-primary" : "btn-outline-primary"
                          }`}
                          onClick={() => setModoCategoria("nueva")}
                        >
                          <i className="fas fa-plus-circle me-2"></i>
                          Crear Nueva Categoría
                        </button>
                      </div>
                      <div className="col-md-6">
                        <button
                          type="button"
                          className={`btn w-100 py-3 fw-medium ${
                            modoCategoria === "existente" ? "btn-primary" : "btn-outline-primary"
                          }`}
                          onClick={() => setModoCategoria("existente")}
                        >
                          <i className="fas fa-list me-2"></i>
                          Usar Categoría Existente
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Campos de Categoría */}
                  {modoCategoria === "nueva" ? (
                    <div className="row">
                      <div className="col-md-8 mb-3">
                        <label className="form-label fw-medium">Nombre de la Categoría</label>
                        <input
                          type="text"
                          className="form-control custom-input"
                          name="nombre"
                          value={categoria.nombre}
                          onChange={handleCategoriaChange}
                          placeholder="Ingresa el nombre de la categoría"
                          required
                          maxLength={20}
                        />
                      </div>
                      <div className="col-md-4 d-flex align-items-end mb-3">
                        <div className="form-check">
                          <input
                            type="checkbox"
                            className="form-check-input custom-checkbox"
                            name="estado"
                            checked={!!categoria.estado}
                            onChange={handleCategoriaChange}
                            id="estadoCategoria"
                          />
                          <label className="form-check-label fw-medium" htmlFor="estadoCategoria">
                            Categoría activa
                          </label>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-4">
                      <label className="form-label fw-medium">Seleccionar Categoría Existente</label>
                      <select
                        className="form-select custom-select"
                        value={categoriaExistenteId}
                        onChange={(e) => setCategoriaExistenteId(e.target.value)}
                        required
                      >
                        <option value="">-- Selecciona una categoría --</option>
                        {categorias.map((cat) => (
                          <option key={cat.idCategoria} value={cat.idCategoria}>
                            {cat.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Sección Subcategoría (siempre visible) */}
                  <div className="subcategoria-card">
                    <div className="subcategoria-card-header">
                      <h5 className="mb-0">
                        <i className="fas fa-layer-group me-2"></i>
                        Información de la Subcategoría
                      </h5>
                    </div>
                    <hr className="subcategoria-divider" />
                    <div className="subcategoria-card-body">
                      <SubcategoriaForm
                        subcategoria={subcategoria}
                        onChange={handleSubcategoriaChange}
                      />
                    </div>
                  </div>

                  {/* Botón Guardar */}
                  <div className="d-flex justify-content-center mt-4">
                    <button type="submit" className="btn btn-primary btn-lg px-5 py-2 fw-medium">
                      <i className="fas fa-save me-2"></i>
                      Guardar Información
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="card shadow-sm border-0">
              <div className="card-body p-0">
                <ListaCategorias
                  categorias={categorias}
                  onCategoriasActualizadas={cargarDatos}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { createCategoria, getAllCategorias } from "../../api/Categoria.api";
import { createSubcategoria, getAllSubcategorias } from "../../api/Subcategoria.api";
import ListaCategorias from "./ListaCategorias";

function SubcategoriaForm({ subcategoria, onChange }) {
  return (
    <>
      <div className="mb-3">
        <label className="form-label">Nombre Subcategoría</label>
        <input
          type="text"
          className="form-control"
          name="nombre"
          value={subcategoria.nombre}
          onChange={onChange}
          required
        />
      </div>

      <div className="form-check mb-3">
        <input
          type="checkbox"
          className="form-check-input"
          name="estado"
          checked={subcategoria.estado}
          onChange={onChange}
          id="estadoSubcategoria"
        />
        <label className="form-check-label" htmlFor="estadoSubcategoria">
          Activa
        </label>
      </div>
    </>
  );
}

export function CategoriaForm() {
  const [categoria, setCategoria] = useState({
    nombre: "",
    estado: true,
    usarSubcategorias: false,
  });

  const [subcategoria, setSubcategoria] = useState({
    nombre: "",
    estado: true,
  });

  const [categorias, setCategorias] = useState([]);
  const [modoCategoria, setModoCategoria] = useState("nueva"); // "nueva" o "existente"
  const [categoriaExistenteId, setCategoriaExistenteId] = useState("");
  const [modoVista, setModoVista] = useState("formulario"); // "formulario" o "lista"

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const categoriasData = await getAllCategorias();
      const subcategoriasData = await getAllSubcategorias();

      const categoriasConSubcategorias = categoriasData.map((cat) => ({
        ...cat,
        subcategorias: subcategoriasData.filter(
          (sub) => sub.categoria === cat.idCategoria
        ),
      }));

      setCategorias(categoriasConSubcategorias);
    } catch (error) {
      console.error("Error cargando datos", error);
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
          estado: categoria.estado,
        });
        idCategoria = nuevaCategoria.idCategoria;
      } else {
        if (!categoriaExistenteId) {
          alert("Debes seleccionar una categoría existente");
          return;
        }
        idCategoria = categoriaExistenteId;
      }

      if (categoria.usarSubcategorias) {
        await createSubcategoria({
          nombre: subcategoria.nombre,
          estado: subcategoria.estado,
          categoria: idCategoria,
        });
      }

      setCategoria({ nombre: "", estado: true, usarSubcategorias: false });
      setSubcategoria({ nombre: "", estado: true });
      setModoCategoria("nueva");
      setCategoriaExistenteId("");

      alert("Guardado correctamente");
      await cargarDatos();
    } catch (error) {
      console.error("Error al crear categoría o subcategoría", error);
      alert("Error al crear categoría o subcategoría. Revisa la consola.");
    }
  };

  return (
    <div className="container mt-4">
      <h2>Gestión de Categorías</h2>

      <button
        type="button"
        className="btn btn-secondary mb-3"
        onClick={() =>
          setModoVista(modoVista === "formulario" ? "lista" : "formulario")
        }
      >
        {modoVista === "formulario" ? "Ver Categorías" : "Volver al Formulario"}
      </button>

      {modoVista === "formulario" ? (
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label d-block">Selecciona el modo</label>
            <div className="btn-group" role="group" aria-label="Modo de categoría">
              <button
                type="button"
                className={`btn ${
                  modoCategoria === "nueva" ? "btn-primary" : "btn-outline-primary"
                }`}
                onClick={() => setModoCategoria("nueva")}
              >
                Crear nueva categoría
              </button>
              <button
                type="button"
                className={`btn ${
                  modoCategoria === "existente"
                    ? "btn-success"
                    : "btn-outline-success"
                }`}
                onClick={() => setModoCategoria("existente")}
              >
                Usar categoría existente
              </button>
            </div>
          </div>

          {modoCategoria === "nueva" ? (
            <>
              <div className="mb-3">
                <label className="form-label">Nombre Categoría</label>
                <input
                  type="text"
                  className="form-control"
                  name="nombre"
                  value={categoria.nombre}
                  onChange={handleCategoriaChange}
                  required
                />
              </div>

              <div className="form-check mb-3">
                <input
                  type="checkbox"
                  className="form-check-input"
                  name="estado"
                  checked={categoria.estado}
                  onChange={handleCategoriaChange}
                  id="estadoCategoria"
                />
                <label className="form-check-label" htmlFor="estadoCategoria">
                  Activa
                </label>
              </div>
            </>
          ) : (
            <div className="mb-3">
              <label className="form-label">Seleccionar categoría</label>
              <select
                className="form-select"
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

          <div className="form-check mb-3">
            <input
              type="checkbox"
              className="form-check-input"
              name="usarSubcategorias"
              checked={categoria.usarSubcategorias}
              onChange={handleCategoriaChange}
              id="usarSubcategorias"
            />
            <label className="form-check-label" htmlFor="usarSubcategorias">
              ¿Agregar Subcategoría?
            </label>
          </div>

          {categoria.usarSubcategorias && (
            <div className="border p-3 mb-3">
              <h5>Subcategoría</h5>
              <SubcategoriaForm
                subcategoria={subcategoria}
                onChange={handleSubcategoriaChange}
              />
            </div>
          )}

          <button type="submit" className="btn btn-primary">
            Guardar
          </button>
        </form>
      ) : (
        <ListaCategorias categorias={categorias} />
      )}
    </div>
  );
}

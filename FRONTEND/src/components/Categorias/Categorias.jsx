import React, { useState, useEffect } from "react";
import { createCategoria, getAllCategorias } from "../../api/Categoria.api";
import { createSubcategoria, getAllSubcategorias } from "../../api/Subcategoria.api";
import {ListaCategorias} from "./ListaCategorias";
import "../../assets/css/Categoria/Categorias.css";

function SubcategoriaForm({ subcategoria, onChange }) {
  return (
    <>
      <div className="mb-3">
        <label className="form-label">Nombre Subcategoría</label>
        <input
          type="text"
          className="input-text"
          name="nombre"
          value={subcategoria.nombre}
          onChange={onChange}
          required
        />
      </div>

      <div className="mb-3">
        <label className="form-label">Stock Mínimo</label>
        <input
          type="number"
          className="input-text"
          name="stockMinimo"
          value={subcategoria.stockMinimo}
          onChange={onChange}
          min="0"
          required
        />
      </div>

      <div className="form-check mb-3">
        <input
          type="checkbox"
          className="input-check"
          name="estado"
          checked={!!subcategoria.estado}
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
    stockMinimo: 0,
  });

  const [categorias, setCategorias] = useState([]);
  const [modoCategoria, setModoCategoria] = useState("nueva"); // "nueva" | "existente"
  const [categoriaExistenteId, setCategoriaExistenteId] = useState("");
  const [modoVista, setModoVista] = useState("formulario"); // "formulario" | "lista"

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
          estado: Boolean(categoria.estado),
        });
        // soporta respuesta como objeto plano o {data: {...}}
        const payload = nuevaCategoria?.data ?? nuevaCategoria;
        idCategoria = payload?.idCategoria;
      } else {
        if (!categoriaExistenteId) {
          alert("Debes seleccionar una categoría existente");
          return;
        }
        idCategoria = categoriaExistenteId;
      }

      if (!idCategoria) {
        alert("No se pudo obtener el ID de la categoría.");
        return;
      }

      if (categoria.usarSubcategorias) {
        await createSubcategoria({
          nombre: subcategoria.nombre,
          estado: Boolean(subcategoria.estado),
          stockMinimo: Number(subcategoria.stockMinimo) || 0,
          categoria: Number(idCategoria),
        });
      }

      // Reset del formulario
      setCategoria({ nombre: "", estado: true, usarSubcategorias: false });
      setSubcategoria({ nombre: "", estado: true, stockMinimo: 0 });
      setModoCategoria("nueva");
      setCategoriaExistenteId("");

      // Refresca y pasa a la vista de lista para poder eliminar/interactuar
      await cargarDatos();
      setModoVista("lista");

      alert("Guardado correctamente");
    } catch (error) {
      console.error("Error al crear categoría o subcategoría", error);
      alert("Error al crear categoría o subcategoría. Revisa la consola.");
    }
  };

  return (
    <div className="categorias-container container mt-4">
      <h2 className="titulo-principal">Gestión de Categorías</h2>

      <button
        type="button"
        className="btn-secundario mb-3"
        onClick={() =>
          setModoVista(modoVista === "formulario" ? "lista" : "formulario")
        }
      >
        {modoVista === "formulario" ? "Ver Categorías" : "Volver al Formulario"}
      </button>

      {modoVista === "formulario" ? (
        <form onSubmit={handleSubmit} className="form-categorias">
          {/* Botones modo categoría */}
          <div className="mb-3">
            <label className="form-label d-block">Selecciona el modo</label>
            <div className="btn-group-custom" role="group" aria-label="Modo de categoría">
              <button
                type="button"
                className={`btn-toggle nueva ${modoCategoria === "nueva" ? "activo" : ""}`}
                onClick={() => setModoCategoria("nueva")}
              >
                Crear nueva categoría
              </button>
              <button
                type="button"
                className={`btn-toggle existente ${modoCategoria === "existente" ? "activo" : ""}`}
                onClick={() => setModoCategoria("existente")}
              >
                Usar categoría existente
              </button>
            </div>
          </div>

          {/* Formulario de categoría */}
          {modoCategoria === "nueva" ? (
            <>
              <div className="mb-3">
                <label className="form-label">Nombre Categoría</label>
                <input
                  type="text"
                  className="input-text"
                  name="nombre"
                  value={categoria.nombre}
                  onChange={handleCategoriaChange}
                  required
                />
              </div>

              <div className="form-check mb-3">
                <input
                  type="checkbox"
                  className="input-check"
                  name="estado"
                  checked={!!categoria.estado}
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
                className="input-select"
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

          {/* Subcategoría */}
          <div className="form-check mb-3">
            <input
              type="checkbox"
              className="input-check"
              name="usarSubcategorias"
              checked={!!categoria.usarSubcategorias}
              onChange={handleCategoriaChange}
              id="usarSubcategorias"
            />
            <label className="form-check-label" htmlFor="usarSubcategorias">
              ¿Agregar Subcategoría?
            </label>
          </div>

          {categoria.usarSubcategorias && (
            <div className="subcategoria-box">
              <h5>Subcategoría</h5>
              <SubcategoriaForm
                subcategoria={subcategoria}
                onChange={handleSubcategoriaChange}
              />
            </div>
          )}

          <button type="submit" className="btn-guardar">
            Guardar
          </button>
        </form>
      ) : (
        // Vista de LISTA (aquí podrás eliminar/editar)
        <ListaCategorias
          categorias={categorias}
          // Si tu ListaCategorias expone callbacks (onDelete/onUpdate), puedes pasarlos y luego llamar a cargarDatos()
          // onDeleted={cargarDatos}
          // onUpdated={cargarDatos}
        />
      )}
    </div>
  );
}

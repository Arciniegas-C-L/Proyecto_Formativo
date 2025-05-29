import React, { useState } from "react";
import { createCategoria } from "../../api/Categoria.api";
import { createSubcategoria } from "../../api/Subcategoria.api";

// Componente interno para el formulario de subcategoría
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

// Componente principal exportado para crear categoría (y opcionalmente subcategoría)
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
      // Crear la categoría
      const nuevaCategoria = await createCategoria({
        nombre: categoria.nombre,
        estado: categoria.estado,
      });

      // Si usarSubcategorias es true, crear la subcategoría ligada a la categoría creada
      if (categoria.usarSubcategorias) {
        await createSubcategoria({
          nombre: subcategoria.nombre,
          estado: subcategoria.estado,
          categoria: nuevaCategoria.idCategoria, // Ajusta según tu API
        });
      }

      // Resetear formularios
      setCategoria({ nombre: "", estado: true, usarSubcategorias: false });
      setSubcategoria({ nombre: "", estado: true });

      alert("Categoría y subcategoría creadas correctamente");
    } catch (error) {
      console.error("Error al crear categoría o subcategoría", error);
      alert("Error al crear categoría o subcategoría");
    }
  };

  return (
    <div className="container mt-4">
      <h2>Crear Categoría</h2>
      <form onSubmit={handleSubmit}>
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
            ¿Usar Subcategorías?
          </label>
        </div>

        {categoria.usarSubcategorias && (
          <div className="border p-3 mb-3">
            <h5>Crear Subcategoría</h5>
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
    </div>
  );
}

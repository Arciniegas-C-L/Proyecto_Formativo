import React, { useEffect, useState } from "react";
import {
  fetchProveedores,
  createProveedor,
  updateProveedor,
} from "../../api/Proveedor.api.js";
import { useNavigate } from "react-router-dom";
import "../../assets/css/Proveedores/Proveedores.css";

// Componente que permite registrar o editar proveedores
export function AdminProveedores({ proveedorEditar, onEditComplete }) {
  // Estado para almacenar los datos del formulario
  const [form, setForm] = useState({
    nombre: "",
    correo: "",
    telefono: "",
    tipo: "nacional",
  });

  // Estado que almacena el ID del proveedor en caso de edición
  const [editingId, setEditingId] = useState(null);

  // Hook de navegación para redirigir a otra vista
  const navigate = useNavigate();

  // useEffect para cargar los datos del proveedor si se está editando
  useEffect(() => {
    if (proveedorEditar) {
      setForm({
        nombre: proveedorEditar.nombre,
        correo: proveedorEditar.correo,
        telefono: proveedorEditar.telefono,
        tipo: proveedorEditar.tipo,
      });
      setEditingId(proveedorEditar.idProveedor);
    }
  }, [proveedorEditar]);

  // Función para redirigir a la vista de proveedores registrados
  const handleVerProveedores = () => {
    navigate("/proveedores_registrados");
  };

  // Función para manejar el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        // Si hay un ID, se actualiza el proveedor existente
        await updateProveedor(editingId, form);
      } else {
        // Si no hay ID, se crea un nuevo proveedor
        await createProveedor(form);
      }

      // Se reinicia el formulario después de guardar
      setEditingId(null);
      setForm({
        nombre: "",
        correo: "",
        telefono: "",
        tipo: "nacional",
      });

      // Si se proporciona una función para notificar que terminó la edición
      if (onEditComplete) onEditComplete();
    } catch (error) {
      console.error(
        "Error al registrar proveedor:",
        error.response?.data || error.message
      );
    }
  };

  return (
    <>
      {/* Título principal */}
      <h2 className="title">Registrar Proveedor</h2>

      {/* Formulario para registrar o actualizar proveedor */}
      <form className="form" onSubmit={handleSubmit}>
        {/* Campo: Nombre */}
        <input
          className="input"
          type="text"
          placeholder="Nombre del proveedor"
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          required
        />

        {/* Campo: Correo electrónico */}
        <input
          className="input"
          type="email"
          placeholder="Correo electrónico"
          value={form.correo}
          onChange={(e) => setForm({ ...form, correo: e.target.value })}
          required
        />

        {/* Campo: Teléfono */}
        <input
          className="input"
          type="tel"
          placeholder="Número de teléfono"
          value={form.telefono}
          onChange={(e) => setForm({ ...form, telefono: e.target.value })}
          required
        />

        {/* Campo: Tipo de proveedor */}
        <select
          className="input"
          value={form.tipo}
          onChange={(e) => setForm({ ...form, tipo: e.target.value })}
        >
          <option value="nacional">Nacional</option>
          <option value="importado">Importado</option>
        </select>

        {/* Botones de acción: Registrar / Actualizar / Cancelar */}
        <div className="button-row">
          <button className="btn btn-save" type="submit">
            {editingId ? "Actualizar" : "Registrar"}
          </button>

          {/* Solo se muestra el botón de cancelar si se está editando */}
          {editingId && (
            <button
              className="btn btn-cancel"
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm({
                  nombre: "",
                  correo: "",
                  telefono: "",
                  tipo: "nacional",
                });
                if (onEditComplete) onEditComplete();
              }}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      {/* Botón para ver proveedores ya registrados */}
      <div className="button-row" style={{ marginTop: "15px" }}>
        <button
          className="btn btn-view"
          type="button"
          onClick={handleVerProveedores}
        >
          Ver Proveedores Registrados
        </button>
      </div>
    </>
  );
}
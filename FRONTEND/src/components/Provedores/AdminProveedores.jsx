import React, { useEffect, useState } from "react";
import {
  fetchProveedores,
  createProveedor,
  updateProveedor,
} from "../../api/Proveedor.api.js";
import { useNavigate } from "react-router-dom";
import "../../assets/css/Proveedores.css";


export function AdminProveedores({ proveedorEditar, onEditComplete }) {
  // Estado local para el formulario del proveedor (nombre, correo, teléfono, tipo)
const [form, setForm] = useState({
  nombre: "",
  correo: "",
  telefono: "",
  tipo: "nacional", // Valor por defecto
});

// Estado para guardar el ID del proveedor que se está editando (null si se está creando uno nuevo)
const [editingId, setEditingId] = useState(null);

// Hook para redireccionar entre rutas
const navigate = useNavigate();

// useEffect que se ejecuta cuando `proveedorEditar` cambia.
// Si existe, significa que estamos en modo edición, por lo que rellenamos el formulario con sus datos.
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

// Función que redirige a la ruta de proveedores registrados
const handleVerProveedores = () => {
  navigate("/proveedores_registrados");
};

// Función que maneja el envío del formulario
const handleSubmit = async (e) => {
  e.preventDefault(); // Previene el comportamiento por defecto del formulario

  try {
    // Si hay un `editingId`, estamos en modo edición, así que se actualiza el proveedor
    if (editingId) {
      await updateProveedor(editingId, form);
    } else {
      // Si no hay ID, es un nuevo proveedor
      await createProveedor(form);
    }

    // Limpiamos el formulario y salimos del modo edición
    setEditingId(null);
    setForm({
      nombre: "",
      correo: "",
      telefono: "",
      tipo: "nacional",
    });

    // Si se proporcionó un callback al completar la edición, se ejecuta
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
      <div className="container">
        <h2 className="title">Gestión de Proveedores</h2>
        <form className="form" onSubmit={handleSubmit}>
          <input
            className="input"
            type="text"
            placeholder="Nombre"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            required
          />
          <input
            className="input"
            type="email"
            placeholder="Correo"
            value={form.correo}
            onChange={(e) => setForm({ ...form, correo: e.target.value })}
            required
          />
          <input
            className="input"
            type="tel"
            placeholder="Teléfono"
            value={form.telefono}
            onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            required
          />

          <select
            className="input"
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value })}
          >
            <option value="nacional">Nacional</option>
            <option value="importado">Importado</option>
          </select>

          <div className="button-row">
            <button className="btn btn-save" type="submit">
              {editingId ? "Actualizar Proveedor" : "Registrar Proveedor"}
            </button>
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
      </div>

      <div style={{ marginTop: "20px", textAlign: "center" }}>
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

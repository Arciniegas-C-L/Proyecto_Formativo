import React, { useEffect, useState } from "react";
import { createProveedor, updateProveedor } from "../../api/Proveedor.api.js";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx"; // <-- .jsx si tu proyecto lo requiere
import "../../assets/css/Proveedores/Proveedores.css";

// Componente que permite registrar o editar proveedores
export function AdminProveedores({ proveedorEditar, onEditComplete }) {
  const { autenticado, rol } = useAuth();

  const [form, setForm] = useState({
    nombre: "",
    correo: "",
    telefono: "",
    tipo: "nacional",
  });
  const [editingId, setEditingId] = useState(null);
  const navigate = useNavigate();

  // Carga datos si estamos en edición
  useEffect(() => {
    if (proveedorEditar) {
      setForm({
        nombre: proveedorEditar?.nombre ?? "",
        correo: proveedorEditar?.correo ?? "",
        telefono: proveedorEditar?.telefono ?? "",
        tipo: proveedorEditar?.tipo ?? "nacional",
      });
      // Ajusta aquí el id según lo que realmente te llega:
      setEditingId(proveedorEditar?.idProveedor ?? proveedorEditar?.id ?? null);
    }
  }, [proveedorEditar]);

  const handleVerProveedores = () => {
    // En tus rutas, la vista de registrados está en /administrador
    navigate("/administrador");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateProveedor(editingId, form);
      } else {
        await createProveedor(form);
      }

      // Reset
      setEditingId(null);
      setForm({
        nombre: "",
        correo: "",
        telefono: "",
        tipo: "nacional",
      });

      onEditComplete?.();
    } catch (error) {
      console.error(
        "Error al registrar proveedor:",
        error?.response?.data || error?.message
      );
    }
  };

  // Protección por sesión/rol (una sola vez)
  if (!autenticado) {
    return (
      <div className="container">
        <h2 className="title">Gestión de Proveedores</h2>
        <p>Debes iniciar sesión para acceder a esta sección.</p>
      </div>
    );
  }

  if (rol !== "administrador") {
    return (
      <div className="container">
        <h2 className="title">Gestión de Proveedores</h2>
        <p>No tienes permisos para registrar o editar proveedores.</p>
      </div>
    );
  }

  return (
    <>
      <h2 className="title">{editingId ? "Editar Proveedor" : "Registrar Proveedor"}</h2>

      <form className="form" onSubmit={handleSubmit}>
        <input
          className="input"
          type="text"
          placeholder="Nombre del proveedor"
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          required
        />

        <input
          className="input"
          type="email"
          placeholder="Correo electrónico"
          value={form.correo}
          onChange={(e) => setForm({ ...form, correo: e.target.value })}
          required
        />

        <input
          className="input"
          type="tel"
          placeholder="Número de teléfono"
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
            {editingId ? "Actualizar" : "Registrar"}
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
                onEditComplete?.();
              }}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="button-row" style={{ marginTop: "15px" }}>
        <button className="btn btn-view" type="button" onClick={handleVerProveedores}>
          Ver Proveedores Registrados
        </button>
      </div>
    </>
  );
}

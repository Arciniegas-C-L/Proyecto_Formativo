import React, { useEffect, useState } from "react";
import {
  fetchProveedores,
  createProveedor,
  updateProveedor,
} from "../api/Proveedor.api.js";
import { useNavigate } from "react-router-dom";
import "../assets/css/Proveedores.css";

export function AdminProveedores({ proveedorEditar, onEditComplete }) {
  const [form, setForm] = useState({
    nombre: "",
    correo: "",
    telefono: "",
    tipo: "nacional",
  });
  const [editingId, setEditingId] = useState(null);
  const navigate = useNavigate();

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

  const handleVerProveedores = () => {
    navigate("/proveedores_registrados");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateProveedor(editingId, form);
      } else {
        await createProveedor(form);
      }

      setEditingId(null);
      setForm({
        nombre: "",
        correo: "",
        telefono: "",
        tipo: "nacional",
      });

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

import React, { useEffect, useState } from "react";
import { createProveedor, updateProveedor } from "../../api/Proveedor.api.js";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx"; 
import "../../assets/css/Proveedores/Proveedores.css";
import "../../assets/css/Proveedores/ProveedorRegistro.css";
import { FaCheck, FaTimes } from "react-icons/fa";

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

  // Estado para el toast
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  // Función para mostrar toast
  const mostrarToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "" });
    }, 3000);
  };

  // Carga datos si estamos en edición
  useEffect(() => {
    if (proveedorEditar) {
      setForm({
        nombre: proveedorEditar?.nombre ?? "",
        correo: proveedorEditar?.correo ?? "",
        telefono: proveedorEditar?.telefono ?? "",
        tipo: proveedorEditar?.tipo ?? "nacional",
      });
      setEditingId(proveedorEditar?.idProveedor ?? proveedorEditar?.id ?? null);
    }
  }, [proveedorEditar]);

  // Función para navegar a la lista de proveedores
  const handleVerProveedores = () => {
    navigate("/admin/proveedores/registrados"); // ruta nueva definida para la lista
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateProveedor(editingId, form);
        mostrarToast("Proveedor actualizado exitosamente", "success");
      } else {
        await createProveedor(form);
        mostrarToast("Proveedor registrado exitosamente", "success");
      }

      // Reset del formulario
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
      mostrarToast(
        editingId ? "Error al actualizar el proveedor" : "Error al registrar el proveedor", 
        "error"
      );
    }
  };

  const handleCancelar = () => {
    setEditingId(null);
    setForm({
      nombre: "",
      correo: "",
      telefono: "",
      tipo: "nacional",
    });
    onEditComplete?.();
    mostrarToast("Edición cancelada", "error");
  };

  // Protección por sesión/rol
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
      {/* Toast de notificaciones */}
      {toast.show && (
        <div className="toast-notification">
          <div className={`toast-content ${toast.type}`}>
            <div className="toast-icon">
              {toast.type === "success" ? <FaCheck /> : <FaTimes />}
            </div>
            <span className="toast-message">{toast.message}</span>
          </div>
        </div>
      )}

      <h2 className="title">{editingId ? "Editar Proveedor" : "Registrar Proveedor"}</h2>

      <form className="form" onSubmit={handleSubmit}>
        <input
          className="input"
          type="text"
          placeholder="Nombre del proveedor"
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          maxLength={50}
          required
        />

        <input
          className="input"
          type="email"
          placeholder="Correo electrónico"
          value={form.correo}
          onChange={(e) => setForm({ ...form, correo: e.target.value })}
          required
          maxLength={40}
        />

        <input
          className="input"
          type="tel"
          placeholder="Número de teléfono"
          value={form.telefono}
          onChange={(e) => setForm({ ...form, telefono: e.target.value })}
          maxLength={20}
          minLength={10}
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
              onClick={handleCancelar}
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
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUsuario } from "../../api/Usuario.api.js";

const AdminUsuarios = () => {
  const navigate = useNavigate();

  // Estado inicial del formulario
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    correo: "",
    password: "",
    telefono: "",
    rol: "usuario",
    estado: "activo",
  });

  // Manejo de cambios en inputs
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await registerUsuario(form);
      alert("Usuario registrado con éxito ✅");

      // Reiniciar formulario
      setForm({
        nombre: "",
        apellido: "",
        correo: "",
        password: "",
        telefono: "",
        rol: "usuario",
        estado: "activo",
      });

      // Redirigir automáticamente a la lista
      navigate("/lista-usuarios");
    } catch (error) {
      console.error("Error al registrar usuario:", error);
      alert("❌ Error al registrar usuario");
    }
  };

  return (
    <div className="container mt-4">
      <h2>Registrar Usuario</h2>
      <form onSubmit={handleSubmit} className="row g-3">
        {/* Nombre */}
        <div className="col-md-6">
          <label className="form-label">Nombre</label>
          <input
            type="text"
            className="form-control"
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            required
          />
        </div>

        {/* Apellido */}
        <div className="col-md-6">
          <label className="form-label">Apellido</label>
          <input
            type="text"
            className="form-control"
            name="apellido"
            value={form.apellido}
            onChange={handleChange}
            required
          />
        </div>

        {/* Correo */}
        <div className="col-md-6">
          <label className="form-label">Correo</label>
          <input
            type="email"
            className="form-control"
            name="correo"
            value={form.correo}
            onChange={handleChange}
            required
          />
        </div>

        {/* Contraseña */}
        <div className="col-md-6">
          <label className="form-label">Contraseña</label>
          <input
            type="password"
            className="form-control"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
          />
        </div>

        {/* Teléfono */}
        <div className="col-md-6">
          <label className="form-label">Teléfono</label>
          <input
            type="tel"
            className="form-control"
            name="telefono"
            value={form.telefono}
            onChange={handleChange}
            required
          />
        </div>

        {/* Rol */}
        <div className="col-md-3">
          <label className="form-label">Rol</label>
          <select
            className="form-select"
            name="rol"
            value={form.rol}
            onChange={handleChange}
          >
            <option value="usuario">Usuario</option>
            <option value="admin">Administrador</option>
          </select>
        </div>

        {/* Estado */}
        <div className="col-md-3">
          <label className="form-label">Estado</label>
          <select
            className="form-select"
            name="estado"
            value={form.estado}
            onChange={handleChange}
          >
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
        </div>

        {/* Botones */}
        <div className="col-12 d-flex gap-2">
          <button type="submit" className="btn btn-primary">
            Registrar Usuario
          </button>
          {/* 🔹 Botón para redirigir a lista de usuarios */}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate("/lista-usuarios")}
          >
            Ver Lista de Usuarios
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminUsuarios;
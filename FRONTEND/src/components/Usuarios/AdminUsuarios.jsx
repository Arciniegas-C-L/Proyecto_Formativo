import React, { useState,} from "react";
import { useNavigate } from "react-router-dom";
import { registerUsuario } from "../../api/Usuario.api"; 

const AdminUsuarios = () => {
  const navigate = useNavigate();

  // Estado para manejar los datos del formulario
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    correo: "",
    password: "",
    telefono: "",
    rol: "",
    estado: "true", // por defecto activo
  });

  // Manejar cambios en los inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Convertimos estado a boolean y rol a número antes de enviarlo
      const payload = {
        ...formData,
        estado: formData.estado === "true", // "true"/"false" -> boolean
        rol: parseInt(formData.rol), // el backend espera idRol numérico
      };

      const res = await registerUsuario(payload);
      console.log("Usuario registrado:", res.data);

      alert(" Usuario registrado con éxito");
      setFormData({
        nombre: "",
        apellido: "",
        correo: "",
        password: "",
        telefono: "",
        rol: "",
        estado: "true",
      });
    } catch (error) {
      console.error("Error al registrar usuario:", error);
      alert(" Error al registrar usuario");
    }
  };

  return (
    <div className="container mt-4">
      <h2>Registrar Usuario</h2>
      <form onSubmit={handleSubmit}>
        {/* Nombre */}
        <div className="mb-3">
          <label className="form-label">Nombre</label>
          <input
            type="text"
            className="form-control"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
          />
        </div>

        {/* Apellido */}
        <div className="mb-3">
          <label className="form-label">Apellido</label>
          <input
            type="text"
            className="form-control"
            name="apellido"
            value={formData.apellido}
            onChange={handleChange}
            required
          />
        </div>

        {/* Correo */}
        <div className="mb-3">
          <label className="form-label">Correo</label>
          <input
            type="email"
            className="form-control"
            name="correo"
            value={formData.correo}
            onChange={handleChange}
            required
          />
        </div>

        {/* Password */}
        <div className="mb-3">
          <label className="form-label">Contraseña</label>
          <input
            type="password"
            className="form-control"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        {/* Teléfono */}
        <div className="mb-3">
          <label className="form-label">Teléfono</label>
          <input
            type="text"
            className="form-control"
            name="telefono"
            value={formData.telefono}
            onChange={handleChange}
            required
          />
        </div>

        {/* Rol */}
        <div className="mb-3">
          <label className="form-label">Rol</label>
          <select
            className="form-select"
            name="rol"
            value={formData.rol}
            onChange={handleChange}
            required
          >
            <option value="">Seleccione un rol</option>
            <option value="1">Administrador</option>
            <option value="2">Usuario</option>
          </select>
        </div>

        {/* Estado */}
        <div className="mb-3">
          <label className="form-label">Estado</label>
          <select
            className="form-select"
            name="estado"
            value={formData.estado}
            onChange={handleChange}
            required
          >
            <option value="true">Activo</option>
            <option value="false">Inactivo</option>
          </select>
        </div>

        {/* Botones */}
        <button type="submit" className="btn btn-primary me-2">
          Registrar
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => navigate("/lista-usuarios")}
        >
          Ver lista de usuarios
        </button>
      </form>
    </div>
  );
};

export default AdminUsuarios;
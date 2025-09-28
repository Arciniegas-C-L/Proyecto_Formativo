// src/components/Usuarios/ListaUsuarios.jsx
import React, { useEffect, useState } from "react";
import { getUsuarios } from "../../api/Usuario.api.js";
import "../../assets/css/Tallas/Tallas.css"; // Reutilizamos estilos
import { useAuth } from "../../context/AuthContext.jsx";

const ListaUsuarios = () => {
  const { autenticado, rol } = useAuth();

  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // Normaliza diferentes formas en que puedas guardar el rol
  const isAdmin =
    rol === "administrador" ||
    rol === 1 ||
    rol === "1" ||
    (typeof rol === "object" && (rol?.nombre === "administrador" || rol?.idRol === 1));

  const fetchUsuarios = async () => {
    setError("");
    setCargando(true);
    try {
      const res = await getUsuarios(); // Debe traer la lista, no /me
      const data = res.data;

      // Normaliza posibles formatos de respuesta
      const lista =
        Array.isArray(data) ? data :
        Array.isArray(data?.results) ? data.results :
        Array.isArray(data?.items) ? data.items :
        Array.isArray(data?.usuarios) ? data.usuarios : [];

      // Mapea claves y asegura booleano en estado
      const normalizados = lista.map((u, idx) => ({
        idUsuario: u.idUsuario ?? u.id ?? u.pk ?? u.uuid ?? idx,
        nombre: u.nombre ?? "",
        apellido: u.apellido ?? "",
        correo: u.correo ?? "",
        telefono: u.telefono ?? "",
        rol: u.rol?.idRol ?? u.rol,
        estado: typeof u.estado === "string" ? u.estado === "true" : Boolean(u.estado),
      }));

      setUsuarios(normalizados);
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
      setUsuarios([]);
      setError("No fue posible cargar los usuarios.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (autenticado && isAdmin) {
      fetchUsuarios();
    } else {
      setCargando(false);
    }
  }, [autenticado, isAdmin]);

  if (!autenticado) {
    return (
      <div className="lista-tallas-container">
        <div className="loading">Debes iniciar sesión para ver esta página.</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="lista-tallas-container">
        <div className="loading">No tienes permisos para ver esta sección.</div>
      </div>
    );
  }

  if (cargando) {
    return <div className="container mt-4">Cargando...</div>;
  }

  // Solo activos
  const usuariosActivos = Array.isArray(usuarios)
    ? usuarios.filter((u) => u.estado === true)
    : [];

  return (
    <div className="lista-tallas-container">{/* Reuso de contenedor con paddings */}
      <div className="header-acciones">
        <h2>Usuarios Activos</h2>
        <div className="header-controls" />
      </div>

      {error && (
        <div className="loading" style={{ color: "#b00020" }}>
          {error}
        </div>
      )}

      {/* Vista Desktop - Tabla */}
      <div className="tabla-container desktop-view">
        <table className="tabla-tallas">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Apellido</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {usuariosActivos.length === 0 ? (
              <tr>
                <td colSpan="5" className="loading">No hay usuarios activos</td>
              </tr>
            ) : (
              usuariosActivos.map((u) => (
                <tr key={u.idUsuario}>
                  <td>{u.nombre}</td>
                  <td>{u.apellido}</td>
                  <td>{u.correo}</td>
                  <td>{u.rol === 1 ? "Administrador" : "Cliente"}</td>
                  <td className="estado-talla">
                    <span className="chip-estado on">Activo</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Vista Mobile - Cards */}
      <div className="mobile-view">
        {usuariosActivos.length === 0 ? (
          <div className="loading-mobile">No hay usuarios activos</div>
        ) : (
          <div className="tallas-cards">
            {usuariosActivos.map((u) => (
              <div key={u.idUsuario} className="talla-card">
                <div className="card-header">
                  <div className="talla-info">
                    <h3 className="talla-nombre">{u.nombre} {u.apellido}</h3>
                    <p className="talla-grupo">{u.correo}</p>
                  </div>
                  <span className="chip-estado-mobile on">Activo</span>
                </div>
                <div className="card-meta" style={{ padding: "0 .5rem .5rem .5rem" }}>
                  <p style={{ margin: 0 }}>
                    <strong>Rol:</strong> {u.rol === 1 ? "Administrador" : "Cliente"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ListaUsuarios;

// src/components/FormRecuperacion.jsx
import { useState } from "react";
import { VerificarCodigo } from "./FormCambio";
import { solicitarRecuperacion } from "../../api/Usuario.api"; // ✅ Usamos el método centralizado
import "../../assets/css/Seccionandregistrer/formRecuperacion.css";

export function RecuperarContrasena() {
  const [correo, setCorreo] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [codigoEnviado, setCodigoEnviado] = useState(false);

  const enviarCodigo = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");

    // Llamamos a la API centralizada
    const { data, error } = await solicitarRecuperacion({ correo });

    if (error) {
      console.error("Error al enviar código:", error);
      setError(
        error.response?.data?.error || "Error de conexión con el servidor"
      );
      return;
    }

    // Si todo salió bien
    setMensaje(data.mensaje);
    setCodigoEnviado(true);
  };

  if (codigoEnviado) {
    return <VerificarCodigo correo={correo} />;
  }

  return (
    <div className="Formulario-Recuperar">
      <form className="formulario" onSubmit={enviarCodigo}>
        <h2 className="titulo-Recuperar">Recuperar Contraseña</h2>
        <input
          type="email"
          placeholder="Correo"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          required
        />
        <button type="submit">Enviar código</button>
        {mensaje && <p style={{ color: "green" }}>{mensaje}</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}
      </form>
    </div>
  );
}

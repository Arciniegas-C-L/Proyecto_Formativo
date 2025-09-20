// src/components/FormRecuperacion.jsx
import { useState, useRef } from "react";
import { VerificarCodigo } from "./FormCambio";
import { solicitarRecuperacion } from "../../api/Usuario.api"; 
import "../../assets/css/Seccionandregistrer/formRecuperacion.css";

export function RecuperarContrasena() {
  const [correo, setCorreo] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [codigoEnviado, setCodigoEnviado] = useState(false);
  const [espera, setEspera] = useState(0);
  const timerRef = useRef(null);

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

    // Deshabilitar botón por 30 segundos
    setEspera(30);
    timerRef.current = setInterval(() => {
      setEspera((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
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
        <button type="submit" disabled={espera > 0}>
          {espera > 0 ? `Espera ${espera}s` : "Enviar código"}
        </button>
        {mensaje && <p style={{ color: "green" }}>{mensaje}</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}
      </form>
    </div>
  );
}

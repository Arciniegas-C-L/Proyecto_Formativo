import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../assets/css/Seccionandregistrer/formCambio.css";
import { RecuperarContrasena } from "./FormRecuperacion";
import { verificarCodigoUsuario, resetearContrasena } from "../../api/Usuario.api";

export function VerificarCodigo({ correo }) {
  const [codigo, setCodigo] = useState("");
  const [codigoVerificado, setCodigoVerificado] = useState(false);
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const verificarCodigo = async (e) => {
    e.preventDefault();
    setError("");
    setMensaje("");

    const { data, error } = await verificarCodigoUsuario({ correo, codigo });

    if (error) {
      setError(error.response?.data?.error || "Código incorrecto o expirado");
      return;
    }

    setCodigoVerificado(true);
    setMensaje(" Código verificado correctamente");
  };

  const cambiarContrasena = async (e) => {
    e.preventDefault();
    setError("");
    setMensaje("");

    if (nuevaContrasena !== confirmarContrasena) {
      setError("Las contraseñas no coinciden");
      return;
    }

    const { data, error } = await resetearContrasena({
    correo,
    codigo,
    nueva_contrasena: nuevaContrasena // 
  });

    if (error) {
      setError(error.response?.data?.error || "No se pudo cambiar la contraseña");
      return;
    }

    setMensaje("✅ " + data.mensaje);
    setTimeout(() => navigate("/sesion"), 2000);
  };

  return (
    <div>
      <RecuperarContrasena />
      <div className="modal-overlay">
        <div className="verificar-modal card shadow-lg">
          {!codigoVerificado ? (
            <form onSubmit={verificarCodigo} className="w-100">
              <h2 className="titulo-form">Verificar código</h2>
              <input
                type="text"
                placeholder="Código de 6 dígitos"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                required
                maxLength={6}
                className="verificar-input"
              />
              <button type="submit" className="verificar-btn">
                Verificar
              </button>
            </form>
          ) : (
            <form onSubmit={cambiarContrasena} className="w-100">
              <h2 className="titulo-form">Nueva contraseña</h2>
              <input
                type="password"
                placeholder="Nueva contraseña"
                value={nuevaContrasena}
                onChange={(e) => setNuevaContrasena(e.target.value)}
                required
                className="verificar-input"
              />
              <input
                type="password"
                placeholder="Confirmar contraseña"
                value={confirmarContrasena}
                onChange={(e) => setConfirmarContrasena(e.target.value)}
                required
                className="verificar-input"
              />
              <button type="submit" className="verificar-btn">
                Cambiar contraseña
              </button>
            </form>
          )}

          {mensaje && <p className="mensaje-ok">{mensaje}</p>}
          {error && <p className="mensaje-error">{error}</p>}
        </div>
      </div>
    </div>
  );
}

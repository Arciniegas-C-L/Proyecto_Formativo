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
  const [mostrarNueva, setMostrarNueva] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);

  const [mensajeVerificacion, setMensajeVerificacion] = useState("");
  const [mensajeFinal, setMensajeFinal] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const verificarCodigo = async (e) => {
    e.preventDefault();
    setError("");
    setMensajeVerificacion("");

    const { data, error } = await verificarCodigoUsuario({ correo, codigo });

    if (error) {
      setError(error.response?.data?.error || "Código incorrecto o expirado");
      return;
    }

    setCodigoVerificado(true);
    setMensajeVerificacion("✅ Código verificado correctamente");
  };

  const cambiarContrasena = async (e) => {
    e.preventDefault();
    setError("");
    setMensajeFinal("");

    if (nuevaContrasena !== confirmarContrasena) {
      setError("Las contraseñas no coinciden");
      return;
    }

    const { data, error } = await resetearContrasena({
      correo,
      codigo,
      nueva_contrasena: nuevaContrasena,
    });

    if (error) {
      setError(error.response?.data?.error || "No se pudo cambiar la contraseña");
      return;
    }

    setMensajeFinal("✅ " + data.mensaje);
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
              {mensajeVerificacion && <p className="mensaje-ok">{mensajeVerificacion}</p>}
              {error && <p className="mensaje-error">{error}</p>}
            </form>
          ) : (
            <form onSubmit={cambiarContrasena} className="w-100">
              <h2 className="titulo-form">Nueva contraseña</h2>

              <div className="position-relative">
                <input
                  type={mostrarNueva ? "text" : "password"}
                  placeholder="Nueva contraseña"
                  value={nuevaContrasena}
                  onChange={(e) => setNuevaContrasena(e.target.value)}
                  required
                  className="verificar-input pe-5"
                />
                <i
                  className={`bi ${mostrarNueva ? "bi-eye-slash" : "bi-eye"} position-absolute top-50 end-0 translate-middle-y me-3`}
                  style={{ cursor: "pointer" }}
                  onClick={() => setMostrarNueva(!mostrarNueva)}
                ></i>
              </div>

              <div className="position-relative mt-3">
                <input
                  type={mostrarConfirmar ? "text" : "password"}
                  placeholder="Confirmar contraseña"
                  value={confirmarContrasena}
                  onChange={(e) => setConfirmarContrasena(e.target.value)}
                  required
                  className="verificar-input pe-5"
                />
                <i
                  className={`bi ${mostrarConfirmar ? "bi-eye-slash" : "bi-eye"} position-absolute top-50 end-0 translate-middle-y me-3`}
                  style={{ cursor: "pointer" }}
                  onClick={() => setMostrarConfirmar(!mostrarConfirmar)}
                ></i>
              </div>

              <button type="submit" className="verificar-btn mt-3">
                Cambiar contraseña
              </button>

              {mensajeFinal && <p className="mensaje-ok">{mensajeFinal}</p>}
              {error && <p className="mensaje-error">{error}</p>}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
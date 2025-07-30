import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../assets/css/formCambio.css";
import { RecuperarContrasena } from "./FormRecuperacion";

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

    try {
        const res = await fetch(
            "http://127.0.0.1:8000/BACKEND/api/usuario/verificar_codigo/",
            {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ correo, codigo }),
            }
        );

        const data = await res.json();
        if (res.ok) {
            setCodigoVerificado(true);
            setMensaje("Código verificado correctamente");
        } else {
            setError(data.error || "Código incorrecto o expirado");
        }
        } catch (err) {
            console.error("Error al verificar código:", err);
            setError("Error de conexión con el servidor");
        }
        };

    const cambiarContrasena = async (e) => {
        e.preventDefault();
        setError("");
        setMensaje("");

        if (nuevaContrasena !== confirmarContrasena) {
            setError("Las contraseñas no coinciden");
            return;
        }

        try {
            const res = await fetch(
                "http://127.0.0.1:8000/BACKEND/api/usuario/reset_password/",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ correo, codigo, contrasena: nuevaContrasena }),
            }
        );

        const data = await res.json();
        if (res.ok) {
            setMensaje(data.mensaje);
            setTimeout(() => navigate("/sesion"), 2000);
        } else {
            setError(data.error || "No se pudo cambiar la contraseña");
        }
        } catch (err) {
            console.error("Error al cambiar contraseña:", err);
            setError("Error de conexión con el servidor");
        }
    };

    return (
        <div>
            <RecuperarContrasena />
            <div className="modal-overlay">
                <div className="modal-verificar">
                    {!codigoVerificado ? (
                        <form onSubmit={verificarCodigo}>
                            <h2>Verificar código</h2>
                            <input
                                type="text"
                                placeholder="Código de 6 dígitos"
                                value={codigo}
                                onChange={(e) => setCodigo(e.target.value)}
                                required
                                maxLength={6}
                                className="input"
                            />
                            <button type="submit" className="button">
                                Verificar
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={cambiarContrasena}>
                            <h2>Nueva contraseña</h2>
                            <input
                                type="password"
                                placeholder="Nueva contraseña"
                                value={nuevaContrasena}
                                onChange={(e) => setNuevaContrasena(e.target.value)}
                                required
                                className="input"
                            />
                            <input
                                type="password"
                                placeholder="Confirmar contraseña"
                                value={confirmarContrasena}
                                onChange={(e) => setConfirmarContrasena(e.target.value)}
                                required
                                className="input"
                            />
                            <button type="submit" className="button">
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

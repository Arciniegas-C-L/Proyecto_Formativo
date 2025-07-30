// FormRecuperacion.jsx
import { useState } from "react";
import { VerificarCodigo } from "./FormCambio";
import "../../assets/css/formRecuperacion.css";

export function RecuperarContrasena() {
    const [correo, setCorreo] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [error, setError] = useState("");
    const [codigoEnviado, setCodigoEnviado] = useState(false);

    const enviarCodigo = async (e) => {
        e.preventDefault();
        setMensaje("");
        setError("");

        try {
            const res = await fetch("http://127.0.0.1:8000/BACKEND/api/usuario/recuperar_contrasena/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ correo }),
        });

        const data = await res.json();
        if (res.ok) {
            setMensaje(data.mensaje);
            setCodigoEnviado(true);
        } else {
            setError(data.error || "Error inesperado");
        }
        } catch (err) {
        console.error("Error al enviar código:", err);
        setError("Error de conexión con el servidor");
        }
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

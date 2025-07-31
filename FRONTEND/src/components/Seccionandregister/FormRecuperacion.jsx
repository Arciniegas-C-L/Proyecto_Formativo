// FormRecuperacion.jsx
import { useState } from "react";
import { VerificarCodigo } from "./FormCambio";
import "../../assets/css/formRecuperacion.css";

export function RecuperarContrasena() {
    // Estado para almacenar el correo ingresado por el usuario
const [correo, setCorreo] = useState("");

// Estado para mostrar mensajes de éxito
const [mensaje, setMensaje] = useState("");

// Estado para mostrar mensajes de error
const [error, setError] = useState("");

// Estado para saber si el código fue enviado correctamente
const [codigoEnviado, setCodigoEnviado] = useState(false);

// Función que se ejecuta al enviar el formulario para recuperar contraseña
const enviarCodigo = async (e) => {
    e.preventDefault();      // Previene el comportamiento por defecto del formulario
    setMensaje("");          // Limpia mensajes anteriores
    setError("");            // Limpia errores anteriores

    try {
        const res = await fetch("http://127.0.0.1:8000/BACKEND/api/usuario/recuperar_contrasena/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ correo }),           // Envia el correo al backend
        });

        const data = await res.json();
        if (res.ok) {
            setMensaje(data.mensaje);                   // Muestra mensaje del servidor
            setCodigoEnviado(true);                     // Habilita la siguiente etapa
        } else {
            setError(data.error || "Error inesperado"); // Muestra error específico o genérico
        }
    } catch (err) {
        console.error("Error al enviar código:", err);
        setError("Error de conexión con el servidor");   // Error en caso de fallo de red
    }
};

// Si el código fue enviado correctamente, muestra el componente para verificar el código
if (codigoEnviado) {
    return <VerificarCodigo correo={correo} />;
};

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

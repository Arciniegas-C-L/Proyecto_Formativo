//Este componente es la página de Sesion recuperacin
//Aqui podemos unir todos los componentes o subcomponentes para exportar a la app.jsx

import{RecuperarContrasena} from "../components/Seccionandregister/FormRecuperacion.jsx";

export function SesionRecuperacionPage() {
    return (
        <div className="Sesion-Recuperacion">
            <RecuperarContrasena />
        </div>
    );
}
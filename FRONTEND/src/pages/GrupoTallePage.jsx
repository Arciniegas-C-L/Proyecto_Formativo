//Este componente es la página de Grupo de tallas
//Aqui podemos unir todos los componentes o subcomponentes para exportar a la app.jsx

import {GrupoTalla} from "../components/Tallas/GrupoTalla.jsx";

export function GrupoTallaPage() {
  return (
    <div className="grupo-talla-page">
      <GrupoTalla />
    </div>
  );
}
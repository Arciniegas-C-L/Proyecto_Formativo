//Este componente es la página de Admin usuarios
//Aqui podemos unir todos los componentes o subcomponentes para exportar a la app.jsx

import {AdminUsuarios} from "../components/Usuarios/AdminUsuarios.jsx";

export const AdminUsuariosPage = () => {
  return (
    <div className="container mt-4">
      <AdminUsuarios />
    </div>
  );
}


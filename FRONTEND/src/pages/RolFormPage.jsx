//Este componente es la página de Rol form 
//Aqui podemos unir todos los componentes o subcomponentes para exportar a la app.jsx

import {RolForm} from "../components/Rol/RolForm"

export function RolFormPage() {
  return (
    <div className="container mx-auto p-4">
      <RolForm />
    </div>
  );
}
//Este componente es la página de Rol lista
//Aqui podemos unir todos los componentes o subcomponentes para exportar a la app.jsx

import {ListaRol} from "../components/Rol/ListaRol";

export function RolListaPage() {
  return (
    <div className="container mx-auto p-4">
      <ListaRol />
    </div>
  );
}
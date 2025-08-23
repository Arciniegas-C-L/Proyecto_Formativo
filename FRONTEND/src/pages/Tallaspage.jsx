//Este componente es la página de Tallas
//Aqui podemos unir todos los componentes o subcomponentes para exportar a la app.jsx

import {Tallas} from "../components/Tallas/Tallas.jsx";

export const TallasPage = () => {
  return (
    <div className="container mt-4">
      <h1>Tallas Page</h1>
      <Tallas />
    </div>
  );
}
//Este componente es la página de Catalogo
//Aqui podemos unir todos los componentes o subcomponentes para exportar a la app.jsx

import { Catalogo } from "../components/Catalogo/Catalogo";

const Catalogopage = () => {
  return (
    <div className="catalogo-page">
      <Catalogo />
    </div>
  );
};

export default Catalogopage;

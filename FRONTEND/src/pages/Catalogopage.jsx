//Este componente es la página de Catalogo
//Aqui podemos unir todos los componentes o subcomponentes para exportar a la app.jsx

import { Catalogo } from "../components/Catalogo/Catalogo.jsx";

export function CatalogoPage() {
    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Catálogo de Productos</h1>
            <Catalogo />
        </div>
    );
}
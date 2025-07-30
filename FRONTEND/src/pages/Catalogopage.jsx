import { Catalogo } from "../components/Catalogo/Catalogo.jsx";

export function CatalogoPage() {
    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Catálogo de Productos</h1>
            <Catalogo />
        </div>
    );
}
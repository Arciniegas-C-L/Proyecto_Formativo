    import { useEffect, useState } from 'react';
    import { getALLRoles, updateRol } from '../../api/Rol.api';
    import { Link } from 'react-router-dom';

    export function ListaRol() {
        const [roles, setRoles] = useState([]);
        const [currentPage, setCurrentPage] = useState(1);
        const [rolSeleccionado, setRolSeleccionado] = useState(null);
        const [nombreEditado, setNombreEditado] = useState('');
        const itemsPerPage = 5;

        useEffect(() => {
            async function MostrarRoles() {
                const res = await getALLRoles();
                setRoles(res.data);
            }
            MostrarRoles();
        }, []);

        const totalPages = Math.ceil(roles.length / itemsPerPage);
        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        const currentItems = roles.slice(indexOfFirstItem, indexOfLastItem);

        const handlePageChange = (pageNumber) => {
            if (pageNumber >= 1 && pageNumber <= totalPages) {
                setCurrentPage(pageNumber);
            }
        };

        const seleccionarRol = (rol) => {
            setRolSeleccionado(rol);
            setNombreEditado(rol.nombre);
        };

        const guardarCambios = async () => {
            if (rolSeleccionado) {
                await updateRol(rolSeleccionado.idROL, { nombre: nombreEditado });

                // Recargar los datos actualizados
                const res = await getALLRoles();
                setRoles(res.data);

                // Limpiar selección
                setRolSeleccionado(null);
                setNombreEditado('');
            }
        };

        return (
            <div className="container mt-5">
                <div className="d-flex justify-content-around mb-4">
                    <h3>Roles</h3>
                    <Link to="/rol-create" className="btn btn-success text-white fw-bold shadow-sm px-4 py-2">
                        Crear Rol
                    </Link>
                </div>

                <div className="m-auto w-50 mt-2 bg-white rounded-2 shadow">
                    <table className="w-100">
                        <thead>
                            <tr className="justify-content-around">
                                <th className="bg-white text-muted border py-3 px-2 font-weight-bold border-bottom text-lg-center text-uppercase">Id</th>
                                <th className="bg-white text-muted border py-3 px-2 font-weight-bold border-bottom text-lg-center text-uppercase">Nombre</th>
                                <th className="bg-white text-muted border py-3 px-2 font-weight-bold border-bottom text-lg-center text-uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.map((rol) => (
                                <tr key={rol.idROL} className="justify-content-around">
                                    <td className="py-3 px-2 border align-middle text-center">{rol.idROL}</td>
                                    <td className="py-3 px-2 border align-middle mx-2">{rol.nombre}</td>
                                    <td className="py-3 px-2 align-center border text-center">
                                        <button
                                            className="btn btn-warning"
                                            onClick={() => seleccionarRol(rol)}
                                        >
                                            Editar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Controles de paginación */}
                <div className="d-flex justify-content-center mt-3 flex-wrap gap-2">
                    <button
                        className="btn btn-outline-primary mx-1"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        Anterior
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                        <button
                            key={number}
                            className={`btn mx-1 ${currentPage === number ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => handlePageChange(number)}
                        >
                            {number}
                        </button>
                    ))}

                    <button
                        className="btn btn-outline-primary mx-1"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                    >
                        Siguiente
                    </button>
                </div>

                {/* Formulario de edición dentro del contenedor de paginación */}
                {rolSeleccionado && (
                    <div className="mt-4 p-3 border rounded bg-light w-50 m-auto shadow-sm">
                        <h5 className="mb-3">Editar Rol (ID: {rolSeleccionado.idROL})</h5>
                        <div className="form-group mb-3">
                            <label>Nombre</label>
                            <input
                                type="text"
                                className="form-control"
                                value={nombreEditado}
                                onChange={(e) => setNombreEditado(e.target.value)}
                            />
                        </div>
                        <div className="d-flex justify-content-end gap-2">
                            <button className="btn btn-secondary" onClick={() => setRolSeleccionado(null)}>Cancelar</button>
                            <button className="btn btn-success" onClick={guardarCambios}>Guardar</button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

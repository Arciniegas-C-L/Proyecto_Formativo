import { useForm } from 'react-hook-form'
import { createRol } from '../../api/Rol.api'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'

export function RolForm() {
// Hook de react-hook-form para registrar campos, manejar el submit y errores
const { register, handleSubmit, formState: { errors } } = useForm();

// Hook para redireccionar a otra ruta
const navigate = useNavigate();

// Función que se ejecuta al enviar el formulario
const onSubmit = handleSubmit(async data => {
    await createRol(data);
    toast.success('Rol Creado');
    navigate("/rol");
});


    return (
        <div className="container mt-5 d-flex justify-content-center">
            <div className="bg-white p-4 rounded shadow w-50">
                <h3 className="text-center mb-4">Crear Rol</h3>

                <form onSubmit={onSubmit}>
                    <div className="form-group mb-3">
                        <label className="form-label">Nombre</label>
                        <input
                            type="text"
                            placeholder="Nombre"
                            className={`form-control ${errors.nombre ? 'is-invalid' : ''}`}
                            {...register("nombre", { required: true })}
                        />
                        {errors.nombre && (
                            <div className="invalid-feedback">
                                El nombre es requerido
                            </div>
                        )}
                    </div>

                    <div className="d-flex justify-content-end">
                        <button className="btn btn-success text-white fw-bold shadow-sm px-4 py-2">
                            Guardar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

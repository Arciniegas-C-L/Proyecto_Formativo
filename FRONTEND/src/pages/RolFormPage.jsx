import { useForm } from 'react-hook-form'
import { createRol } from '../api/Rol.api'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'

export function RolFormPage() {

    const { register, handleSubmit, formState: { errors } } = useForm()

    const navigate = useNavigate()

    const onSubmit = handleSubmit( async data => {
        await createRol(data)
        toast.success('Rol Creado')
        navigate("/rol")
    })
    
    return (
        <div>

        <form onSubmit={onSubmit}>
            <input type="text" placeholder="Nombre" 
            {...register("nombre", {required: true})}/>
            {errors.nombre && <span>El nombre es requerido</span>}
            <button>Guardar</button>
        </form>
        
        </div>
    )
}

import { useForm } from 'react-hook-form'
import { createRol } from '../../api/Rol.api'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import "../../assets/css/Rol/RolForm.css";

export function RolForm() {
  const { register, handleSubmit, formState: { errors } } = useForm()
  const navigate = useNavigate()

  const onSubmit = handleSubmit(async data => {
    await createRol(data)
    toast.success('Rol creado')
    navigate("/rol")
  })

  return (
    <div className="rol-form-container">
      <h2 className="rol-title">Crear Rol</h2>

      <form onSubmit={onSubmit} className="rol-form">
        <div className="rol-field">
          <label className="rol-label">Nombre</label>
          <input
            type="text"
            placeholder="Nombre del rol"
            className={`rol-input ${errors.nombre ? 'rol-invalid' : ''}`}
            {...register("nombre", { required: true })}
          />
          {errors.nombre && (
            <span className="rol-error">El nombre es requerido</span>
          )}
        </div>

        <div className="rol-submit-container">
          <button className="rol-button" type="submit">
            Guardar
          </button>
        </div>
      </form>
    </div>
  )
}

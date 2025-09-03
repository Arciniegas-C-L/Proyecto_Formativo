
import React, { useEffect, useState } from 'react';
import DireccionItem from './DireccionItem';
import DireccionForm from './DireccionForm';
import { toast } from 'react-hot-toast';



const Direcciones = ({ api, direccionPersonal }) => {
  const [direcciones, setDirecciones] = useState([]);
  const [editando, setEditando] = useState(null);
  const [mostrandoForm, setMostrandoForm] = useState(false);

  // Cargar direcciones al montar

  useEffect(() => {
    api.getDirecciones()
      .then(setDirecciones)
      .catch(() => toast.error('Error al cargar direcciones.', { position: 'bottom-right' }));
  }, [api]);

  const handleAdd = () => {
    setEditando(null);
    setMostrandoForm(true);
  };

  const handleEdit = direccion => {
    setEditando(direccion);
    setMostrandoForm(true);
  };

  const handleDelete = id => {
    api.deleteDireccion(id)
      .then(() => setDirecciones(direcciones.filter(d => d.id !== id)))
      .catch((err) => {
        let msg = 'No se pudo eliminar la dirección.';
        if (err && err.response && err.response.data && err.response.data.detail) {
          msg = err.response.data.detail;
        }
        toast.error(msg, { position: 'bottom-right' });
      });
  };


  const handleFormSubmit = data => {
    const handleError = (err, defaultMsg) => {
      let msg = defaultMsg;
      if (err && err.response && err.response.data && err.response.data.detail) {
        msg = err.response.data.detail;
      }
      toast.error(msg, { position: 'bottom-right' });
    };
    if (editando) {
      api.updateDireccion(editando.id, data)
        .then(dir => setDirecciones(direcciones.map(d => d.id === dir.id ? dir : d)))
        .catch((err) => handleError(err, 'No se pudo actualizar la dirección.'));
    } else {
      api.createDireccion(data)
        .then(dir => setDirecciones([...direcciones, dir]))
        .catch((err) => handleError(err, 'No se pudo crear la dirección.'));
    }
    setMostrandoForm(false);
    setEditando(null);
  };


  return (
    <div className="direcciones">
      <h3 className="direcciones-titulo">Direcciones registradas</h3>
  {/* Los errores ahora se muestran con toast */}
      <div className="lista-direcciones">
        <div className="direccion-personal" key="personal">
          <span className="direccion-texto">{direccionPersonal || 'No registrada'}</span>
        </div>
        {direcciones.length === 0 && <div className="direccion-vacia" key="vacia">No tienes direcciones adicionales registradas.</div>}
        {direcciones.map(d => (
          <DireccionItem
            key={d.id || d._id || Math.random()}
            direccion={d}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>
      {direcciones.length < 2 && !mostrandoForm && (
        <button className="direccion-btn-agregar" onClick={handleAdd}>Agregar dirección</button>
      )}
      {mostrandoForm && (
        <DireccionForm
          initialData={editando || {}}
          onSubmit={handleFormSubmit}
          onCancel={() => { setMostrandoForm(false); setEditando(null); }}
        />
      )}
    </div>
  );
};

export default Direcciones;

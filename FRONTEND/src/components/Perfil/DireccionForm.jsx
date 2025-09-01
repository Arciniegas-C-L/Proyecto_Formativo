
import React, { useState } from 'react';

const DireccionForm = ({ initialData = {}, onSubmit, onCancel }) => {
  const [direccionCompleta, setDireccionCompleta] = useState(initialData.direccion || '');

  const handleSubmit = e => {
    e.preventDefault();
    onSubmit({ direccion: direccionCompleta });
  };

  return (
    <form onSubmit={handleSubmit} className="direccion-form">
      <input
        name="direccion"
        value={direccionCompleta}
        onChange={e => setDireccionCompleta(e.target.value)}
        placeholder="Dirección completa"
        required
      />
      <div className="direccion-form-actions">
        <button type="submit">Guardar</button>
        <button type="button" onClick={onCancel}>Cancelar</button>
      </div>
    </form>
  );
};

export default DireccionForm;

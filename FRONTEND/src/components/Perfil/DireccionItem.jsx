import React from 'react';

const DireccionItem = ({ direccion, onEdit, onDelete }) => {
  const textoCompleto = `${direccion.direccion}`;
  return (
    <div className="direccion-item">
      <div className="direccion-info-texto">
        <span style={{ color: '#222', fontWeight: 500 }}>{textoCompleto}</span>
      </div>
      <div className="direccion-actions-horizontal">
        <button onClick={() => onEdit(direccion)}>Editar</button>
        <button onClick={() => onDelete(direccion.id)}>Eliminar</button>
      </div>
    </div>
  );
};

export default DireccionItem;

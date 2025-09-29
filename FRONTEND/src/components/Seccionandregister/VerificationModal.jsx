import '../../assets/css/Seccionandregistrer/modalCodigo.css';
import React, { useState } from 'react';
import Modal from 'react-modal';
import toast from 'react-hot-toast';
import { verificarCodigo } from '../../api/password.api';

export function VerificationModal({ isOpen, onRequestClose, email, onSuccess }) {
  const [verificationCode, setVerificationCode] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [error, setError] = useState('');

  const handleVerifyCode = async () => {
    try {
      const isValid = await verificarCodigo(email, verificationCode);
      if (isValid) {
        toast.success('Código verificado correctamente.');
        onRequestClose();
        if (onSuccess) onSuccess(verificationCode);
      } else {
        setAttemptsLeft((prev) => prev - 1);
        if (attemptsLeft <= 1) {
          setError('Demasiados intentos fallidos. Por favor, vuelve a iniciar sesión.');
          setTimeout(() => {
            onRequestClose();
          }, 1800);
        } else {
          setError(`Código incorrecto. Intentos restantes: ${attemptsLeft - 1}`);
        }
      }
    } catch {
      setError('Error al verificar el código.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Verificación de Código"
      overlayClassName="verification-modal-overlay"
      className="verification-modal-content"
    >
      <h2 className="verification-modal-title">Verificación de Código</h2>
      <p className="verification-modal-desc">Estás tratando de ingresar como <b>administrador</b>.<br />
      Se ha enviado un código de 6 dígitos al correo <b>{email}</b>. Ingresa el código para continuar:</p>
      <input
        type="text"
        value={verificationCode}
        onChange={(e) => setVerificationCode(e.target.value)}
        placeholder="Ingrese el código"
        maxLength={6}
        pattern="[0-9]{6}"
        className="verification-modal-input"
      />
      {error && <p className="verification-modal-error">{error}</p>}
      <button className="verification-modal-btn" onClick={handleVerifyCode} disabled={attemptsLeft <= 0}>Verificar</button>
      <button className="verification-modal-btn" onClick={onRequestClose}>Cancelar</button>
    </Modal>
  );
}
import '../../assets/css/Seccionandregistrer/modalCodigo.css';
import React, { useState } from 'react';
import Modal from 'react-modal';
import toast from 'react-hot-toast';
import { verificarCodigo } from '../../api/password.api';

export function VerificationModal({ isOpen, onRequestClose, email, onSuccess }) {
  const [verificationCode, setVerificationCode] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  React.useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleVerifyCode = async () => {
    setIsVerifying(true);
    try {
      if (onSuccess) await onSuccess(verificationCode);
    } finally {
      setIsVerifying(false);
      setCooldown(30); // desactiva el botón por 30 segundos
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
      <button className="verification-modal-btn" onClick={handleVerifyCode} disabled={attemptsLeft <= 0 || isVerifying || cooldown > 0}>
        {isVerifying ? "Verificando..." : cooldown > 0 ? `Espera ${cooldown}s` : "Verificar"}
      </button>
      <button className="verification-modal-btn" onClick={onRequestClose}>Cancelar</button>
    </Modal>
  );
}
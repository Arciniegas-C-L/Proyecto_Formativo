import React, { useState } from 'react';
import { solicitarCodigo, verificarCodigo, resetPassword } from '../../api/password.api';

const CambiarPassword = () => {
  const [step, setStep] = useState(1); // 1: correo, 2: código, 3: nueva contraseña
  const [correo, setCorreo] = useState('');
  const [codigo, setCodigo] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSolicitar = async e => {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);
    try {
      await solicitarCodigo(correo);
      setStep(2);
      setSuccess('Código enviado al correo.');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al enviar el código');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificar = async e => {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);
    try {
      await verificarCodigo(correo, codigo);
      setStep(3);
      setSuccess('Código verificado. Ahora ingresa tu nueva contraseña.');
    } catch (err) {
      setError(err.response?.data?.error || 'Código incorrecto');
    } finally {
      setLoading(false);
    }
  };

  const handleCambiar = async e => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (password !== password2) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(correo, codigo, password);
      setSuccess('Contraseña actualizada correctamente.');
      setStep(1);
      setCorreo(''); setCodigo(''); setPassword(''); setPassword2('');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cambiar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cambiar-password">
      {step === 1 && (
        <form className="cambiar-password-form" onSubmit={handleSolicitar}>
          <h4 className="cambiar-password-titulo">Solicitar código de cambio</h4>
          <input className="cambiar-password-input" type="email" value={correo} onChange={e => setCorreo(e.target.value)} placeholder="Correo" required />
          <button className="cambiar-password-btn" type="submit" disabled={loading}>Solicitar código</button>
        </form>
      )}
      {step === 2 && (
        <form className="cambiar-password-form" onSubmit={handleVerificar}>
          <h4 className="cambiar-password-titulo">Verificar código</h4>
          <input className="cambiar-password-input" value={codigo} onChange={e => setCodigo(e.target.value)} placeholder="Código recibido" required />
          <button className="cambiar-password-btn" type="submit" disabled={loading}>Verificar código</button>
        </form>
      )}
      {step === 3 && (
        <form className="cambiar-password-form" onSubmit={handleCambiar}>
          <h4 className="cambiar-password-titulo">Nueva contraseña</h4>
          <input className="cambiar-password-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Nueva contraseña" required />
          <input className="cambiar-password-input" type="password" value={password2} onChange={e => setPassword2(e.target.value)} placeholder="Repetir contraseña" required />
          <button className="cambiar-password-btn" type="submit" disabled={loading}>Cambiar contraseña</button>
        </form>
      )}
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
    </div>
  );
};

export default CambiarPassword;

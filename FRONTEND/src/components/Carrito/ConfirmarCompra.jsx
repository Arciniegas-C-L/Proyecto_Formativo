import React, { useState } from "react";

export default function ConfirmarCompra({ onConfirmar, usuario, onCancelar }) {
  const [direccion, setDireccion] = useState(usuario?.direccion || "");
  const [metodoPago, setMetodoPago] = useState("mercadopago"); // 🔥 ahora Mercado Pago por defecto
  const [errores, setErrores] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    let nuevosErrores = {};
    if (!direccion.trim()) {
      nuevosErrores.direccion = "La dirección es obligatoria";
    }
    if (!metodoPago) {
      nuevosErrores.metodoPago = "Selecciona un método de pago";
    }
    setErrores(nuevosErrores);

    if (Object.keys(nuevosErrores).length === 0) {
      // 🔥 Pasamos los datos hacia Carrito.jsx
      onConfirmar({ direccion, metodoPago });
    }
  };

  return (
    <div
      className="modal fade show"
      style={{ display: "block", background: "rgba(0,0,0,0.5)" }}
      tabIndex="-1"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Confirmar datos para finalizar compra</h5>
            <button type="button" className="btn-close" onClick={onCancelar}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Dirección de entrega</label>
                <input
                  type="text"
                  className={`form-control ${errores.direccion ? "is-invalid" : ""}`}
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Ingresa tu dirección completa"
                />
                {errores.direccion && (
                  <div className="invalid-feedback">{errores.direccion}</div>
                )}
              </div>

              <div className="mb-3">
                <label className="form-label">Método de pago</label>
                <div className="w-100 p-2 rounded-lg shadow-sm flex flex-col items-center gap-2 bg-slate-50">
                  <div className="flex flex-col gap-2 w-100">
                    {/* 🔥 Mercado Pago (habilitado) */}
                    <label className="inline-flex justify-between w-full items-center rounded-lg p-2 border border-transparent has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50 has-[:checked]:font-bold hover:bg-slate-200 transition-all cursor-pointer relative">
                      <div className="inline-flex items-center gap-2">
                        <img
                          src="https://img.icons8.com/color/48/mercado-pago.png"
                          alt="Mercado Pago"
                          height="32"
                          width="32"
                        />
                        <span className="font-semibold">Mercado Pago</span>
                      </div>
                      <input
                        className="checked:text-indigo-500 focus:ring-0"
                        value="mercadopago"
                        name="payment"
                        type="radio"
                        checked={metodoPago === "mercadopago"}
                        onChange={() => setMetodoPago("mercadopago")}
                      />
                    </label>

                    {/* Efectivo (deshabilitado por ahora, pero mantenido para futuro) */}
                    <label className="inline-flex justify-between w-full items-center rounded-lg p-2 border border-transparent opacity-60 cursor-not-allowed relative">
                      <div className="inline-flex items-center gap-2">
                        <svg
                          fill="currentColor"
                          viewBox="0 0 24 24"
                          height="32"
                          width="32"
                        >
                          <path d="M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7zm2 0v10h16V7H4zm8 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm0 2a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"></path>
                        </svg>
                        <span className="font-semibold">Efectivo</span>
                      </div>
                      <input type="radio" name="payment" value="efectivo" disabled />
                    </label>
                  </div>
                </div>
                {errores.metodoPago && (
                  <div className="invalid-feedback">{errores.metodoPago}</div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onCancelar}
              >
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                Confirmar compra
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

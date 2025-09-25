import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useParams, Link } from "react-router-dom";
import { crearFacturaDesdePago, getFactura, descargarFacturaPDF } from "../../api/Factura.api.js";
import "../../assets/css/Facturas/RetornoMp.css";

// Construye el payload y permite pasar una bandera para que el backend no descuente stock.
function buildBodyFromQuery(q, { skipStock = true } = {}) {
  return {
    payment_id: q.payment_id || undefined,
    external_reference: q.external_reference || undefined,
    carrito_id: q.carritoId ? Number(q.carritoId) : undefined,
    // bandera opcional que TU backend debe respetar para no descontar stock
    skip_stock: skipStock ? true : undefined,
  };
}

function parseHttpError(err) {
  const any = err || {};
  const cfg = any.config || {};
  const res = any.response || {};
  const reqURL = (cfg.baseURL || "") + (cfg.url || "");
  const method = (cfg.method || "get").toUpperCase();
  const data = res.data ?? any.data ?? null;

  let short =
    any.message ||
    data?.detail ||
    data?.message ||
    (typeof data === "string" ? data : null) ||
    "Error desconocido";

  const fieldErrors = {};
  if (data && typeof data === "object" && !Array.isArray(data)) {
    for (const k of Object.keys(data)) {
      if (k !== "detail" && k !== "message") fieldErrors[k] = data[k];
    }
  }

  return {
    ok: false,
    shortMessage: short,
    status: res.status ?? null,
    statusText: res.statusText ?? null,
    code: any.code ?? null,
    method,
    url: reqURL || null,
    requestPayload: cfg.data
      ? (() => {
          try {
            return typeof cfg.data === "string" ? JSON.parse(cfg.data) : cfg.data;
          } catch {
            return cfg.data;
          }
        })()
      : null,
    responseData: data,
    fieldErrors,
  };
}

export function RetornoMP() {
  const [params] = useSearchParams();
  const { id: facturaIdParam } = useParams(); // <-- si existe, estamos en modo "ver factura"

  const [state, setState] = useState({
    loading: true,
    ok: false,
    error: null,
    factura: null,
    intentos: 0,
  });

  // --- MODO DETECCIÓN ---
  const isViewMode = !!facturaIdParam;  // true si /facturas/:id
  const debug = (params.get("debug") || "") === "1";

  // --- QUERY PARAMS para modo Retorno MP ---
  const q = useMemo(
    () => ({
      status: params.get("status") || params.get("collection_status") || "",
      payment_id: params.get("payment_id") || params.get("collection_id") || "",
      external_reference: params.get("external_reference") || "",
      carritoId: params.get("carritoId") || params.get("carrito_id") || "",
      preference_id: params.get("preference_id") || "",
      payment_status: params.get("payment_status") || "",
    }),
    [params]
  );

  // --- IDEMPOTENCIA solo aplica a retorno MP ---
  const idemKey = useMemo(() => {
    if (isViewMode) return null;
    const key = q.external_reference || q.payment_id || "";
    return key ? `retorno_mp:fired:${key}` : null;
  }, [isViewMode, q.external_reference, q.payment_id]);

  // Descargar PDF (sirve en ambos modos)
  const onDescargarPDF = async (id, numero) => {
    try {
      const { data: blob } = await descargarFacturaPDF(id);
      const url = window.URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `Factura_${numero || id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("No fue posible descargar el PDF.");
    }
  };

  // --- EFECTO PRINCIPAL ---
  useEffect(() => {
    let cancel = false;

    // ====== MODO B: VER FACTURA /facturas/:id ======
    if (isViewMode) {
      (async () => {
        setState((s) => ({ ...s, loading: true, error: null }));
        try {
          const { data } = await getFactura(facturaIdParam);
          if (cancel) return;
          setState({ loading: false, ok: true, error: null, factura: data, intentos: 0 });
        } catch (err) {
          if (cancel) return;
          setState({
            loading: false,
            ok: false,
            error: parseHttpError(err),
            factura: null,
            intentos: 0,
          });
        }
      })();
      return () => { cancel = true; };
    }

    // ====== MODO A: RETORNO MP (sin :id) ======
    const isApproved = (q.status || "").toLowerCase() === "approved";
    if (!isApproved) {
      setState((s) => ({
        ...s,
        loading: false,
        ok: false,
        error: { shortMessage: "Pago no aprobado." },
        factura: null,
      }));
      return;
    }

    let tries = 0;
    const MAX_TRIES = 4;
    const DELAY_MS = 1500;

    const intentarPost = async () => {
      if (cancel) return;
      tries += 1;
      const body = buildBodyFromQuery(q, { skipStock: true });

      setState((s) => ({ ...s, loading: true, error: null, intentos: tries }));
      try {
        if (debug) console.log("[RetornoMP] POST crear_factura payload:", body);
        const { data } = await crearFacturaDesdePago(body);
        if (cancel) return;
        if (idemKey) localStorage.setItem(idemKey, "1");
        setState({ loading: false, ok: true, error: null, factura: data, intentos: tries });
      } catch (err) {
        if (cancel) return;
        const parsed = parseHttpError(err);
        if (debug) console.error("[RetornoMP] Error POST:", parsed);

        if (tries < MAX_TRIES && [404, 409, 429, 500, 502, 503].includes(parsed.status || 0)) {
          setTimeout(intentarPost, DELAY_MS);
          return;
        }
        setState({ loading: false, ok: false, error: parsed, factura: null, intentos: tries });
      }
    };

    const intentarSoloLectura = async () => {
      setState((s) => ({ ...s, loading: false }));
    };

    if (idemKey && localStorage.getItem(idemKey) === "1") {
      if (debug) console.log("[RetornoMP] ya fue POSTeado antes; evitando doble descuento");
      intentarSoloLectura();
      return () => { cancel = true; };
    }

    intentarPost();
    return () => { cancel = true; };
  }, [isViewMode, facturaIdParam, q, debug, idemKey]);

  // Para pintar iconos y títulos coherentes en ambos modos:
  const isApproved = isViewMode ? true : (q.status || "").toLowerCase() === "approved";

  const copyError = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(state.error, null, 2));
      alert("Detalle de error copiado al portapapeles.");
    } catch {}
  };

  return (
    <div className="retorno-mp-page">
      <div className="retorno-mp-container">
        <div className="retorno-mp-card">
          <div className="retorno-mp-header">
            <div className={`retorno-mp-icon ${isApproved ? 'success' : 'secondary'}`}>
              <i className="bi bi-check2" />
            </div>
            <h1 className="retorno-mp-title">
              {isViewMode ? "Factura" : "¡Gracias por tu compra!"}
            </h1>
          </div>

          <div className="retorno-mp-content">
            {/* Mensajería principal */}
            {isViewMode ? (
              <>
                {state.loading && (
                  <div className="retorno-mp-alert info">
                    <div className="retorno-mp-loading">
                      <div className="spinner"></div>
                      <span>Cargando factura…</span>
                    </div>
                  </div>
                )}

                {!state.loading && state.ok && state.factura && (
                  <div className="retorno-mp-alert success">
                    <div className="retorno-mp-alert-header">
                      <i className="bi bi-receipt"></i>
                      <span>Factura</span>
                    </div>
                    
                    <div className="retorno-mp-details">
                      <div className="retorno-mp-detail-item">
                        <div className="retorno-mp-detail-label">Número</div>
                        <div className="retorno-mp-detail-value">{state.factura.numero}</div>
                      </div>
                      <div className="retorno-mp-detail-item">
                        <div className="retorno-mp-detail-label">Factura ID</div>
                        <div className="retorno-mp-detail-value">{state.factura.id}</div>
                      </div>
                      <div className="retorno-mp-detail-item">
                        <div className="retorno-mp-detail-label">Total</div>
                        <div className="retorno-mp-detail-value total">{state.factura.total}</div>
                      </div>
                      <div className="retorno-mp-detail-item">
                        <div className="retorno-mp-detail-label">Moneda</div>
                        <div className="retorno-mp-detail-value">{state.factura.moneda}</div>
                      </div>
                    </div>

                    <div className="retorno-mp-actions">
                      <button
                        className="btn btn-purple btn-sm"
                        onClick={() => onDescargarPDF(state.factura.id, state.factura.numero)}
                      >
                        <i className="bi bi-file-earmark-pdf me-1"></i>
                        Descargar PDF
                      </button>
                      <Link className="btn btn-cyan btn-sm" to="/facturas">
                        <i className="bi bi-list-ul me-1"></i>
                        Volver al listado
                      </Link>
                    </div>
                  </div>
                )}

                {!state.loading && !state.ok && (
                  <div className="retorno-mp-alert warning">
                    <div className="retorno-mp-alert-header">
                      <i className="bi bi-exclamation-triangle"></i>
                      <span>Error al cargar factura</span>
                    </div>
                    
                    <div className="retorno-mp-error-message">
                      {state.error?.shortMessage || "No pudimos cargar la factura."}
                    </div>
                    
                    {state.error && (
                      <div className="retorno-mp-error-details">
                        {state.error?.status && (
                          <div className="retorno-mp-error-item">
                            <strong>Status:</strong> {state.error.status} {state.error.statusText || ""}
                          </div>
                        )}
                        {state.error?.url && (
                          <div className="retorno-mp-error-item">
                            <strong>Endpoint:</strong> {state.error.method} {state.error.url}
                          </div>
                        )}
                        
                        <details className="retorno-mp-error-technical">
                          <summary>Ver detalles técnicos</summary>
                          <pre className="retorno-mp-error-json">
{JSON.stringify({
  status: state.error.status,
  statusText: state.error.statusText,
  code: state.error.code,
  method: state.error.method,
  url: state.error.url,
  requestPayload: state.error.requestPayload,
  responseData: state.error.responseData,
  fieldErrors: state.error.fieldErrors,
}, null, 2)}
                          </pre>
                          <button className="btn btn-outline btn-sm" onClick={copyError}>
                            <i className="bi bi-clipboard me-1"></i>
                            Copiar detalle
                          </button>
                        </details>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              // ===== Retorno MP (lo que ya tenías) =====
              <>
                {isApproved ? (
                  <>
                    {state.loading && (
                      <div className="retorno-mp-alert info">
                        <div className="retorno-mp-loading">
                          <div className="spinner"></div>
                          <div className="retorno-mp-loading-text">
                            <span>Creando tu factura…</span>
                            <span className="retorno-mp-attempt">Intento {state.intentos}</span>
                            {debug && <span className="retorno-mp-debug">Debug ON</span>}
                          </div>
                        </div>
                      </div>
                    )}

                    {!state.loading && state.ok && state.factura && (
                      <div className="retorno-mp-alert success">
                        <div className="retorno-mp-alert-header">
                          <i className="bi bi-check-circle"></i>
                          <span>Factura generada correctamente</span>
                        </div>
                        
                        <div className="retorno-mp-details">
                          <div className="retorno-mp-detail-item">
                            <div className="retorno-mp-detail-label">Número</div>
                            <div className="retorno-mp-detail-value">{state.factura.numero}</div>
                          </div>
                          <div className="retorno-mp-detail-item">
                            <div className="retorno-mp-detail-label">Factura ID</div>
                            <div className="retorno-mp-detail-value">{state.factura.id}</div>
                          </div>
                          <div className="retorno-mp-detail-item">
                            <div className="retorno-mp-detail-label">Total</div>
                            <div className="retorno-mp-detail-value total">{state.factura.total}</div>
                          </div>
                          <div className="retorno-mp-detail-item">
                            <div className="retorno-mp-detail-label">Moneda</div>
                            <div className="retorno-mp-detail-value">{state.factura.moneda}</div>
                          </div>
                        </div>
                        
                        <div className="retorno-mp-actions">
                          <button
                            className="btn btn-purple btn-sm"
                            onClick={() => onDescargarPDF(state.factura.id, state.factura.numero)}
                          >
                            <i className="bi bi-file-earmark-pdf me-1"></i>
                            Descargar PDF
                          </button>
                          <Link className="btn btn-cyan btn-sm" to={`/facturas/${state.factura.id}`}>
                            <i className="bi bi-eye me-1"></i>
                            Ver factura
                          </Link>
                        </div>
                      </div>
                    )}

                    {!state.loading && !state.ok && (
                      <div className="retorno-mp-alert warning">
                        <div className="retorno-mp-alert-header">
                          <i className="bi bi-exclamation-triangle"></i>
                          <span>Error al crear factura</span>
                        </div>
                        
                        <div className="retorno-mp-error-message">
                          {state.error?.shortMessage ||
                            "No pudimos crear la factura automáticamente. Intenta recargar en unos segundos."}
                        </div>
                        
                        {state.error && (
                          <div className="retorno-mp-error-details">
                            {state.error?.status && (
                              <div className="retorno-mp-error-item">
                                <strong>Status:</strong> {state.error.status} {state.error.statusText || ""}
                              </div>
                            )}
                            {state.error?.url && (
                              <div className="retorno-mp-error-item">
                                <strong>Endpoint:</strong> {state.error.method} {state.error.url}
                              </div>
                            )}
                            
                            <details className="retorno-mp-error-technical">
                              <summary>Ver detalles técnicos</summary>
                              <pre className="retorno-mp-error-json">
{JSON.stringify({
  status: state.error.status,
  statusText: state.error.statusText,
  code: state.error.code,
  method: state.error.method,
  url: state.error.url,
  requestPayload: state.error.requestPayload,
  responseData: state.error.responseData,
  fieldErrors: state.error.fieldErrors,
}, null, 2)}
                              </pre>
                              <button className="btn btn-outline btn-sm" onClick={copyError}>
                                <i className="bi bi-clipboard me-1"></i>
                                Copiar detalle
                              </button>
                            </details>
                          </div>
                        )}
                        
                        <div className="retorno-mp-actions">
                          <button className="btn btn-cyan btn-sm" onClick={() => window.location.reload()}>
                            <i className="bi bi-arrow-clockwise me-1"></i>
                            Reintentar ahora
                          </button>
                          <Link className="btn btn-outline btn-sm" to="/carrito">
                            <i className="bi bi-cart me-1"></i>
                            Ver carrito
                          </Link>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="retorno-mp-alert error">
                    <div className="retorno-mp-alert-header">
                      <i className="bi bi-x-circle"></i>
                      <span>Pago no aprobado</span>
                    </div>
                    <div className="retorno-mp-error-message">
                      Estado recibido: <strong>{q.status || "desconocido"}</strong><br />
                      No se intentará generar factura.
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Panel de detalles del pago solo tiene sentido en retorno MP */}
            {!isViewMode && (
              <div className="retorno-mp-payment-details">
                <div className="retorno-mp-payment-header">
                  <i className="bi bi-credit-card"></i>
                  <span>Detalles del pago</span>
                </div>
                <div className="retorno-mp-payment-content">
                  <div className="retorno-mp-payment-item">
                    <div className="retorno-mp-payment-label">Referencia</div>
                    <div className="retorno-mp-payment-value">{q.external_reference || "—"}</div>
                  </div>
                  <div className="retorno-mp-payment-item">
                    <div className="retorno-mp-payment-label">Pago (payment_id)</div>
                    <div className="retorno-mp-payment-value">{q.payment_id || "—"}</div>
                  </div>
                  <div className="retorno-mp-payment-item">
                    <div className="retorno-mp-payment-label">Carrito</div>
                    <div className="retorno-mp-payment-value">{q.carritoId || "—"}</div>
                  </div>
                  <div className="retorno-mp-payment-item">
                    <div className="retorno-mp-payment-label">Preference ID</div>
                    <div className="retorno-mp-payment-value">{q.preference_id || "—"}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="retorno-mp-navigation">
              <Link to="/" className="btn btn-cyan">
                <i className="bi bi-house-door me-1"></i>
                Volver al inicio
              </Link>
              <Link to="/carrito" className="btn btn-outline">
                <i className="bi bi-cart me-1"></i>
                Ver carrito
              </Link>
            </div>
          </div>
        </div>

        <p className="retorno-mp-footer">
          Si algo no se refleja de inmediato, espera unos segundos y recarga la página.
        </p>
      </div>
    </div>
  );
}
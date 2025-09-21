import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useParams, Link } from "react-router-dom";
import { crearFacturaDesdePago, getFactura, descargarFacturaPDF } from "../../api/Factura.api.js";

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
    <div className="container my-4">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-8">
          <div className="card shadow-sm border-0">
            <div className="card-body p-4">
              <div className="d-flex align-items-center mb-3">
                <div
                  className={`rounded-circle d-inline-flex align-items-center justify-content-center me-3 ${
                    isApproved ? "bg-success" : "bg-secondary"
                  }`}
                  style={{ width: 44, height: 44 }}
                >
                  <i className="bi bi-check2 text-white fs-4" />
                </div>
                <h1 className="h4 mb-0">
                  {isViewMode ? "Factura" : "¡Gracias por tu compra!"}
                </h1>
              </div>

              {/* Mensajería principal */}
              {isViewMode ? (
                <>
                  {state.loading && (
                    <div className="alert alert-info d-flex align-items-center" role="alert">
                      <div className="spinner-border spinner-border-sm me-2" />
                      Cargando factura…
                    </div>
                  )}

                  {!state.loading && state.ok && state.factura && (
                    <div className="alert alert-success" role="alert">
                      <h6 className="alert-heading mb-2">Factura</h6>
                      <div className="row g-3">
                        <div className="col-12 col-md-6">
                          <div className="small text-uppercase text-muted">Número</div>
                          <div className="fw-semibold">{state.factura.numero}</div>
                        </div>
                        <div className="col-12 col-md-6">
                          <div className="small text-uppercase text-muted">Factura ID</div>
                          <div className="fw-semibold">{state.factura.id}</div>
                        </div>
                        <div className="col-12 col-md-6">
                          <div className="small text-uppercase text-muted">Total</div>
                          <div className="fw-semibold">{state.factura.total}</div>
                        </div>
                        <div className="col-12 col-md-6">
                          <div className="small text-uppercase text-muted">Moneda</div>
                          <div className="fw-semibold">{state.factura.moneda}</div>
                        </div>
                      </div>

                      <div className="mt-3 d-flex gap-2">
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => onDescargarPDF(state.factura.id, state.factura.numero)}
                        >
                          Descargar PDF
                        </button>
                        <Link className="btn btn-outline-primary btn-sm" to="/facturas">
                          Volver al listado
                        </Link>
                      </div>
                    </div>
                  )}

                  {!state.loading && !state.ok && (
                    <div className="alert alert-warning" role="alert">
                      <div className="fw-semibold mb-1">
                        {state.error?.shortMessage || "No pudimos cargar la factura."}
                      </div>
                      <ul className="small mb-2">
                        {state.error?.status && (
                          <li><strong>Status:</strong> {state.error.status} {state.error.statusText || ""}</li>
                        )}
                        {state.error?.url && (
                          <li><strong>Endpoint:</strong> {state.error.method} {state.error.url}</li>
                        )}
                      </ul>
                      {state.error && (
                        <details className="mb-2">
                          <summary>Ver detalles técnicos</summary>
                          <pre className="mt-2 bg-light p-2 rounded" style={{ whiteSpace: "pre-wrap" }}>
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
                          <button className="btn btn-sm btn-outline-secondary" onClick={copyError}>
                            Copiar detalle
                          </button>
                        </details>
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
                        <div className="alert alert-info d-flex align-items-center" role="alert">
                          <div className="spinner-border spinner-border-sm me-2" />
                          <div>
                            Creando tu factura… <span className="fw-semibold">Intento {state.intentos}</span>
                            {debug && <span className="ms-2 badge bg-dark">Debug ON</span>}
                          </div>
                        </div>
                      )}

                      {!state.loading && state.ok && state.factura && (
                        <div className="alert alert-success" role="alert">
                          <h6 className="alert-heading mb-2">Factura generada correctamente</h6>
                          <div className="row g-3">
                            <div className="col-12 col-md-6">
                              <div className="small text-uppercase text-muted">Número</div>
                              <div className="fw-semibold">{state.factura.numero}</div>
                            </div>
                            <div className="col-12 col-md-6">
                              <div className="small text-uppercase text-muted">Factura ID</div>
                              <div className="fw-semibold">{state.factura.id}</div>
                            </div>
                            <div className="col-12 col-md-6">
                              <div className="small text-uppercase text-muted">Total</div>
                              <div className="fw-semibold">{state.factura.total}</div>
                            </div>
                            <div className="col-12 col-md-6">
                              <div className="small text-uppercase text-muted">Moneda</div>
                              <div className="fw-semibold">{state.factura.moneda}</div>
                            </div>
                          </div>
                          <div className="mt-3 d-flex gap-2">
                            <button
                              className="btn btn-outline-secondary btn-sm"
                              onClick={() => onDescargarPDF(state.factura.id, state.factura.numero)}
                            >
                              Descargar PDF
                            </button>
                            <Link className="btn btn-outline-primary btn-sm" to={`/facturas/${state.factura.id}`}>
                              Ver factura
                            </Link>
                          </div>
                        </div>
                      )}

                      {!state.loading && !state.ok && (
                        <div className="alert alert-warning" role="alert">
                          <div className="fw-semibold mb-1">
                            {state.error?.shortMessage ||
                              "No pudimos crear la factura automáticamente. Intenta recargar en unos segundos."}
                          </div>
                          <ul className="small mb-2">
                            {state.error?.status && (
                              <li><strong>Status:</strong> {state.error.status} {state.error.statusText || ""}</li>
                            )}
                            {state.error?.url && (
                              <li><strong>Endpoint:</strong> {state.error.method} {state.error.url}</li>
                            )}
                          </ul>
                          {state.error && (
                            <details className="mb-2">
                              <summary>Ver detalles técnicos</summary>
                              <pre className="mt-2 bg-light p-2 rounded" style={{ whiteSpace: "pre-wrap" }}>
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
                              <button className="btn btn-sm btn-outline-secondary" onClick={copyError}>
                                Copiar detalle
                              </button>
                            </details>
                          )}
                          <div className="d-flex gap-2">
                            <button className="btn btn-sm btn-outline-primary" onClick={() => window.location.reload()}>
                              Reintentar ahora
                            </button>
                            <Link className="btn btn-sm btn-outline-secondary" to="/carrito">
                              Ver carrito
                            </Link>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="alert alert-danger" role="alert">
                      <div className="fw-semibold">Estado recibido: {q.status || "desconocido"}</div>
                      No se intentará generar factura.
                    </div>
                  )}
                </>
              )}

              {/* Panel de detalles del pago solo tiene sentido en retorno MP */}
              {!isViewMode && (
                <div className="card mt-3">
                  <div className="card-header bg-light">Detalles del pago</div>
                  <div className="card-body">
                    <div className="row gy-2">
                      <div className="col-12 col-md-6">
                        <div className="text-muted small">Referencia</div>
                        <div className="fw-semibold">{q.external_reference || "—"}</div>
                      </div>
                      <div className="col-12 col-md-6">
                        <div className="text-muted small">Pago (payment_id)</div>
                        <div className="fw-semibold">{q.payment_id || "—"}</div>
                      </div>
                      <div className="col-12 col-md-6">
                        <div className="text-muted small">Carrito</div>
                        <div className="fw-semibold">{q.carritoId || "—"}</div>
                      </div>
                      <div className="col-12 col-md-6">
                        <div className="text-muted small">Preference ID</div>
                        <div className="fw-semibold">{q.preference_id || "—"}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="d-flex gap-2 mt-4">
                <Link to="/" className="btn btn-primary">Volver al inicio</Link>
                <Link to="/carrito" className="btn btn-outline-secondary">Ver carrito</Link>
              </div>
            </div>
          </div>

          <p className="text-center text-muted small mt-3 mb-0">
            Si algo no se refleja de inmediato, espera unos segundos y recarga la página.
          </p>
        </div>
      </div>
    </div>
  );
}

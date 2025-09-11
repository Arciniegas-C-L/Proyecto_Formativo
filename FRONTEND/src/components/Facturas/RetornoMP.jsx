import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { crearFacturaDesdePago } from "../../api/Factura.api.js";

export function RetornoMP() {
  const [params] = useSearchParams();
  const [state, setState] = useState({
    loading: true,
    ok: false,
    error: null,
    factura: null,
    intentos: 0,
  });

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

  useEffect(() => {
    if ((q.status || "").toLowerCase() !== "approved") {
      setState((s) => ({
        ...s,
        loading: false,
        ok: false,
        error: "Pago no aprobado.",
        factura: null,
      }));
      return;
    }

    let cancel = false;
    let tries = 0;
    const MAX_TRIES = 4;
    const DELAY = 1500;

    const intentar = async () => {
      if (cancel) return;
      tries += 1;
      setState((s) => ({ ...s, loading: true, error: null, intentos: tries }));

      try {
        const body = {
          payment_id: q.payment_id || undefined,
          external_reference: q.external_reference || undefined,
          carrito_id: q.carritoId ? Number(q.carritoId) : undefined,
        };

        const { data } = await crearFacturaDesdePago(body);
        if (cancel) return;

        setState({
          loading: false,
          ok: true,
          error: null,
          factura: data,
          intentos: tries,
        });
      } catch (err) {
        if (cancel) return;
        if (tries < MAX_TRIES) {
          setTimeout(intentar, DELAY);
        } else {
          setState({
            loading: false,
            ok: false,
            error:
              "No pudimos crear la factura automáticamente. Intenta recargar en unos segundos.",
            factura: null,
            intentos: tries,
          });
        }
      }
    };

    intentar();
    return () => {
      cancel = true;
    };
  }, [q]);

  const isApproved = (q.status || "").toLowerCase() === "approved";

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
                <h1 className="h4 mb-0">¡Gracias por tu compra!</h1>
              </div>

              {isApproved ? (
                <>
                  {state.loading && (
                    <div className="alert alert-info d-flex align-items-center" role="alert">
                      <div
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      />
                      <div>
                        Creando tu factura… <span className="fw-semibold">Intento {state.intentos}</span>
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

                      {/* Si tienes ruta a detalle de factura, habilita el link */}
                      {/* <Link to={`/facturas/${state.factura.id}`} className="btn btn-outline-success btn-sm mt-3">
                        Ver factura
                      </Link> */}
                    </div>
                  )}

                  {!state.loading && !state.ok && (
                    <div className="alert alert-warning" role="alert">
                      <div className="fw-semibold mb-1">{state.error}</div>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => window.location.reload()}
                      >
                        Reintentar ahora
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="alert alert-danger" role="alert">
                  <div className="fw-semibold">Estado recibido: {q.status || "desconocido"}</div>
                  No se intentará generar factura.
                </div>
              )}

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

              <div className="d-flex gap-2 mt-4">
                <Link to="/" className="btn btn-primary">
                  Volver al inicio
                </Link>
                <Link to="/carrito" className="btn btn-outline-secondary">
                  Ver carrito
                </Link>
              </div>
            </div>
          </div>

          {/* Footer mini */}
          <p className="text-center text-muted small mt-3 mb-0">
            Si algo no se refleja de inmediato, espera unos segundos y recarga la página.
          </p>
        </div>
      </div>
    </div>
  );
}

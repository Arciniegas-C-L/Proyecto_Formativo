import React, { useEffect, useMemo, useState } from "react";
import {
  listarAlertasActivas,
} from "../../api/AlertasActivas.api";
import {
  resumenNotificaciones,
  marcarTodasNotificaciones,
} from "../../api/Notificaciones.api";

// Util: formatea fecha "hace X"
function timeAgo(iso) {
  if (!iso) return "";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `hace ${Math.floor(diff)}s`;
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
  return `hace ${Math.floor(diff / 86400)}d`;
}

export function AdminStockNotifications({
  isAdmin = false,             // pásalo desde tu auth: user.rol_nombre === 'administrador'
  pollMs = 30000,              // cada cuánto refresca (30s)
  onGoToInventario = null,     // opcional: callback para navegar al inventario del producto/talla
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alertas, setAlertas] = useState([]);
  const [badge, setBadge] = useState({ unread: 0, low: 0, out: 0 });
  const [error, setError] = useState("");

  const totalAlertas = useMemo(() => alertas.length, [alertas]);
  const totalBadge = useMemo(() => (badge?.unread ?? 0), [badge]);

  const loadData = async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError("");
    try {
      // 1) Resumen para badge campana
      const r = await resumenNotificaciones();
      setBadge(r.data || { unread: 0, low: 0, out: 0 });

      // 2) Alertas activas (estado actual por inventario)
      const a = await listarAlertasActivas({}); // puedes filtrar: { tipo: "stock_low" }
      const rows = a.data?.results ?? a.data ?? [];
      setAlertas(rows);
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.detail || "No se pudieron cargar notificaciones.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    loadData();
    const id = setInterval(loadData, pollMs);
    return () => clearInterval(id);
    // eslint-disable-next-line
  }, [isAdmin, pollMs]);

  if (!isAdmin) return null;

  return (
    <>
      {/* Botón flotante tipo "sticker/bolita" */}
      <button
        type="button"
        className="btn btn-primary rounded-circle position-fixed d-flex align-items-center justify-content-center shadow"
        style={{
          width: 56, height: 56, right: 18, bottom: 18, zIndex: 1080,
        }}
        onClick={() => setOpen(true)}
        aria-label="Notificaciones de stock"
        title="Notificaciones de stock"
      >
        <span style={{ fontSize: 20, lineHeight: 1 }}>🔔</span>
        {totalBadge > 0 && (
          <span
            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
            style={{ fontSize: 12 }}
          >
            {totalBadge}
            <span className="visually-hidden">no leídas</span>
          </span>
        )}
      </button>

      {/* Panel lateral (offcanvas custom) */}
      <div
        className={`position-fixed top-0 end-0 h-100 ${open ? "" : "d-none"}`}
        style={{ zIndex: 1075, width: 380, background: "transparent" }}
        role="dialog"
        aria-modal="true"
      >
        {/* backdrop */}
        <div
          className="position-fixed top-0 start-0 w-100 h-100"
          style={{ background: "rgba(0,0,0,0.25)" }}
          onClick={() => setOpen(false)}
        />
        {/* panel */}
        <div
          className="card shadow h-100"
          style={{ width: 380, position: "absolute", right: 0, top: 0 }}
        >
          <div className="card-header d-flex align-items-center justify-content-between">
            <div className="d-flex flex-column">
              <strong>Alertas de stock</strong>
              <small className="text-muted">
                {badge.low} bajo · {badge.out} sin stock
              </small>
            </div>
            <div className="d-flex align-items-center gap-2">
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={loadData}
                disabled={loading}
                title="Refrescar"
              >
                {loading ? "..." : "Refrescar"}
              </button>
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={async () => {
                  try {
                    await marcarTodasNotificaciones();
                    await loadData();
                  } catch (e) {
                    console.error(e);
                  }
                }}
                title="Marcar todas como vistas"
              >
                Vistas
              </button>
              <button
                className="btn btn-sm btn-light"
                onClick={() => setOpen(false)}
                title="Cerrar"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="card-body p-0 d-flex flex-column" style={{ minHeight: 0 }}>
            {error && (
              <div className="alert alert-danger m-2">{error}</div>
            )}

            {/* Lista */}
            <div className="list-group list-group-flush overflow-auto" style={{ flex: 1 }}>
              {!loading && alertas.length === 0 && (
                <div className="text-center text-muted p-4">
                  {badge.unread > 0
                    ? "Sin alertas activas, pero hay notificaciones no leídas."
                    : "Sin alertas activas."}
                </div>
              )}

              {alertas.map((a) => {
                const tipo = a.tipo; // 'stock_low' | 'stock_out'
                const isOut = tipo === "stock_out";
                const producto = a.producto || a?.inventario?.producto?.nombre; // por compatibilidad de serializer
                const talla = a.talla || a?.inventario?.talla?.nombre;
                const cantidad = a.cantidad ?? 0;

                return (
                  <div key={a.id} className="list-group-item">
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="me-2">
                        <div className="fw-semibold">
                          {producto || "Producto"}{" "}
                          {talla ? <span className="text-muted">· {talla}</span> : null}
                        </div>
                        <div className="small text-muted">
                          {isOut ? "Sin stock" : `Stock bajo: ${cantidad} uds`}
                        </div>
                        {a.actualizado_en && (
                          <div className="small text-muted">{timeAgo(a.actualizado_en)}</div>
                        )}
                      </div>
                      <span className={`badge ${isOut ? "bg-danger" : "bg-warning text-dark"}`}>
                        {isOut ? "Sin stock" : "Bajo"}
                      </span>
                    </div>
                    <div className="mt-2 d-flex gap-2">
                      {typeof onGoToInventario === "function" ? (
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() =>
                            onGoToInventario({
                              inventarioId: a.inventario ?? a.inventario_id,
                              producto: producto,
                              talla: talla,
                            })
                          }
                        >
                          Ir a inventario
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Footer resumen */}
            <div className="border-top p-2 d-flex justify-content-between align-items-center">
              <small className="text-muted">
                Total alertas activas: <strong>{totalAlertas}</strong>
              </small>
              <button className="btn btn-sm btn-outline-secondary" onClick={() => setOpen(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

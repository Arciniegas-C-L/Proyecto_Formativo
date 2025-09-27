// AdminStockNotifications.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  getTablaCategorias,
  getTablaSubcategorias,
  getTablaProductos,
} from "../../api/InventarioApi";

// --- Util: "hace X"
function timeAgo(iso) {
  if (!iso) return "";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `hace ${Math.floor(diff)}s`;
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
  return `hace ${Math.floor(diff / 86400)}d`;
}

// clave única por alerta
const aKey = (a) => `${a.categoriaId}-${a.subcategoriaId}-${a.productoId}-${a.tallaId}-${a.tipo}`;

export function AdminStockNotifications({
  isAdmin = false,          // pásalo desde auth: user.rol_nombre === 'administrador'
  pollMs = 30000,           // intervalo de refresco
  umbralGlobal = 5,         // fallback si no viene stock_minimo en la talla
  onGoToInventario = null,  // ({categoriaId, subcategoriaId, productoId, tallaId, ...})
}) {
  const [open, setOpen] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingBadge, setLoadingBadge] = useState(false);
  const [alertas, setAlertas] = useState([]);
  const [errorList, setErrorList] = useState("");
  const [errorBadge, setErrorBadge] = useState("");
  const [readSet, setReadSet] = useState(() => new Set());

  const mountedRef = useRef(true);
  const visibleRef = useRef(typeof document !== "undefined" ? document.visibilityState === "visible" : true);

  const counts = useMemo(() => {
    let unread = 0, low = 0, out = 0;
    for (const a of alertas) {
      if (!readSet.has(aKey(a))) unread++;
      if (a.tipo === "stock_out") out++;
      if (a.tipo === "stock_low") low++;
    }
    return { unread, low, out, total: alertas.length };
  }, [alertas, readSet]);

  const safeSet = useCallback((setter, v) => {
    if (mountedRef.current) setter(v);
  }, []);

  // --------------------------
  // Núcleo: leer inventario y derivar alertas desde tus endpoints (resp.datos)
  // --------------------------
  const derivarAlertas = useCallback(async () => {
    // 1) Categorías
    const catRes = await getTablaCategorias();            // { datos: [...] }
    const categorias = catRes?.datos ?? [];

    // 2) Subcategorías por categoría (paralelo) -> getTablaSubcategorias(categoriaId)
    const subPromises = categorias.map((c) => getTablaSubcategorias(c.id));
    const subSettled = await Promise.allSettled(subPromises);

    const catSubs = [];
    subSettled.forEach((r, idx) => {
      const categoria = categorias[idx];
      const subcats = r.status === "fulfilled" ? (r.value?.datos ?? []) : [];
      if (categoria && Array.isArray(subcats)) {
        catSubs.push({ categoria, subcats });
      }
    });

    // 3) Productos por subcategoría (paralelo) -> getTablaProductos(subcategoriaId)
    const prodPromises = [];
    const meta = [];
    for (const { categoria, subcats } of catSubs) {
      for (const sc of subcats) {
        prodPromises.push(getTablaProductos(sc.id));
        meta.push({ categoria, subcat: sc });
      }
    }
    const prodSettled = await Promise.allSettled(prodPromises);

    // 4) Construir alertas por talla (usa stock_minimo cuando venga; si no, umbralGlobal)
    const nowIso = new Date().toISOString();
    const alerts = [];

    prodSettled.forEach((r, i) => {
      if (r.status !== "fulfilled") return;
      const productos = r.value?.datos ?? [];
      const { categoria, subcat } = meta[i] || {};

      for (const p of productos) {
        // p.stock_por_talla -> { "S": { talla_id, stock, stock_minimo }, ... }
        const spt = p?.stock_por_talla || {};
        for (const [tallaNombre, info] of Object.entries(spt)) {
          const tallaId = info?.talla_id;
          const stock = Number(info?.stock ?? 0);
          const smin = Number(info?.stock_minimo != null ? info.stock_minimo : umbralGlobal);

          if (stock <= 0) {
            alerts.push({
              id: `out-${categoria?.id}-${subcat?.id}-${p.id}-${tallaId}`,
              tipo: "stock_out",
              categoriaId: categoria?.id,
              categoria: categoria?.nombre,
              subcategoriaId: subcat?.id,
              subcategoria: subcat?.nombre,
              productoId: p.id,
              producto: p.nombre,
              tallaId,
              talla: tallaNombre,
              cantidad: 0,
              stock_minimo: smin,
              actualizado_en: nowIso,
            });
          } else if (stock <= smin) {
            alerts.push({
              id: `low-${categoria?.id}-${subcat?.id}-${p.id}-${tallaId}`,
              tipo: "stock_low",
              categoriaId: categoria?.id,
              categoria: categoria?.nombre,
              subcategoriaId: subcat?.id,
              subcategoria: subcat?.nombre,
              productoId: p.id,
              producto: p.nombre,
              tallaId,
              talla: tallaNombre,
              cantidad: stock,
              stock_minimo: smin,
              actualizado_en: nowIso,
            });
          }
        }
      }
    });

    return alerts;
  }, [umbralGlobal]);

  // Carga para badge (conteo) – deriva alertas
  const loadBadge = useCallback(async () => {
    if (!isAdmin || !visibleRef.current) return;
    safeSet(setLoadingBadge, true);
    safeSet(setErrorBadge, "");
    try {
      const alerts = await derivarAlertas();
      // Evitar setState si nada cambió (firma por id+cantidad)
      safeSet(setAlertas, (prev) => {
        const sigPrev = JSON.stringify(prev.map((a) => [a.id, a.cantidad]));
        const sigNew  = JSON.stringify(alerts.map((a) => [a.id, a.cantidad]));
        return sigPrev === sigNew ? prev : alerts;
      });
    } catch (e) {
      console.error(e);
      safeSet(setErrorBadge, "No se pudo calcular el estado de stock.");
    } finally {
      safeSet(setLoadingBadge, false);
    }
  }, [isAdmin, derivarAlertas, safeSet]);

  // Carga para lista (cuando el panel está abierto)
  const loadList = useCallback(async () => {
    if (!isAdmin || !open || !visibleRef.current) return;
    safeSet(setLoadingList, true);
    safeSet(setErrorList, "");
    try {
      const alerts = await derivarAlertas();
      safeSet(setAlertas, (prev) => {
        const sigPrev = JSON.stringify(prev.map((a) => [a.id, a.cantidad]));
        const sigNew  = JSON.stringify(alerts.map((a) => [a.id, a.cantidad]));
        return sigPrev === sigNew ? prev : alerts;
      });
    } catch (e) {
      console.error(e);
      safeSet(setErrorList, "No se pudieron cargar las alertas de stock.");
    } finally {
      safeSet(setLoadingList, false);
    }
  }, [isAdmin, open, derivarAlertas, safeSet]);

  // Visibilidad pestaña
  useEffect(() => {
    mountedRef.current = true;
    const onVis = () => {
      visibleRef.current = document.visibilityState === "visible";
      if (visibleRef.current) { loadBadge(); loadList(); }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      mountedRef.current = false;
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [loadBadge, loadList]);

  // Polling badge
  useEffect(() => {
    if (!isAdmin) return;
    loadBadge(); // primera
    const id = setInterval(() => visibleRef.current && loadBadge(), pollMs);
    return () => clearInterval(id);
  }, [isAdmin, pollMs, loadBadge]);

  // Polling lista
  useEffect(() => {
    if (!isAdmin) return;
    if (open) loadList();
    const id = open ? setInterval(() => visibleRef.current && loadList(), pollMs) : null;
    return () => id && clearInterval(id);
  }, [isAdmin, open, pollMs, loadList]);

  if (!isAdmin) return null;

  // acciones locales
  const markAllRead = () => {
    const next = new Set(readSet);
    for (const a of alertas) next.add(aKey(a));
    setReadSet(next);
  };
  const markOneRead = (a) => setReadSet((prev) => new Set(prev).add(aKey(a)));

  return (
    <>
      {/* Botón flotante */}
      <button
        type="button"
        className="btn btn-primary rounded-circle position-fixed d-flex align-items-center justify-content-center shadow"
        style={{ width: 56, height: 56, right: 18, bottom: 18, zIndex: 1080 }}
        onClick={() => setOpen(true)}
        aria-label="Notificaciones de stock"
        title="Notificaciones de stock"
      >
        <span style={{ fontSize: 20, lineHeight: 1 }} aria-hidden>🔔</span>
        {counts.unread > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: 12 }}>
            {loadingBadge ? "…" : counts.unread}
            <span className="visually-hidden">no leídas</span>
          </span>
        )}
      </button>

      {/* Panel lateral */}
      <div
        className={`position-fixed top-0 end-0 h-100 ${open ? "" : "d-none"}`}
        style={{ zIndex: 1075, width: 400, background: "transparent" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="hdr-alertas-stock"
      >
        {/* backdrop */}
        <div
          className="position-fixed top-0 start-0 w-100 h-100"
          style={{ background: "rgba(0,0,0,0.25)" }}
          onClick={() => setOpen(false)}
        />
        {/* panel */}
        <div className="card shadow h-100" style={{ width: 400, position: "absolute", right: 0, top: 0 }}>
          <div className="card-header d-flex align-items-center justify-content-between">
            <div className="d-flex flex-column">
              <strong id="hdr-alertas-stock">Alertas de stock</strong>
              <small className="text-muted">
                {counts.low} bajo · {counts.out} sin stock
              </small>
            </div>
            <div className="d-flex align-items-center gap-2">
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => { loadBadge(); loadList(); }}
                disabled={loadingList || loadingBadge}
                title="Refrescar"
              >
                {loadingList || loadingBadge ? "..." : "Refrescar"}
              </button>
              <button className="btn btn-sm btn-outline-primary" onClick={markAllRead} title="Marcar todas como vistas">
                Vistas
              </button>
              <button className="btn btn-sm btn-light" onClick={() => setOpen(false)} title="Cerrar" aria-label="Cerrar panel">
                ✕
              </button>
            </div>
          </div>

          <div className="card-body p-0 d-flex flex-column" style={{ minHeight: 0 }}>
            {(errorBadge || errorList) && <div className="alert alert-danger m-2">{errorBadge || errorList}</div>}

            {/* Lista */}
            <div className="list-group list-group-flush overflow-auto" style={{ flex: 1 }}>
              {!loadingList && alertas.length === 0 && (
                <div className="text-center text-muted p-4">Sin alertas activas.</div>
              )}

              {loadingList && (
                <div className="p-3">
                  <div className="placeholder-glow">
                    <div className="placeholder col-10 mb-2"></div>
                    <div className="placeholder col-7 mb-2"></div>
                    <div className="placeholder col-5 mb-2"></div>
                  </div>
                </div>
              )}

              {!loadingList && alertas.map((a) => {
                const isOut = a.tipo === "stock_out";
                const isRead = readSet.has(aKey(a));
                return (
                  <div key={a.id} className={`list-group-item ${isRead ? "opacity-75" : ""}`}>
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="me-2">
                        <div className="fw-semibold">
                          {a.producto} <span className="text-muted">· {a.talla}</span>
                        </div>
                        <div className="small text-muted">
                          <span className="me-2">{a.categoria} / {a.subcategoria}</span>
                          {isOut ? "Sin stock" : `Stock bajo: ${a.cantidad} (mínimo: ${a.stock_minimo})`}
                        </div>
                        {a.actualizado_en && <div className="small text-muted">{timeAgo(a.actualizado_en)}</div>}
                      </div>
                      <span className={`badge ${isOut ? "bg-danger" : "bg-warning text-dark"}`}>
                        {isOut ? "Sin stock" : "Bajo"}
                      </span>
                    </div>

                    <div className="mt-2 d-flex flex-wrap gap-2">
                      {typeof onGoToInventario === "function" && (
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() =>
                            onGoToInventario({
                              categoriaId: a.categoriaId,
                              subcategoriaId: a.subcategoriaId,
                              productoId: a.productoId,
                              tallaId: a.tallaId,
                              producto: a.producto,
                              talla: a.talla,
                            })
                          }
                        >
                          Ir a inventario
                        </button>
                      )}
                      {!isRead && (
                        <button className="btn btn-sm btn-outline-primary" onClick={() => markOneRead(a)}>
                          Marcar como vista
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="border-top p-2 d-flex justify-content-between align-items-center">
              <small className="text-muted">
                Total alertas activas: <strong>{counts.total}</strong>
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

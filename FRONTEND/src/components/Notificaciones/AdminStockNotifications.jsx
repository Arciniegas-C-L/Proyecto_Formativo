import React, { useEffect, useMemo, useRef, useState, useCallback, } from "react";
import {
  getTablaCategorias,
  getTablaSubcategorias,
  getTablaProductos,
} from "../../api/InventarioApi";
import "../../assets/css/Notificaciones/AdminStockNotificaciones.css";
import { useNavigate } from 'react-router-dom';

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
  // ⚠️ Ignoraremos cualquier stock_minimo del backend y usaremos SIEMPRE este umbral por talla:
  umbralGlobal = 5,         // <--- umbral fijo por talla
  onGoToInventario = null,  // ({categoriaId, subcategoriaId, productoId, tallaId, ...})
  
  // Posicionamiento
  position = "top-right",   // "top-right" | "top-left" | "bottom-right" | "bottom-left"
  offset = 20,
  customPosition = null,    // { top?, right?, bottom?, left? }
}) {
  const [open, setOpen] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingBadge, setLoadingBadge] = useState(false);
  const [alertas, setAlertas] = useState([]);
  const [errorList, setErrorList] = useState("");
  const [errorBadge, setErrorBadge] = useState("");
  const [readSet, setReadSet] = useState(() => new Set());
  const Navigate = useNavigate();

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

  // Calcular estilos de posicionamiento
  const buttonStyles = useMemo(() => {
    if (customPosition) return customPosition;
    const styles = {};
    switch (position) {
      case "top-left": styles.top = `${offset}px`; styles.left = `${offset}px`; break;
      case "bottom-left": styles.bottom = `${offset}px`; styles.left = `${offset}px`; break;
      case "bottom-right": styles.bottom = `${offset}px`; styles.right = `${offset}px`; break;
      case "top-right":
      default: styles.top = `${offset}px`; styles.right = `${offset}px`; break;
    }
    return styles;
  }, [position, offset, customPosition]);

  const safeSet = useCallback((setter, v) => {
    if (mountedRef.current) setter(v);
  }, []);

  // --------------------------
  // Núcleo: leer inventario y derivar alertas
  // REGLA: alerta "stock_out" si stock === 0
  //        alerta "stock_low" si 0 < stock < 5 (ignorando stock_minimo del backend)
  // --------------------------
  const derivarAlertas = useCallback(async () => {
    const catRes = await getTablaCategorias(); // { datos: [...] }
    const categorias = catRes?.datos ?? [];

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

    const prodPromises = [];
    const meta = [];
    for (const { categoria, subcats } of catSubs) {
      for (const sc of subcats) {
        prodPromises.push(getTablaProductos(sc.id));
        meta.push({ categoria, subcat: sc });
      }
    }
    const prodSettled = await Promise.allSettled(prodPromises);

    const nowIso = new Date().toISOString();
    const alerts = [];

    prodSettled.forEach((r, i) => {
      if (r.status !== "fulfilled") return;
      const productos = r.value?.datos ?? [];
      const { categoria, subcat } = meta[i] || {};

      for (const p of productos) {
        // p.stock_por_talla -> { "S": { talla_id, stock, ... }, ... }
        const spt = p?.stock_por_talla || {};
        for (const [tallaNombre, info] of Object.entries(spt)) {
          const tallaId = info?.talla_id;
          const stock = Number(info?.stock ?? 0);

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
              // mantenemos el campo para UI, pero SIEMPRE 5
              stock_minimo: umbralGlobal,
              actualizado_en: nowIso,
            });
          } else if (stock < umbralGlobal) {
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
              stock_minimo: umbralGlobal, // fijo a 5 para consistencia visual
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
      {/* Botón flotante con posicionamiento flexible */}
      <button
        type="button"
        className="notification-btn-float"
        style={buttonStyles}
        onClick={() => setOpen(true)}
        aria-label="Notificaciones de stock"
        title={`Notificaciones de stock - ${counts.unread > 0 ? counts.unread + ' sin leer' : counts.total + ' alertas'}`}
      >
        <span className="notification-icon" aria-hidden="true">🔔</span>
        {(counts.total > 0) && (
          <span className="notification-badge">
            {loadingBadge ? "…" : (counts.unread > 0 ? counts.unread : counts.total)}
            <span className="visually-hidden">
              {counts.unread > 0 ? "no leídas" : "alertas totales"}
            </span>
          </span>
        )}
      </button>

      {/* Panel lateral */}
      <div
        className={`notification-panel ${open ? "notification-panel-open" : "notification-panel-closed"}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="hdr-alertas-stock"
      >
        {/* backdrop */}
        <div
          className="notification-backdrop"
          onClick={() => setOpen(false)}
        />
        {/* panel */}
        <div className="notification-content">
          <div className="notification-header">
            <div className="notification-title-section">
              <strong id="hdr-alertas-stock" className="notification-title">Alertas de stock</strong>
              <small className="notification-subtitle">
                {counts.low} bajo · {counts.out} sin stock
              </small>
            </div>
            <div className="notification-actions">
              <button
                className="btn btn-sm btn-outline-secondary notification-btn-refresh"
                onClick={() => { loadBadge(); loadList(); }}
                disabled={loadingList || loadingBadge}
                title="Refrescar"
              >
                {loadingList || loadingBadge ? "..." : "Refrescar"}
              </button>
              <button 
                className="btn btn-sm btn-outline-primary notification-btn-read-all" 
                onClick={markAllRead} 
                title="Marcar todas como vistas"
              >
                Vistas
              </button>
              <button 
                className="btn btn-sm btn-light notification-btn-close" 
                onClick={() => setOpen(false)} 
                title="Cerrar" 
                aria-label="Cerrar panel"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="notification-body">
            {(errorBadge || errorList) && (
              <div className="alert alert-danger notification-error">
                {errorBadge || errorList}
              </div>
            )}

            {/* Lista */}
            <div className="notification-list">
              {!loadingList && alertas.length === 0 && (
                <div className="notification-empty">Sin alertas activas.</div>
              )}

              {loadingList && (
                <div className="notification-loading">
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
                  <div key={a.id} className={`notification-item ${isRead ? "notification-item-read" : ""}`}>
                    <div className="notification-item-main">
                      <div className="notification-item-content">
                        <div className="notification-item-title">
                          {a.producto} <span className="notification-item-talla">· {a.talla}</span>
                        </div>
                        <div className="notification-item-details">
                          <span className="notification-item-category">
                            {a.categoria} / {a.subcategoria}
                          </span>
                          <span className="notification-item-stock">
                            {isOut
                              ? "Sin stock"
                              : `Stock bajo: ${a.cantidad}` /* mostramos regla fija */}
                          </span>
                        </div>
                        {a.actualizado_en && (
                          <div className="notification-item-time">{timeAgo(a.actualizado_en)}</div>
                        )}
                      </div>
                      <span className={`badge notification-badge-status ${isOut ? "notification-badge-out" : "notification-badge-low"}`}>
                        {isOut ? "Sin stock" : "Bajo"}
                      </span>
                    </div>

                    <div className="notification-item-buttons">
                      {typeof onGoToInventario === "function" && (
                        <button
                          className="btn btn-sm btn-outline-secondary notification-btn-go"
                          onClick={() =>
                           Navigate(
                            `/admin/inventario`
                          )
                          }
                        >
                          Ir a inventario
                        </button>
                      )}
                      {!isRead && (
                        <button 
                          className="btn btn-sm btn-outline-primary notification-btn-mark" 
                          onClick={() => markOneRead(a)}
                        >
                          Marcar como vista
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="notification-footer">
              <small className="notification-total">
                Total alertas activas: <strong>{counts.total}</strong>
              </small>
              <button 
                className="btn btn-sm btn-outline-secondary notification-btn-close-footer" 
                onClick={() => setOpen(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

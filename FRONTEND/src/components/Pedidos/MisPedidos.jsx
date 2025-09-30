import React, { useEffect, useMemo, useState } from "react";

import { listarPedidos } from "../../api/Pedido.api";
import { listarItemsDePedido } from "../../api/PedidoProducto.api.js";
import { Link } from "react-router-dom";
import "../../assets/css/Pedidos/MisPedidos.css";

const PAGE_SIZE = 5;

function fmtMoney(value, locale = "es-CO") {
  const n = typeof value === "number" ? value : parseFloat(value ?? 0);
  if (Number.isNaN(n)) return "—";
  return n.toLocaleString(locale, { maximumFractionDigits: 0 });
}

function fmtFecha(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleString("es-CO", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function EstadoBadge({ estado }) {
  const ok = !!estado;
  return (
    <span
      className={`mis-pedidos-badge ${ok ? "mis-pedidos-badge-success" : "mis-pedidos-badge-secondary"}`}
      title={ok ? "Completado" : "Pendiente"}
    >
      {ok ? "Completado" : "Pendiente"}
    </span>
  );
}

/** Normaliza diferentes formas de items para mostrarlos homogéneamente */
function normalizeItems(rawItems) {
  if (!Array.isArray(rawItems)) return [];
  return rawItems.map((it) => {
    // Caso A: PedidoItem (serializer anidado)
    if ("producto_nombre" in it || "subtotal" in it || "precio" in it) {
      return {
        nombre: it.producto_nombre ?? it.producto_data?.nombre ?? "Producto",
        imagen: it.producto?.imagen ?? it.producto_data?.imagen ?? it.imagen ?? null,
        cantidad: it.cantidad ?? 1,
        precio: it.precio ?? it.producto_data?.precio ?? null,
        subtotal: it.subtotal ?? null,
        talla: it.talla_nombre ?? null,
      };
    }
    // Caso B: PedidoProducto (producto viene anidado)
    const prod = it.producto ?? {};
    return {
      nombre: prod.nombre ?? "Producto",
      imagen: prod.imagen ?? null,
      cantidad: it.cantidad ?? 1,
      precio: prod.precio ?? it.precio ?? null,
      subtotal: it.subtotal ?? null,
      talla: prod.talla ?? it.talla ?? null,
    };
  });
}

export function MisPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // paginación
  const [page, setPage] = useState(1);

  // estado por pedido: abierto/cerrado + cache de items
  const [expanded, setExpanded] = useState({});
  const [itemsByPedido, setItemsByPedido] = useState({});
  const [loadingItems, setLoadingItems] = useState({});

  // placeholder inline (sin llamadas externas)
  const PLACEHOLDER =
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200'><rect width='100%' height='100%' fill='%23f4f4f5'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23666' font-family='Arial' font-size='16'>Producto</text></svg>";

  const ordered = useMemo(() => {
    const arr = [...pedidos].sort((a, b) => {
      const ai = a.idPedido ?? a.id ?? 0;
      const bi = b.idPedido ?? b.id ?? 0;
      return bi - ai;
    });
    return arr;
  }, [pedidos]);

  // recalcular límites de paginación al cambiar lista
  const totalPages = Math.max(1, Math.ceil(ordered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const from = (safePage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE;
  const pageSlice = ordered.slice(from, to);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const { data } = await listarPedidos();
        const rows = Array.isArray(data) ? data : data?.results ?? [];
        setPedidos(rows);
        setPage(1); // resetea a la primera página al cargar
      } catch (e) {
        console.error("Error listando pedidos:", e);
        setErr("No se pudieron cargar tus pedidos.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleExpand = async (pedido) => {
    const pid = pedido.idPedido ?? pedido.id;
    const next = !expanded[pid];
    setExpanded((s) => ({ ...s, [pid]: next }));
    if (!next) return;

    // 1) cache
    if (Array.isArray(itemsByPedido[pid])) return;

    // 2) items anidados
    if (Array.isArray(pedido.items) && pedido.items.length > 0) {
      const norm = normalizeItems(pedido.items);
      setItemsByPedido((s) => ({ ...s, [pid]: norm }));
      return;
    }

    // 3) fallback: /pedidoproductos/?pedido=<id>
    try {
      setLoadingItems((s) => ({ ...s, [pid]: true }));
      const { data } = await listarItemsDePedido(pid);
      const rows = Array.isArray(data) ? data : data?.results ?? [];
      const norm = normalizeItems(rows);
      setItemsByPedido((s) => ({ ...s, [pid]: norm }));
    } catch (e) {
      console.error("Error listando items del pedido:", e);
      setItemsByPedido((s) => ({
        ...s,
        [pid]: { _error: "No se pudieron cargar los productos." },
      }));
    } finally {
      setLoadingItems((s) => ({ ...s, [pid]: false }));
    }
  };

  const changePage = (p) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
    // opcional: cerrar expansiones al cambiar de página
    // setExpanded({});
  };

  if (loading) {
    return (
      <div className="mis-pedidos-container">
        <div className="mis-pedidos-header">
          <h1 className="mis-pedidos-titulo">Mis pedidos</h1>
        </div>
        <div className="mis-pedidos-alert mis-pedidos-alert-info">
          <i className="fas fa-spinner fa-spin"></i>
          Cargando tus pedidos…
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="mis-pedidos-container">
        <div className="mis-pedidos-header">
          <h1 className="mis-pedidos-titulo">Mis pedidos</h1>
        </div>
        <div className="mis-pedidos-alert mis-pedidos-alert-danger">
          <i className="fas fa-exclamation-triangle"></i>
          {err}
        </div>
      </div>
    );
  }

  if (!ordered.length) {
    return (
      <div className="mis-pedidos-container">
        <div className="mis-pedidos-header">
          <h1 className="mis-pedidos-titulo">Mis pedidos</h1>
        </div>
        <div className="mis-pedidos-empty">
          <div className="mis-pedidos-empty-icon">
            <i className="fas fa-shopping-bag"></i>
          </div>
          <h3>Aún no tienes pedidos</h3>
          <p>Explora nuestro catálogo y realiza tu primer pedido</p>
          <Link to="/catalogo" className="mis-pedidos-btn mis-pedidos-btn-primary">
            <i className="fas fa-store"></i>
            Ir al catálogo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mis-pedidos-container">
      <div className="mis-pedidos-header">
        <h1 className="mis-pedidos-titulo">Mis pedidos</h1>
        <div className="mis-pedidos-stats">
          <div className="mis-pedidos-stat">
            <span className="mis-pedidos-stat-number">{ordered.length}</span>
            <span className="mis-pedidos-stat-label">
              {ordered.length === 1 ? "pedido" : "pedidos"}
            </span>
          </div>
          <div className="mis-pedidos-stat">
            <span className="mis-pedidos-stat-number">{safePage}</span>
            <span className="mis-pedidos-stat-label">de {totalPages}</span>
          </div>
        </div>
      </div>

      <div className="mis-pedidos-list">
        {pageSlice.map((p) => {
          const pid = p.idPedido ?? p.id;
          const abierto = !!expanded[pid];
          const itemsState = itemsByPedido[pid];
          const items = Array.isArray(itemsState) ? itemsState : [];
          const tieneError = itemsState && itemsState._error;
          const cargandoItems = !!loadingItems[pid];

          return (
            <div className="mis-pedidos-card" key={pid}>
              <div className="mis-pedidos-card-header">
                <div className="mis-pedidos-card-info">
                  <div className="mis-pedidos-card-title-row">
                    <h2 className="mis-pedidos-card-title">Pedido #{pid}</h2>
                    <EstadoBadge estado={p.estado} />
                  </div>
                  <div className="mis-pedidos-card-meta">
                    {p.created_at && (
                      <span className="mis-pedidos-meta-item">
                        <i className="fas fa-calendar-alt"></i>
                        {fmtFecha(p.created_at)}
                      </span>
                    )}
                    <span className="mis-pedidos-meta-item mis-pedidos-total">
                      <i className="fas fa-dollar-sign"></i>
                      <strong>{fmtMoney(p.total)}</strong>
                    </span>
                  </div>
                </div>
                <button
                  className="mis-pedidos-toggle-btn"
                  onClick={() => toggleExpand(p)}
                  aria-expanded={abierto}
                >
                  <i className={`fas ${abierto ? "fa-chevron-up" : "fa-chevron-down"}`}></i>
                  {abierto ? "Ocultar productos" : "Ver productos"}
                </button>
              </div>

              {abierto && (
                <div className="mis-pedidos-card-body">
                  {cargandoItems && (
                    <div className="mis-pedidos-loading">
                      <i className="fas fa-spinner fa-spin"></i>
                      Cargando productos del pedido…
                    </div>
                  )}

                  {tieneError && (
                    <div className="mis-pedidos-error">
                      <i className="fas fa-exclamation-triangle"></i>
                      {itemsState._error}
                    </div>
                  )}

                  {!cargandoItems && !tieneError && (
                    <>
                      {!items.length ? (
                        <div className="text-muted small">Sin productos para mostrar.</div>
                      ) : (
                        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3">
                          {items.map((it, idx) => {
                            const nombre = it.nombre ?? "Producto";
                            const urlImg = it.imagen || PLACEHOLDER;
                            const precio = it.precio ?? it.subtotal ?? null;
                            const cantidad = it.cantidad ?? 1;
                            const talla = it.talla ? ` · Talla: ${it.talla}` : "";

                            return (
                              <div className="col" key={idx}>
                                <div className="card h-100">
                                  <img
                                    src={urlImg}
                                    className="card-img-top"
                                    alt={nombre}
                                    onError={(e) => {
                                      e.currentTarget.onerror = null;
                                      e.currentTarget.src = PLACEHOLDER;
                                    }}
                                  />
                                  <div className="card-body">
                                    <h6 className="card-title mb-1">{nombre}</h6>
                                    <div className="small text-muted">
                                      {cantidad > 1 ? `Cantidad: ${cantidad} · ` : ""}
                                      Precio: ${fmtMoney(precio)}
                                      {talla}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Controles de paginación */}
      <nav className="mis-pedidos-pagination">
        <button
          className={`mis-pedidos-page-btn ${safePage === 1 ? "disabled" : ""}`}
          onClick={() => changePage(safePage - 1)}
          disabled={safePage === 1}
        >
          <i className="fas fa-chevron-left"></i>
          Anterior
        </button>

        <div className="mis-pedidos-page-numbers">
          {Array.from({ length: totalPages }).map((_, i) => {
            const pnum = i + 1;
            return (
              <button
                key={pnum}
                className={`mis-pedidos-page-num ${pnum === safePage ? "active" : ""}`}
                onClick={() => changePage(pnum)}
              >
                {pnum}
              </button>
            );
          })}
        </div>

        <button
          className={`mis-pedidos-page-btn ${safePage === totalPages ? "disabled" : ""}`}
          onClick={() => changePage(safePage + 1)}
          disabled={safePage === totalPages}
        >
          Siguiente
          <i className="fas fa-chevron-right"></i>
        </button>
      </nav>
    </div>
  );
}

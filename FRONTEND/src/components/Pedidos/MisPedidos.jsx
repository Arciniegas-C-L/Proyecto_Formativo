import React, { useEffect, useMemo, useState } from "react";

import { listarPedidos } from "../../api/Pedido.api";
import { listarItemsDePedido } from "../../api/PedidoProducto.api.js";
import { Link } from "react-router-dom";

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
    <span className={`badge ${ok ? "bg-success" : "bg-secondary"}`} title={ok ? "Completado" : "Pendiente"}>
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
      <div className="container py-4">
        <h1 className="h4 mb-3">Mis pedidos</h1>
        <div className="alert alert-info">Cargando tus pedidos…</div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="container py-4">
        <h1 className="h4 mb-3">Mis pedidos</h1>
        <div className="alert alert-danger">{err}</div>
      </div>
    );
  }

  if (!ordered.length) {
    return (
      <div className="container py-4">
        <h1 className="h4 mb-3">Mis pedidos</h1>
        <div className="text-center p-5 bg-light rounded">
          <p className="mb-3">Aún no tienes pedidos.</p>
          <Link to="/catalogo" className="btn btn-primary">Ir al catálogo</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h1 className="h4 mb-3">Mis pedidos</h1>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="text-muted small">
          {ordered.length} {ordered.length === 1 ? "pedido" : "pedidos"}
        </div>
        <div className="text-muted small">
          Página {safePage} de {totalPages}
        </div>
      </div>

      <div className="vstack gap-3">
        {pageSlice.map((p) => {
          const pid = p.idPedido ?? p.id;
          const abierto = !!expanded[pid];
          const itemsState = itemsByPedido[pid];
          const items = Array.isArray(itemsState) ? itemsState : [];
          const tieneError = itemsState && itemsState._error;
          const cargandoItems = !!loadingItems[pid];

          return (
            <div className="card shadow-sm border-0" key={pid}>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="d-flex align-items-center gap-2">
                      <h2 className="h6 mb-0">Pedido #{pid}</h2>
                      <EstadoBadge estado={p.estado} />
                    </div>

                    <div className="text-muted small mt-1">
                      {p.created_at && <span className="me-3">Fecha: {fmtFecha(p.created_at)}</span>}
                      <span>Total: </span>
                      <strong>${fmtMoney(p.total)}</strong>
                    </div>
                  </div>

                  <button className="btn btn-sm btn-outline-primary" onClick={() => toggleExpand(p)}>
                    {abierto ? "Ocultar productos" : "Ver productos"}
                  </button>
                </div>

                {abierto && (
                  <div className="mt-3">
                    {cargandoItems && <div className="alert alert-info py-2">Cargando productos del pedido…</div>}
                    {tieneError && <div className="alert alert-warning py-2">{itemsState._error}</div>}

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
                                      onError={e => { e.target.onerror = null; e.target.src = PLACEHOLDER; }}
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
            </div>
          );
        })}
      </div>

      {/* Controles de paginación */}
      <nav className="mt-4 d-flex justify-content-center">
        <ul className="pagination mb-0">
          <li className={`page-item ${safePage === 1 ? "disabled" : ""}`}>
            <button className="page-link" onClick={() => changePage(safePage - 1)}>Anterior</button>
          </li>

          {Array.from({ length: totalPages }).map((_, i) => {
            const pnum = i + 1;
            return (
              <li key={pnum} className={`page-item ${pnum === safePage ? "active" : ""}`}>
                <button className="page-link" onClick={() => changePage(pnum)}>{pnum}</button>
              </li>
            );
          })}

          <li className={`page-item ${safePage === totalPages ? "disabled" : ""}`}>
            <button className="page-link" onClick={() => changePage(safePage + 1)}>Siguiente</button>
          </li>
        </ul>
      </nav>
    </div>
  );
}

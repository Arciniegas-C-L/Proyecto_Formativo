import React, { useEffect, useMemo, useState } from "react";
import { listarPedidos } from "../../api/Pedido.api";
import { listarItemsDePedido } from "../../api/PedidoProducto.api.js";
import { Link } from "react-router-dom";

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
      className={`badge ${ok ? "bg-success" : "bg-secondary"}`}
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
    // Caso A: PedidoItem (serializer anidado en Pedido)
    // fields esperados: producto (id), producto_nombre, talla_nombre, cantidad, precio, subtotal
    if ("producto_nombre" in it || "subtotal" in it || "precio" in it) {
      return {
        nombre: it.producto_nombre ?? "Producto",
        imagen:
          it.producto?.imagen ??
          it.imagen ??
          null, // intenta buscar imagen si vino un objeto producto
        cantidad: it.cantidad ?? 1,
        precio: it.precio ?? null,
        subtotal: it.subtotal ?? null,
        talla: it.talla_nombre ?? null,
      };
    }

    // Caso B: PedidoProducto (producto viene anidado)
    // fields esperados: { producto: { nombre, imagen, precio }, cantidad? }
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

  // estado por pedido: abierto/cerrado + cache de items
  const [expanded, setExpanded] = useState({});
  const [itemsByPedido, setItemsByPedido] = useState({});
  const [loadingItems, setLoadingItems] = useState({});

  const ordered = useMemo(() => {
    return [...pedidos].sort((a, b) => {
      const ai = a.idPedido ?? a.id ?? 0;
      const bi = b.idPedido ?? b.id ?? 0;
      return bi - ai;
    });
  }, [pedidos]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const { data } = await listarPedidos();
        const rows = Array.isArray(data) ? data : data?.results ?? [];
        setPedidos(rows);
      } catch (e) {
        console.error("Error listando pedidos:", e);
        setErr("No se pudieron cargar tus pedidos.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const resolveImg = (src) => {
    if (!src) return "https://via.placeholder.com/300x200?text=Producto";
    if (src.startsWith("http")) return src;
    const base = import.meta.env.VITE_BACK_URL || "http://127.0.0.1:8000";
    return `${base}${src}`;
  };

  const toggleExpand = async (pedido) => {
    const pid = pedido.idPedido ?? pedido.id;
    const next = !expanded[pid];
    setExpanded((s) => ({ ...s, [pid]: next }));

    if (!next) return;

    // 1) Si ya tenemos items cacheados, no hacemos nada
    if (Array.isArray(itemsByPedido[pid])) return;

    // 2) Si el pedido ya trae items anidados, úsalo y cachea
    if (Array.isArray(pedido.items) && pedido.items.length >= 0) {
      const norm = normalizeItems(pedido.items);
      setItemsByPedido((s) => ({ ...s, [pid]: norm }));
      return;
    }

    // 3) Fallback: pedirlos al endpoint /pedidoproductos/?pedido=<id>
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
          <Link to="/catalogo" className="btn btn-primary">
            Ir al catálogo
          </Link>
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
      </div>

      <div className="vstack gap-3">
        {ordered.map((p) => {
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
                      {p.created_at && (
                        <span className="me-3">Fecha: {fmtFecha(p.created_at)}</span>
                      )}
                      <span>Total: </span>
                      <strong>${fmtMoney(p.total)}</strong>
                    </div>
                  </div>

                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => toggleExpand(p)}
                  >
                    {abierto ? "Ocultar productos" : "Ver productos"}
                  </button>
                </div>

                {abierto && (
                  <div className="mt-3">
                    {cargandoItems && (
                      <div className="alert alert-info py-2">
                        Cargando productos del pedido…
                      </div>
                    )}

                    {tieneError && (
                      <div className="alert alert-warning py-2">
                        {itemsState._error}
                      </div>
                    )}

                    {!cargandoItems && !tieneError && (
                      <>
                        {!items.length ? (
                          <div className="text-muted small">
                            Sin productos para mostrar.
                          </div>
                        ) : (
                          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3">
                            {items.map((it, idx) => {
                              const nombre = it.nombre ?? "Producto";
                              const urlImg = resolveImg(it.imagen);
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
                                        e.currentTarget.src =
                                          "https://via.placeholder.com/300x200?text=Producto";
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
            </div>
          );
        })}
      </div>
    </div>
  );
}

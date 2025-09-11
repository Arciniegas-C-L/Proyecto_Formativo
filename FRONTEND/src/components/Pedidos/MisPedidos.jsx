import React, { useEffect, useMemo, useState } from "react";
import { listarPedidos } from "../../api/Pedido.api";
import { listarItemsDePedido } from "../../api/PedidoProducto.api.js";
import { Link } from "react-router-dom";

function fmtMoney(value, locale = "es-CO") {
  const n = typeof value === "number" ? value : parseFloat(value ?? 0);
  if (Number.isNaN(n)) return "—";
  return n.toLocaleString(locale, { maximumFractionDigits: 0 });
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

export function MisPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // estado por pedido: abierto/cerrado + carga de items
  const [expanded, setExpanded] = useState({});
  const [itemsByPedido, setItemsByPedido] = useState({});
  const [loadingItems, setLoadingItems] = useState({});

  const ordered = useMemo(() => {
    // intenta ordenar por id descendente si existe idPedido
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
        // si tu backend soporta ordering, podrías pasar { ordering: "-idPedido" }
        const { data } = await listarPedidos();
        setPedidos(Array.isArray(data) ? data : data?.results ?? []);
      } catch (e) {
        console.error("Error listando pedidos:", e);
        setErr("No se pudieron cargar tus pedidos.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleExpand = async (pedido) => {
    const key = pedido.idPedido ?? pedido.id;
    const next = !expanded[key];
    setExpanded((s) => ({ ...s, [key]: next }));

    if (next && !itemsByPedido[key]) {
      try {
        setLoadingItems((s) => ({ ...s, [key]: true }));
        const { data } = await listarItemsDePedido(key);
        // El serializer de PedidoProducto que mostraste devuelve { pedido, producto }
        const rows = Array.isArray(data) ? data : data?.results ?? [];
        setItemsByPedido((s) => ({ ...s, [key]: rows }));
      } catch (e) {
        console.error("Error listando items del pedido:", e);
        setItemsByPedido((s) => ({ ...s, [key]: { _error: "No se pudieron cargar los productos." } }));
      } finally {
        setLoadingItems((s) => ({ ...s, [key]: false }));
      }
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
                      {/* Si tienes fecha en tu modelo/serializer, muéstrala aquí */}
                      {/* <span className="me-2">Fecha: {formatFecha(p.fecha)}</span> */}
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
                          <div className="text-muted small">Sin productos (¿serializer sin items?).</div>
                        ) : (
                          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3">
                            {items.map((it, idx) => {
                              const prod = it.producto ?? {};
                              const nombre = prod.nombre ?? "Producto";
                              const urlImg = prod.imagen?.startsWith("http")
                                ? prod.imagen
                                : prod.imagen
                                  ? `${import.meta.env.VITE_BACK_URL || "http://127.0.0.1:8000"}${prod.imagen}`
                                  : "https://via.placeholder.com/300x200?text=Producto";
                              const precio = prod.precio ?? it.precio ?? null;
                              // Si tu modelo de PedidoProducto tuviera cantidad, úsala aquí:
                              const cantidad = it.cantidad ?? 1;

                              return (
                                <div className="col" key={idx}>
                                  <div className="card h-100">
                                    <img
                                      src={urlImg}
                                      className="card-img-top"
                                      alt={nombre}
                                      onError={(e) => {
                                        e.currentTarget.src = "https://via.placeholder.com/300x200?text=Producto";
                                      }}
                                    />
                                    <div className="card-body">
                                      <h6 className="card-title mb-1">{nombre}</h6>
                                      <div className="small text-muted">
                                        {cantidad > 1 ? `Cantidad: ${cantidad} · ` : ""}
                                        Precio: ${fmtMoney(precio)}
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

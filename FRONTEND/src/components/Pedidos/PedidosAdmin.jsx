// src/components/admin/PedidosAdmin.jsx
import React, { useEffect, useMemo, useState } from "react";
import { listarPedidos } from "../../api/Pedido.api"; // 👈 ya apunta a 'pedido/'
import { Toaster } from "react-hot-toast";
import "bootstrap/dist/css/bootstrap.min.css";

function formatCurrencyCOP(value) {
  if (value == null) return "—";
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return String(value);
  return n.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

function formatDate(dt) {
  if (!dt) return "—";
  try {
    const d = new Date(dt);
    return d.toLocaleString("es-CO", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit"
    });
  } catch {
    return dt;
  }
}

export function PedidosAdmin() {
  const [loading, setLoading] = useState(false);
  const [pedidos, setPedidos] = useState([]);

  // filtros
  const [numero, setNumero] = useState("");
  const [fechaMin, setFechaMin] = useState(""); // yyyy-mm-dd
  const [fechaMax, setFechaMax] = useState(""); // yyyy-mm-dd
  const [estado, setEstado] = useState("");     // "", "true", "false"

  // UI
  const [expanded, setExpanded] = useState({}); // { [idPedido]: boolean }

  // paginación simple client-side (puedes migrar a server-side luego)
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const fetchPedidos = async () => {
    setLoading(true);
    try {
      const params = {};
      if (numero?.trim()) params.numero = numero.trim();
      if (fechaMin) params.fecha_min = fechaMin;
      if (fechaMax) params.fecha_max = fechaMax;
      if (estado !== "") params.estado = estado; // "true" | "false"

      const res = await listarPedidos(params);
      setPedidos(res.data || []);
      setPage(1);
    } catch (err) {
      console.error("Error listando pedidos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPedidos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    // Si el backend ya filtra por querystring, esto sería redundante.
    // Lo dejamos como “doble filtro” por si quieres usarlo sin recargar.
    return pedidos.filter(p => {
      let ok = true;
      if (numero?.trim()) ok = ok && (p.numero?.toLowerCase()?.includes(numero.trim().toLowerCase()) || String(p.idPedido).includes(numero.trim()));
      if (estado !== "") ok = ok && String(p.estado) === estado;
      if (fechaMin) ok = ok && new Date(p.created_at) >= new Date(fechaMin + "T00:00:00");
      if (fechaMax) ok = ok && new Date(p.created_at) <= new Date(fechaMax + "T23:59:59");
      return ok;
    });
  }, [pedidos, numero, fechaMin, fechaMax, estado]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

  const toggleExpand = (idPedido) => {
    setExpanded(prev => ({ ...prev, [idPedido]: !prev[idPedido] }));
  };

  return (
    <div className="container py-3">
      <Toaster />
      <div className="d-flex align-items-end justify-content-between flex-wrap gap-2 mb-3">
        <h3 className="m-0">Pedidos (Admin)</h3>
        <button className="btn btn-outline-secondary" onClick={fetchPedidos} disabled={loading}>
          {loading ? "Actualizando..." : "Actualizar"}
        </button>
      </div>

      {/* Filtros */}
      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-2">
            <div className="col-12 col-md-3">
              <label className="form-label">Número / ID</label>
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por número o ID"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
              />
            </div>
            <div className="col-6 col-md-2">
              <label className="form-label">Desde</label>
              <input
                type="date"
                className="form-control"
                value={fechaMin}
                onChange={(e) => setFechaMin(e.target.value)}
              />
            </div>
            <div className="col-6 col-md-2">
              <label className="form-label">Hasta</label>
              <input
                type="date"
                className="form-control"
                value={fechaMax}
                onChange={(e) => setFechaMax(e.target.value)}
              />
            </div>
            <div className="col-6 col-md-2">
              <label className="form-label">Estado</label>
              <select
                className="form-select"
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
              </select>
            </div>
            <div className="col-6 col-md-3 d-flex align-items-end">
              <button className="btn btn-primary w-100" onClick={fetchPedidos} disabled={loading}>
                Buscar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de pedidos */}
      <div className="table-responsive">
        <table className="table table-hover align-middle">
          <thead className="table-light">
              <tr>
                <th>Nuemro</th>
                <th>Fecha</th>
                <th>Usuario (email)</th>
                <th>Total</th>
                <th>Estado</th>
                <th style={{ width: 120 }}>Acciones</th>
              </tr>
          </thead>
         <tbody>
            {pageData.map((p) => (
              <React.Fragment key={p.idPedido}>
                {/* FILA PRINCIPAL: 7 celdas */}
                <tr>
                  <td>{p.idPedido}</td>
                  <td title={p.created_at}>{formatDate(p.created_at)}</td>
                  <td className="text-truncate" style={{maxWidth: 240}}>
                    {(p.usuario_email ?? "").trim() || "—"}
                  </td>
                  <td>{formatCurrencyCOP(p.total)}</td>
                  <td>
                    <span className={`badge ${p.estado ? "bg-success" : "bg-secondary"}`}>
                      {p.estado ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => toggleExpand(p.idPedido)}
                    >
                      {expanded[p.idPedido] ? "Ocultar" : "Ver productos"}
                    </button>
                  </td>
                </tr>

                {/* FILA EXPANDIDA: colSpan = 7 */}
                {expanded[p.idPedido] && (
                  <tr>
                    <td colSpan={7} className="bg-light">
                      <div className="p-2">
                        <strong>Productos del pedido</strong>
                        <div className="table-responsive mt-2">
                          <table className="table table-sm">
                            <thead>
                              <tr>
                                <th>Producto</th>
                                <th>Talla</th>
                                <th className="text-center">Cant.</th>
                                <th className="text-end">Precio</th>
                                <th className="text-end">Subtotal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(Array.isArray(p.items) ? p.items : []).map((it) => (
                                <tr key={it.id}>
                                  <td>{it.producto_nombre || it.producto_data?.nombre || it.producto}</td>
                                  <td>{it.talla_nombre || "—"}</td>
                                  <td className="text-center">{it.cantidad}</td>
                                  <td className="text-end">{formatCurrencyCOP(it.precio)}</td>
                                  <td className="text-end">{formatCurrencyCOP(it.subtotal)}</td>
                                </tr>
                              ))}
                              {(!p.items || !p.items.length) && (
                                <tr>
                                  <td colSpan={5} className="text-center text-muted">Sin productos</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}

            {/* ESTADO VACÍO: colSpan = 7 */}
            {pageData.length === 0 && !loading && (
              <tr>
                <td colSpan={7} className="text-center text-muted py-4">
                  No hay pedidos para mostrar
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación simple */}
      <div className="d-flex justify-content-between align-items-center">
        <small className="text-muted">
          {filtered.length} resultado(s) — página {page} de {totalPages}
        </small>
        <div className="btn-group">
          <button className="btn btn-outline-secondary" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
            « Anterior
          </button>
          <button className="btn btn-outline-secondary" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
            Siguiente »
          </button>
        </div>
      </div>
    </div>
  );
}

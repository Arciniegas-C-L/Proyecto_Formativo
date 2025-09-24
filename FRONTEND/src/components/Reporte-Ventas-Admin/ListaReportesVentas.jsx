// src/components/admin/ListaReportesVentas.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  getReporteVentas,
  listarItemsReporteVentas,
  ORDERING,
} from "../../api/ReporteVentasRango.api";

function fmtCOP(v) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(v ?? 0);
}

function toCSV(rows) {
  if (!rows?.length) return "";
  const headers = Object.keys(rows[0]);
  return [
    headers.join(","),
    ...rows.map((r) =>
      headers
        .map((h) => {
          const cell = r[h] ?? "";
          const s = typeof cell === "object" ? JSON.stringify(cell) : String(cell);
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(",")
    ),
  ].join("\n");
}

export function ListaReportesVentas({
  reportes = [],
  seleccionadoId = null,
  onSelect = () => {},
  onDelete = async () => {},
  loading = false,
}) {
  const handleDelete = async (id) => {
    const ok = window.confirm("¿Eliminar este reporte? Esta acción no se puede deshacer.");
    if (!ok) return;
    await onDelete(id);
  };

  // ───────── Modal de vista previa (Ver) ─────────
  const [show, setShow] = useState(false);
  const [previewId, setPreviewId] = useState(null);
  const [hdr, setHdr] = useState(null);          // KPIs
  const [rows, setRows] = useState([]);          // detalle
  const [ordering, setOrdering] = useState(ORDERING.MAS_VENDIDOS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [count, setCount] = useState(0);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [err, setErr] = useState("");

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(count / pageSize)),
    [count, pageSize]
  );

  const openPreview = (id) => {
    setPreviewId(id);
    setShow(true);
    setPage(1);
  };

  const closePreview = () => {
    setShow(false);
    setPreviewId(null);
    setHdr(null);
    setRows([]);
    setErr("");
  };

  // cargar header
  useEffect(() => {
    if (!show || !previewId) return;
    (async () => {
      try {
        const res = await getReporteVentas(previewId);
        setHdr(res.data);
      } catch (e) {
        setErr(e?.response?.data?.detail || "No se pudo cargar el reporte.");
      }
    })();
  }, [show, previewId]);

  // cargar detalle
  useEffect(() => {
    if (!show || !previewId) return;
    (async () => {
      setLoadingPreview(true);
      setErr("");
      try {
        const res = await listarItemsReporteVentas(previewId, {
          ordering,
          page,
          page_size: pageSize,
        });
        const paginated = Array.isArray(res.data?.results);
        const r = paginated ? res.data.results : res.data;
        setRows(r || []);
        setCount(paginated ? res.data.count : r?.length || 0);
      } catch (e) {
        setErr(e?.response?.data?.detail || "No se pudo cargar el detalle.");
        setRows([]);
        setCount(0);
      } finally {
        setLoadingPreview(false);
      }
    })();
  }, [show, previewId, ordering, page, pageSize]);

  const exportCSV = () => {
    const data = rows.map((p) => ({
      producto_id: p.producto?.id ?? p.producto_id,
      producto_nombre: p.producto?.nombre,
      cantidad: p.cantidad,
      ingresos: p.ingresos,
      tickets: p.tickets,
    }));
    const blob = new Blob([toCSV(data)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const label = hdr ? `${hdr.fecha_inicio}_a_${hdr.fecha_fin}` : `reporte_${previewId}`;
    a.download = `reporte_ventas_${label}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="table-responsive">
        <table className="table table-sm align-middle">
          <thead>
            <tr>
              <th style={{ width: 70 }}>ID</th>
              <th>Rango</th>
              <th>Generado</th>
              <th className="text-end">Ventas</th>
              <th className="text-end">Items</th>
              <th className="text-center" style={{ width: 220 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan="6" className="text-center text-muted py-4">Cargando…</td></tr>
            )}
            {!loading && reportes.length === 0 && (
              <tr><td colSpan="6" className="text-center text-muted py-4">No hay reportes.</td></tr>
            )}
            {!loading && reportes.map((r) => {
              const activo = r.id === seleccionadoId;
              return (
                <tr key={r.id} className={activo ? "table-primary" : ""}>
                  <td>#{r.id}</td>
                  <td>{r.fecha_inicio} &rarr; {r.fecha_fin}</td>
                  <td className="small text-muted">{new Date(r.generado_en).toLocaleString()}</td>
                  <td className="text-end">{fmtCOP(r.ventas_netas)}</td>
                  <td className="text-end">{r.items_totales ?? 0}</td>
                  <td className="text-center">
                    <div className="btn-group btn-group-sm">
                      <button
                        className={`btn ${activo ? "btn-secondary" : "btn-outline-secondary"}`}
                        title="Seleccionar en el admin"
                        onClick={() => onSelect(r.id)}
                      >
                        Seleccionar
                      </button>
                      <button
                        className="btn btn-primary"
                        title="Ver en grande"
                        onClick={() => openPreview(r.id)}
                      >
                        Ver
                      </button>
                      <button
                        className="btn btn-outline-danger"
                        title="Eliminar"
                        onClick={() => handleDelete(r.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal simple CSS (sin JS de Bootstrap) */}
      {show && (
        <>
          <div
            className="position-fixed top-0 start-0 w-100 h-100"
            style={{ background: "rgba(0,0,0,.4)", zIndex: 1050 }}
            onClick={closePreview}
          />
          <div
            className="position-fixed top-50 start-50 translate-middle w-100"
            style={{ maxWidth: 1100, zIndex: 1060 }}
            role="dialog"
            aria-modal="true"
          >
            <div className="card shadow-lg">
              <div className="card-header d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-0">Reporte #{previewId}</h5>
                  {hdr && (
                    <div className="small text-muted">
                      {hdr.fecha_inicio} &rarr; {hdr.fecha_fin} · Generado: {new Date(hdr.generado_en).toLocaleString()}
                    </div>
                  )}
                </div>
                <div className="btn-group">
                  <button className="btn btn-success btn-sm" onClick={exportCSV} disabled={!rows.length}>
                    Exportar CSV
                  </button>
                  <button className="btn btn-outline-secondary btn-sm" onClick={() => window.print()}>
                    Imprimir
                  </button>
                  <button className="btn btn-outline-dark btn-sm" onClick={closePreview}>
                    Cerrar
                  </button>
                </div>
              </div>

              <div className="card-body">
                {/* KPIs */}
                {hdr && (
                  <div className="row g-3 mb-3">
                    <div className="col-md-3">
                      <div className="card h-100 shadow-sm">
                        <div className="card-body">
                          <div className="small text-muted">Ventas netas</div>
                          <h3 className="mb-0">{fmtCOP(hdr.ventas_netas)}</h3>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="card h-100 shadow-sm">
                        <div className="card-body">
                          <div className="small text-muted">Items vendidos</div>
                          <h3 className="mb-0">{hdr.items_totales ?? 0}</h3>
                          <div className="small text-muted mt-2">Tickets: {hdr.tickets ?? 0}</div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="card h-100 shadow-sm">
                        <div className="card-body">
                          <div className="small text-muted">Top producto</div>
                          <div className="fw-semibold">{hdr.top?.producto?.nombre || "—"}</div>
                          <div className="small">Cantidad: {hdr.top?.cantidad ?? 0}</div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="card h-100 shadow-sm">
                        <div className="card-body">
                          <div className="small text-muted">Menos vendido</div>
                          <div className="fw-semibold">{hdr.bottom?.producto?.nombre || "—"}</div>
                          <div className="small">Cantidad: {hdr.bottom?.cantidad ?? 0}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Controles tabla */}
                <div className="row g-2 align-items-end mb-2">
                  <div className="col-sm-6 col-md-4">
                    <label className="form-label mb-1">Ordenar por</label>
                    <select
                      className="form-select"
                      value={ordering}
                      onChange={(e) => { setOrdering(e.target.value); setPage(1); }}
                    >
                      <option value={ORDERING.MAS_VENDIDOS}>Más vendidos</option>
                      <option value={ORDERING.MENOS_VENDIDOS}>Menos vendidos</option>
                      <option value={ORDERING.MAYOR_INGRESO}>Mayor ingreso</option>
                      <option value={ORDERING.MENOR_INGRESO}>Menor ingreso</option>
                      <option value={ORDERING.MAS_TICKETS}>Más tickets</option>
                      <option value={ORDERING.MENOS_TICKETS}>Menos tickets</option>
                    </select>
                  </div>
                  <div className="col-sm-6 col-md-3">
                    <label className="form-label mb-1">Filas por página</label>
                    <select
                      className="form-select"
                      value={pageSize}
                      onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                  <div className="col-md-5 text-md-end small text-muted">
                    {loadingPreview ? "Cargando…" : `Total filas: ${count}`}
                  </div>
                </div>

                {/* Tabla detalle */}
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>ID</th>
                        <th>Producto</th>
                        <th className="text-end">Cantidad</th>
                        <th className="text-end">Ingresos</th>
                        <th className="text-end">Tickets</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((p) => (
                        <tr key={`${p.producto?.id ?? p.producto_id}-${p.cantidad}-${p.ingresos}`}>
                          <td>{p.producto?.id ?? p.producto_id}</td>
                          <td>{p.producto?.nombre ?? "—"}</td>
                          <td className="text-end">{p.cantidad}</td>
                          <td className="text-end">{fmtCOP(p.ingresos)}</td>
                          <td className="text-end">{p.tickets}</td>
                        </tr>
                      ))}
                      {!rows.length && (
                        <tr>
                          <td colSpan="5" className="text-center text-muted py-4">
                            {loadingPreview ? "Cargando..." : "Sin datos."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Paginación */}
                <div className="d-flex justify-content-between align-items-center">
                  <span className="small">Página {page} de {totalPages}</span>
                  <div className="btn-group">
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                    >
                      « Anterior
                    </button>
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                    >
                      Siguiente »
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

// src/components/admin/ListaReportesVentas.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  getReporteVentas,
  listarItemsReporteVentas,
  ORDERING,
} from "../../api/ReporteVentasRango.api";
import "../../assets/css/Reporte-Ventas-Admin/ListaReporteVentas.css";

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
        <table className="table lista-table-dark m-0">
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
              <tr>
                <td colSpan="6" className="text-center lista-no-data py-4">
                  Cargando…
                </td>
              </tr>
            )}
            {!loading && reportes.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center lista-no-data py-4">
                  No hay reportes.
                </td>
              </tr>
            )}
            {!loading && reportes.map((r) => {
              const activo = r.id === seleccionadoId;
              return (
                <tr key={r.id} className={activo ? "lista-table-primary" : ""}>
                  <td>#{r.id}</td>
                  <td>{r.fecha_inicio} → {r.fecha_fin}</td>
                  <td className="small lista-text-muted">
                    {new Date(r.generado_en).toLocaleString()}
                  </td>
                  <td className="text-end">{fmtCOP(r.ventas_netas)}</td>
                  <td className="text-end">{r.items_totales ?? 0}</td>
                  <td className="text-center">
                    <div className="btn-group btn-group-sm lista-btn-group">
                      <button
                        className={`btn lista-btn-select ${activo ? "active" : ""}`}
                        title="Seleccionar en el admin"
                        onClick={() => onSelect(r.id)}
                      >
                        Seleccionar
                      </button>
                      <button
                        className="btn lista-btn-view"
                        title="Ver en grande"
                        onClick={() => openPreview(r.id)}
                      >
                        Ver
                      </button>
                      <button
                        className="btn lista-btn-delete"
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

      {/* Modal personalizado */}
      {show && (
        <>
          <div className="lista-modal-overlay" onClick={closePreview} />
          <div className="lista-modal-content" role="dialog" aria-modal="true">
            <div className="lista-glass-modal">
              <div className="lista-modal-header">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center">
                  <div className="mb-2 mb-md-0">
                    <h5 className="mb-1 lista-modal-title">
                      Reporte #{previewId}
                    </h5>
                    {hdr && (
                      <div className="small lista-modal-subtitle">
                        {hdr.fecha_inicio} → {hdr.fecha_fin} · Generado: {new Date(hdr.generado_en).toLocaleString()}
                      </div>
                    )}
                  </div>
                  <div className="btn-group">
                    <button className="btn lista-btn-export" onClick={exportCSV} disabled={!rows.length}>
                      Exportar CSV
                    </button>
                    <button className="btn lista-btn-print" onClick={() => window.print()}>
                      Imprimir
                    </button>
                    <button className="btn lista-btn-close" onClick={closePreview}>
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 lista-modal-body">
                {/* KPIs */}
                {hdr && (
                  <div className="row g-4 mb-4">
                    <div className="col-xl-3 col-lg-6">
                      <div className="lista-kpi-card">
                        <div className="lista-kpi-label">
                          Ventas netas
                        </div>
                        <h3 className="mb-0 lista-kpi-value">{fmtCOP(hdr.ventas_netas)}</h3>
                      </div>
                    </div>
                    <div className="col-xl-3 col-lg-6">
                      <div className="lista-kpi-card">
                        <div className="lista-kpi-label">
                          Items vendidos
                        </div>
                        <h3 className="mb-0 lista-kpi-value">{hdr.items_totales ?? 0}</h3>
                        <div className="lista-kpi-subtitle">
                          Tickets: {hdr.tickets ?? 0}
                        </div>
                      </div>
                    </div>
                    <div className="col-xl-3 col-lg-6">
                      <div className="lista-kpi-card">
                        <div className="lista-kpi-label">
                          Top producto
                        </div>
                        <div className="lista-kpi-product-name">{hdr.top?.producto?.nombre || "—"}</div>
                        <div className="lista-kpi-subtitle">Cantidad: {hdr.top?.cantidad ?? 0}</div>
                      </div>
                    </div>
                    <div className="col-xl-3 col-lg-6">
                      <div className="lista-kpi-card">
                        <div className="lista-kpi-label">
                          Menos vendido
                        </div>
                        <div className="lista-kpi-product-name">{hdr.bottom?.producto?.nombre || "—"}</div>
                        <div className="lista-kpi-subtitle">Cantidad: {hdr.bottom?.cantidad ?? 0}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Controles tabla */}
                <div className="row g-3 mb-3">
                  <div className="col-md-4">
                    <label className="lista-form-label">
                      Ordenar por
                    </label>
                    <select
                      className="form-select lista-form-control"
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
                  <div className="col-md-3">
                    <label className="lista-form-label">
                      Filas por página
                    </label>
                    <select
                      className="form-select lista-form-control"
                      value={pageSize}
                      onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                  <div className="col-md-5 d-flex align-items-end">
                    <div className="small lista-text-muted">
                      {loadingPreview ? "Cargando…" : `Total filas: ${count}`}
                    </div>
                  </div>
                </div>

                {err && (
                  <div className="alert lista-alert-danger mb-3">
                    {err}
                  </div>
                )}

                {/* Tabla detalle */}
                <div className="table-responsive mb-3">
                  <table className="table lista-table-dark m-0">
                    <thead>
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
                          <td colSpan="5" className="text-center lista-no-data py-4">
                            {loadingPreview ? "Cargando..." : "Sin datos."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Paginación */}
                <div className="lista-pagination">
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-center">
                    <span className="small mb-2 mb-md-0">Página {page} de {totalPages}</span>
                    <div className="btn-group">
                      <button
                        className="btn lista-btn-pagination"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                      >
                        « Anterior
                      </button>
                      <button
                        className="btn lista-btn-pagination"
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
          </div>
        </>
      )}
    </>
  );
}
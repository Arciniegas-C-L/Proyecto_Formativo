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
  const [hdr, setHdr] = useState(null);
  const [rows, setRows] = useState([]);
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
      {/* Tabla principal responsive */}
      <div className="table-responsive">
        <table className="table lista-table-dark mb-0">
          <thead>
            <tr>
              <th style={{ width: "80px" }} className="text-center">ID</th>
              <th className="d-none d-md-table-cell">Rango de Fechas</th>
              <th className="d-md-none">Rango</th>
              <th className="d-none d-lg-table-cell">Fecha Generado</th>
              <th className="text-end">Ventas</th>
              <th className="text-end d-none d-sm-table-cell">Items</th>
              <th className="text-center" style={{ width: "200px" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan="6" className="text-center lista-no-data py-4">
                  Cargando reportes...
                </td>
              </tr>
            )}
            {!loading && reportes.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center lista-no-data py-5">
                  No hay reportes disponibles.
                </td>
              </tr>
            )}
            {!loading && reportes.map((r) => {
              const activo = r.id === seleccionadoId;
              return (
                <tr key={r.id} className={activo ? "lista-table-primary" : ""}>
                  <td className="text-center">
                    <span className="badge bg-secondary">#{r.id}</span>
                  </td>
                  <td className="d-none d-md-table-cell">
                    <div className="fw-medium">{r.fecha_inicio}</div>
                    <div className="small lista-text-muted">hasta {r.fecha_fin}</div>
                  </td>
                  <td className="d-md-none">
                    <div className="small">{r.fecha_inicio}</div>
                    <div className="small">→ {r.fecha_fin}</div>
                  </td>
                  <td className="small lista-text-muted d-none d-lg-table-cell">
                    {new Date(r.generado_en).toLocaleString('es-CO', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="text-end fw-bold">
                    {fmtCOP(r.ventas_netas)}
                  </td>
                  <td className="text-end d-none d-sm-table-cell">
                    <span className="badge bg-info">{r.items_totales ?? 0}</span>
                  </td>
                  <td className="text-center">
                    <div className="lista-btn-group">
                      <button
                        className={`btn btn-sm lista-btn-select ${activo ? "active" : ""}`}
                        title="Seleccionar para usar en el admin"
                        onClick={() => onSelect(r.id)}
                      >
                        <span className="d-none d-lg-inline">Seleccionar</span>
                        <span className="d-lg-none">Sel.</span>
                      </button>
                      <button
                        className="btn btn-sm lista-btn-view"
                        title="Ver detalles del reporte"
                        onClick={() => openPreview(r.id)}
                      >
                        <span className="d-none d-lg-inline">Ver</span>
                      </button>
                      <button
                        className="btn btn-sm lista-btn-delete"
                        title="Eliminar reporte"
                        onClick={() => handleDelete(r.id)}
                      >
                        <span className="d-none d-lg-inline">Eliminar</span>
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
          <div className="lista-modal-content" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className="lista-glass-modal">
              {/* Header del modal */}
              <div className="lista-modal-header">
                <div className="row align-items-center">
                  <div className="col-lg-8">
                    <h4 id="modal-title" className="lista-modal-title mb-1">
                      Reporte de Ventas #{previewId}
                    </h4>
                    {hdr && (
                      <div className="lista-modal-subtitle">
                        {hdr.fecha_inicio} → {hdr.fecha_fin} • 
                        Generado: {new Date(hdr.generado_en).toLocaleString('es-CO')}
                      </div>
                    )}
                  </div>
                  <div className="col-lg-4">
                    <div className="btn-group w-100" role="group">
                      <button 
                        className="btn lista-btn-export" 
                        onClick={exportCSV} 
                        disabled={!rows.length}
                        title="Exportar datos a CSV"
                      >
                        <i className="fas fa-download me-1"></i>
                        <span className="d-none d-md-inline">Exportar</span>
                        CSV
                      </button>
                      <button 
                        className="btn lista-btn-print" 
                        onClick={() => window.print()}
                        title="Imprimir reporte"
                      >
                        <i className="fas fa-print me-1"></i>
                        <span className="d-none d-md-inline">Imprimir</span>
                      </button>
                      <button 
                        className="btn lista-btn-close" 
                        onClick={closePreview}
                        title="Cerrar modal"
                      >
                        <i className="fas fa-times me-1"></i>
                        <span className="d-none d-md-inline">Cerrar</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lista-modal-body p-4">
                {/* KPI Cards */}
                {hdr && (
                  <div className="row g-3 g-lg-4 mb-4">
                    <div className="col-6 col-lg-3">
                      <div className="lista-kpi-card">
                        <div className="lista-kpi-label">
                          <i className="fas fa-dollar-sign me-1"></i>
                          Ventas Netas
                        </div>
                        <h3 className="lista-kpi-value">{fmtCOP(hdr.ventas_netas)}</h3>
                      </div>
                    </div>
                    <div className="col-6 col-lg-3">
                      <div className="lista-kpi-card">
                        <div className="lista-kpi-label">
                          <i className="fas fa-box me-1"></i>
                          Items Vendidos
                        </div>
                        <h3 className="lista-kpi-value">{hdr.items_totales ?? 0}</h3>
                        <div className="lista-kpi-subtitle">
                          <i className="fas fa-receipt me-1"></i>
                          Tickets: {hdr.tickets ?? 0}
                        </div>
                      </div>
                    </div>
                    <div className="col-6 col-lg-3">
                      <div className="lista-kpi-card">
                        <div className="lista-kpi-label">
                          <i className="fas fa-trophy me-1"></i>
                          Top Producto
                        </div>
                        <div className="lista-kpi-product-name">
                          {hdr.top?.producto?.nombre || "—"}
                        </div>
                        <div className="lista-kpi-subtitle">
                          Cantidad: {hdr.top?.cantidad ?? 0}
                        </div>
                      </div>
                    </div>
                    <div className="col-6 col-lg-3">
                      <div className="lista-kpi-card">
                        <div className="lista-kpi-label">
                          <i className="fas fa-chart-line-down me-1"></i>
                          Menos Vendido
                        </div>
                        <div className="lista-kpi-product-name">
                          {hdr.bottom?.producto?.nombre || "—"}
                        </div>
                        <div className="lista-kpi-subtitle">
                          Cantidad: {hdr.bottom?.cantidad ?? 0}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Controles de tabla */}
                <div className="row g-3 mb-4">
                  <div className="col-md-4">
                    <label className="lista-form-label">
                      <i className="fas fa-sort me-1"></i>
                      Ordenar por
                    </label>
                    <select
                      className="form-select lista-form-control"
                      value={ordering}
                      onChange={(e) => { setOrdering(e.target.value); setPage(1); }}
                    >
                      <option value={ORDERING.MAS_VENDIDOS}> Más vendidos</option>
                      <option value={ORDERING.MENOS_VENDIDOS}> Menos vendidos</option>
                      <option value={ORDERING.MAYOR_INGRESO}> Mayor ingreso</option>
                      <option value={ORDERING.MENOR_INGRESO}> Menor ingreso</option>
                      <option value={ORDERING.MAS_TICKETS}> Más tickets</option>
                      <option value={ORDERING.MENOS_TICKETS}> Menos tickets</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="lista-form-label">
                      <i className="fas fa-list me-1"></i>
                      Filas por página
                    </label>
                    <select
                      className="form-select lista-form-control"
                      value={pageSize}
                      onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                    >
                      <option value={10}>10 filas</option>
                      <option value={20}>20 filas</option>
                      <option value={50}>50 filas</option>
                    </select>
                  </div>
                  <div className="col-md-5 d-flex align-items-end">
                    <div className="small lista-text-muted">
                      {loadingPreview ? (
                        <>
                          <div className="spinner-border spinner-border-sm me-2" role="status">
                            <span className="visually-hidden">Cargando...</span>
                          </div>
                          Cargando datos...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-database me-1"></i>
                          Total de registros: <strong>{count}</strong>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Alert de error */}
                {err && (
                  <div className="alert lista-alert-danger mb-4" role="alert">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    <strong>Error:</strong> {err}
                  </div>
                )}

                {/* Tabla de detalle */}
                <div className="table-responsive mb-4">
                  <table className="table lista-table-dark mb-0">
                    <thead>
                      <tr>
                        <th style={{ width: "80px" }} className="text-center">
                          <i className="fas fa-hashtag me-1"></i>ID
                        </th>
                        <th>
                          <i className="fas fa-tag me-1"></i>Producto
                        </th>
                        <th className="text-end">
                          <i className="fas fa-boxes me-1"></i>Cantidad
                        </th>
                        <th className="text-end">
                          <i className="fas fa-dollar-sign me-1"></i>Ingresos
                        </th>
                        <th className="text-end">
                          <i className="fas fa-receipt me-1"></i>Tickets
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((p, index) => (
                        <tr key={`${p.producto?.id ?? p.producto_id}-${p.cantidad}-${p.ingresos}-${index}`}>
                          <td className="text-center">
                            <span className="badge bg-secondary">
                              {p.producto?.id ?? p.producto_id}
                            </span>
                          </td>
                          <td>
                            <div className="fw-medium">
                              {p.producto?.nombre ?? "Sin nombre"}
                            </div>
                          </td>
                          <td className="text-end">
                            <span className="badge bg-primary fs-6">
                              {p.cantidad}
                            </span>
                          </td>
                          <td className="text-end fw-bold">
                            {fmtCOP(p.ingresos)}
                          </td>
                          <td className="text-end">
                            <span className="badge bg-info">
                              {p.tickets}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {!rows.length && (
                        <tr>
                          <td colSpan="5" className="text-center lista-no-data py-5">
                            {loadingPreview ? (
                              <>
                                <div className="spinner-border text-primary mb-2" role="status">
                                  <span className="visually-hidden">Cargando...</span>
                                </div>
                                <div>Cargando datos del reporte...</div>
                              </>
                            ) : (
                              <>
                                <i className="fas fa-search fa-2x mb-2 d-block"></i>
                                Sin datos disponibles para mostrar.
                              </>
                            )}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Paginación */}
                <div className="lista-pagination">
                  <div className="row align-items-center">
                    <div className="col-md-6">
                      <span className="small text-muted">
                        <i className="fas fa-info-circle me-1"></i>
                        Mostrando página <strong>{page}</strong> de <strong>{totalPages}</strong>
                        {count > 0 && (
                          <> • {count} registro{count !== 1 ? 's' : ''} en total</>
                        )}
                      </span>
                    </div>
                    <div className="col-md-6">
                      <div className="btn-group float-md-end" role="group">
                        <button
                          className="btn lista-btn-pagination"
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page <= 1 || loadingPreview}
                          title="Página anterior"
                        >
                          <i className="fas fa-chevron-left me-1"></i>
                          Anterior
                        </button>
                        <button
                          className="btn lista-btn-pagination"
                          disabled
                          style={{ minWidth: '80px' }}
                        >
                          {page} / {totalPages}
                        </button>
                        <button
                          className="btn lista-btn-pagination"
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          disabled={page >= totalPages || loadingPreview}
                          title="Página siguiente"
                        >
                          Siguiente
                          <i className="fas fa-chevron-right ms-1"></i>
                        </button>
                      </div>
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
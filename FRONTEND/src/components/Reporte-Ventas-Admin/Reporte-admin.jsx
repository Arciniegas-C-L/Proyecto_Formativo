// src/components/admin/ReporteVentasRangoAdmin.jsx
import { useEffect, useMemo, useState } from "react";
import {
  generarReporteVentas,
  listarReportesVentas,
  getReporteVentas,
  listarItemsReporteVentas,
  eliminarReporteVentas,
  ORDERING,
} from "../../api/ReporteVentasRango.api";
import { api } from "../../api/axios";
import {ListaReportesVentas} from "./ListaReportesVentas"; // <- default import

// Utils de fecha
function todayStr() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
function firstDayOfMonthStr() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}-01`;
}

function toCSV(rows) {
  if (!rows?.length) return "";
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((r) =>
      headers
        .map((h) => {
          const cell = r[h] ?? "";
          const text = typeof cell === "object" ? JSON.stringify(cell) : String(cell);
          const needsQuotes = /[",\n]/.test(text);
          return needsQuotes ? `"${text.replace(/"/g, '""')}"` : text;
        })
        .join(",")
    ),
  ].join("\n");
  return csv;
}

export function ReporteVentasRangoAdmin() {
  // modo UI arriba (cuadrito)
  const [mode, setMode] = useState("generar"); // "generar" | "listar"

  // límites de calendario (opcional)
  const [limites, setLimites] = useState({ min: "", max: todayStr() });
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("reportes/ventas/rango/limites/");
        setLimites({
          min: res.data?.min_fecha || "2020-01-01",
          max: res.data?.max_fecha || todayStr(),
        });
      } catch {
        setLimites({ min: "2020-01-01", max: todayStr() });
      }
    })();
  }, []);

  // Filtros para generar
  const [desde, setDesde] = useState(firstDayOfMonthStr());
  const [hasta, setHasta] = useState(todayStr());
  const [soloAprobados, setSoloAprobados] = useState(false); // sandbox por defecto

  // Estado global
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  // Listado de reportes y selección
  const [reportes, setReportes] = useState([]);
  const [reporteId, setReporteId] = useState(null);
  const [reporte, setReporte] = useState(null); // KPIs

  // Detalle items
  const [ordering, setOrdering] = useState(ORDERING.MAS_VENDIDOS);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [count, setCount] = useState(0);

  // Carga lista de reportes (últimos)
  const loadReportes = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listarReportesVentas({ page: 1, page_size: 50 });
      const data = res.data?.results ?? res.data ?? [];
      setReportes(data);
      if (!reporteId && data.length) setReporteId(data[0].id);
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.detail || "Error cargando reportes.");
    } finally {
      setLoading(false);
    }
  };

  // Carga detalle KPIs del reporte seleccionado
  const loadReporteDetail = async (id) => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const res = await getReporteVentas(id);
      setReporte(res.data);
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.detail || "Error cargando el reporte.");
      setReporte(null);
    } finally {
      setLoading(false);
    }
  };

  // Carga items del reporte seleccionado con ordering/paginación
  const loadItems = async (id) => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const res = await listarItemsReporteVentas(id, { ordering, page, page_size: pageSize });
      const isPaginated = Array.isArray(res.data?.results);
      const rows = isPaginated ? res.data.results : res.data;
      setItems(rows || []);
      setCount(isPaginated ? res.data.count : rows?.length || 0);
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.detail || "Error cargando el detalle de productos.");
      setItems([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Generar reporte
  const onGenerar = async () => {
    setGenerating(true);
    setError("");
    try {
      const body = {
        desde: (desde || firstDayOfMonthStr()).trim(),
        hasta: (hasta || todayStr()).trim(),
        solo_aprobados: !!soloAprobados,
      };
      const res = await generarReporteVentas(body);
      await loadReportes();
      setReporteId(res.data?.id ?? null);
      await loadReporteDetail(res.data?.id);
      setPage(1);
      await loadItems(res.data?.id);
      setMode("generar"); // te quedas en generar viendo KPIs/tabla
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.detail || "No se pudo generar el reporte.");
    } finally {
      setGenerating(false);
    }
  };

  // Eliminar reporte
  const onDeleteReporte = async (id) => {
    setLoading(true);
    setError("");
    try {
      await eliminarReporteVentas(id);
      const res = await listarReportesVentas({ page: 1, page_size: 50 });
      const data = res.data?.results ?? res.data ?? [];
      setReportes(data);

      if (reporteId === id) {
        const nuevo = data[0]?.id ?? null;
        setReporteId(nuevo);
        if (nuevo) {
          await loadReporteDetail(nuevo);
          setPage(1);
          await loadItems(nuevo);
        } else {
          setReporte(null);
          setItems([]);
          setCount(0);
        }
      }
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.detail || "No se pudo eliminar el reporte.");
    } finally {
      setLoading(false);
    }
  };

  // CSV
  const exportCSV = () => {
    const rows = items.map((p) => ({
      producto_id: p.producto?.id ?? p.producto_id,
      producto_nombre: p.producto?.nombre,
      cantidad: p.cantidad,
      ingresos: p.ingresos,
      tickets: p.tickets,
    }));
    const csv = toCSV(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const label = reporte ? `${reporte.fecha_inicio}_a_${reporte.fecha_fin}` : `${desde}_a_${hasta}`;
    a.download = `reporte_ventas_${label}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // Efectos
  useEffect(() => {
    loadReportes();
    // eslint-disable-next-line
  }, []);
  useEffect(() => {
    if (reporteId) {
      loadReporteDetail(reporteId);
      setPage(1);
      loadItems(reporteId);
    }
    // eslint-disable-next-line
  }, [reporteId]);
  useEffect(() => {
    if (reporteId) loadItems(reporteId);
    // eslint-disable-next-line
  }, [ordering, page, pageSize]);

  // Paginación cliente si no viene del server
  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / pageSize)), [count, pageSize]);

  return (
    <div className="container py-3">
      <h2 className="mb-3">Reporte de Ventas por Rango</h2>

      {/* Cuadrito: Generar | Listar */}
      <div className="d-inline-flex mb-3 border rounded-pill overflow-hidden">
        <button
          className={`btn ${mode === "generar" ? "btn-primary" : "btn-light"} rounded-0`}
          onClick={() => setMode("generar")}
        >
          Generar
        </button>
        <button
          className={`btn ${mode === "listar" ? "btn-primary" : "btn-light"} rounded-0`}
          onClick={() => setMode("listar")}
        >
          Listar
        </button>
      </div>

      {/* ───────────────── GENERAR ───────────────── */}
      {mode === "generar" && (
        <>
          {/* Generar reporte */}
          <div className="card mb-3">
            <div className="card-body row g-3">
              <div className="col-md-3">
                <label className="form-label">Desde</label>
                <input
                  type="date"
                  className="form-control"
                  value={desde}
                  min={limites.min}
                  max={limites.max}
                  onChange={(e) => setDesde(e.target.value || limites.min)}
                />
              </div>

              <div className="col-md-3">
                <label className="form-label">Hasta</label>
                <input
                  type="date"
                  className="form-control"
                  value={hasta}
                  min={limites.min}
                  max={limites.max}
                  onChange={(e) => setHasta(e.target.value || todayStr())}
                />
                <div className="form-text">El backend normaliza a [desde, hasta)</div>
              </div>

              <div className="col-md-2 d-flex align-items-end">
                <div className="form-check">
                  <input
                    id="soloAprobados"
                    className="form-check-input"
                    type="checkbox"
                    checked={soloAprobados}
                    onChange={(e) => setSoloAprobados(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="soloAprobados">
                    Solo aprobados
                  </label>
                </div>
              </div>

              <div className="col-md-4 d-flex align-items-end gap-2">
                <button className="btn btn-primary" onClick={onGenerar} disabled={generating}>
                  {generating ? "Generando..." : "Generar reporte"}
                </button>
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    setDesde(firstDayOfMonthStr());
                    setHasta(todayStr());
                    setSoloAprobados(false);
                  }}
                  disabled={generating}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Selector rápido por <select> (conservado por si te sirve) */}
          <div className="card mb-3">
            <div className="card-body row g-3">
              <div className="col-md-6">
                <label className="form-label">Reportes generados</label>
                <select
                  className="form-select"
                  value={reporteId || ""}
                  onChange={(e) => setReporteId(Number(e.target.value) || null)}
                >
                  {!reportes.length && <option value="">— No hay reportes —</option>}
                  {reportes.map((r) => (
                    <option key={r.id} value={r.id}>
                      #{r.id} — {r.fecha_inicio} → {r.fecha_fin}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label">Ordenar detalle por</label>
                <div className="d-flex gap-2">
                  <select
                    className="form-select"
                    value={ordering}
                    onChange={(e) => {
                      setOrdering(e.target.value);
                      setPage(1);
                    }}
                  >
                    <option value={ORDERING.MAS_VENDIDOS}>Más vendidos</option>
                    <option value={ORDERING.MENOS_VENDIDOS}>Menos vendidos</option>
                    <option value={ORDERING.MAYOR_INGRESO}>Mayor ingreso</option>
                    <option value={ORDERING.MENOR_INGRESO}>Menor ingreso</option>
                    <option value={ORDERING.MAS_TICKETS}>Más tickets</option>
                    <option value={ORDERING.MENOS_TICKETS}>Menos tickets</option>
                  </select>

                  <button
                    className="btn btn-success"
                    onClick={exportCSV}
                    disabled={!items.length}
                    title="Exportar detalle a CSV"
                  >
                    Exportar CSV
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* KPIs */}
          {reporte && (
            <div className="row g-3 mb-3">
              <div className="col-md-3">
                <div className="card h-100">
                  <div className="card-body">
                    <div className="small text-muted">Ventas netas</div>
                    <h4 className="mb-0">
                      {new Intl.NumberFormat("es-CO", {
                        style: "currency",
                        currency: "COP",
                        maximumFractionDigits: 0,
                      }).format(reporte.ventas_netas ?? 0)}
                    </h4>
                    <div className="text-muted mt-2">
                      {reporte.fecha_inicio} → {reporte.fecha_fin}
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-3">
                <div className="card h-100">
                  <div className="card-body">
                    <div className="small text-muted">Items vendidos</div>
                    <h4 className="mb-0">{reporte.items_totales ?? 0}</h4>
                    <div className="small text-muted mt-2">Tickets: {reporte.tickets ?? 0}</div>
                  </div>
                </div>
              </div>

              <div className="col-md-3">
                <div className="card h-100">
                  <div className="card-body">
                    <div className="small text-muted">Top producto</div>
                    <h6 className="mb-1">{reporte.top?.producto?.nombre || "—"}</h6>
                    <div className="small">Cantidad: {reporte.top?.cantidad ?? 0}</div>
                  </div>
                </div>
              </div>

              <div className="col-md-3">
                <div className="card h-100">
                  <div className="card-body">
                    <div className="small text-muted">Menos vendido</div>
                    <h6 className="mb-1">{reporte.bottom?.producto?.nombre || "—"}</h6>
                    <div className="small">Cantidad: {reporte.bottom?.cantidad ?? 0}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Errores */}
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          {/* Tabla detalle */}
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <h5 className="mb-0">Detalle por producto</h5>
                <div className="d-flex align-items-center gap-2">
                  <label className="form-label mb-0 me-2 small">Filas por página</label>
                  <select
                    className="form-select"
                    style={{ width: 100 }}
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(1);
                    }}
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-sm align-middle">
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
                    {items.map((p) => (
                      <tr key={`${p.producto?.id ?? p.producto_id}-${p.cantidad}-${p.ingresos}`}>
                        <td>{p.producto?.id ?? p.producto_id}</td>
                        <td>{p.producto?.nombre ?? "—"}</td>
                        <td className="text-end">{p.cantidad}</td>
                        <td className="text-end">
                          {new Intl.NumberFormat("es-CO", {
                            style: "currency",
                            currency: "COP",
                            maximumFractionDigits: 0,
                          }).format(p.ingresos ?? 0)}
                        </td>
                        <td className="text-end">{p.tickets}</td>
                      </tr>
                    ))}
                    {!items.length && (
                      <tr>
                        <td colSpan="5" className="text-center text-muted py-4">
                          {loading ? "Cargando..." : "Sin datos para este reporte."}
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
        </>
      )}

      {/* ───────────────── LISTAR ───────────────── */}
      {mode === "listar" && (
        <div className="card">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h5 className="mb-0">Reportes generados</h5>
              <span className="badge bg-light text-dark">
                {reportes.length} reporte{reportes.length === 1 ? "" : "s"}
              </span>
            </div>
            <ListaReportesVentas
              reportes={reportes}
              seleccionadoId={reporteId}
              onSelect={(id) => {
                setReporteId(id);
                setMode("generar"); // al seleccionar, te lleva a la vista con KPIs/tabla
              }}
              onDelete={onDeleteReporte}
              loading={loading}
            />
          </div>
        </div>
      )}
    </div>
  );
}


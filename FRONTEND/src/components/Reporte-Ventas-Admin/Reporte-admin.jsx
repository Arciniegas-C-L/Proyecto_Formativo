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
import {ListaReportesVentas} from "./ListaReportesVentas";
import "../../assets/css/Reporte-Ventas-Admin/Reporte-admin.css";

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



// Componente de paginación funcional
function PaginationControls({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  pageSize, 
  onPageSizeChange,
  totalItems,
  loading 
}) {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="reporte-pagination">
      <div className="reporte-pagination-info">
        <div>Mostrando {startItem}-{endItem} de {totalItems} resultados</div>
        <div className="reporte-d-flex reporte-align-items-center reporte-gap-2 reporte-mt-2">
          <label className="reporte-form-label reporte-mb-0">Filas:</label>
          <select
            className="reporte-form-select"
            style={{ width: '70px', padding: '0.25rem', fontSize: '0.8rem' }}
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            disabled={loading}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>
      
      <div className="reporte-pagination-controls">
        <button
          className="reporte-pagination-btn"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1 || loading}
        >
          Primera
        </button>
        
        <button
          className="reporte-pagination-btn"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1 || loading}
        >
          Anterior
        </button>
        
        <span className="reporte-pagination-info">
          Página {currentPage} de {totalPages}
        </span>
        
        <button
          className="reporte-pagination-btn"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages || loading}
        >
          Siguiente
        </button>
        
        <button
          className="reporte-pagination-btn"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages || loading}
        >
          Última
        </button>
      </div>
    </div>
  );
}

export function ReporteVentasRangoAdmin() {
  // Estado del modo UI
  const [mode, setMode] = useState("generar");

  // Límites de fecha
  const [limites, setLimites] = useState({ min: "", max: todayStr() });
  
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("reportes/ventas/rango/limites/");
        setLimites({
          min: res.data?.min_fecha || "2020-01-01",
          max: res.data?.max_fecha || todayStr(),
        });
      } catch (error) {
        console.error("Error cargando límites:", error);
        setLimites({ min: "2020-01-01", max: todayStr() });
      }
    })();
  }, []);

  // Filtros para generar
  const [desde, setDesde] = useState(firstDayOfMonthStr());
  const [hasta, setHasta] = useState(todayStr());
  const [soloAprobados, setSoloAprobados] = useState(false);

  // Estados globales
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  // Estados de reportes y datos
  const [reportes, setReportes] = useState([]);
  const [reporteId, setReporteId] = useState(null);
  const [reporte, setReporte] = useState(null);

  // Estados de detalle e items
  const [ordering, setOrdering] = useState(ORDERING.MAS_VENDIDOS);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [count, setCount] = useState(0);

  // Funciones de carga
  const loadReportes = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listarReportesVentas({ page: 1, page_size: 50 });
      const data = res.data?.results ?? res.data ?? [];
      setReportes(data);
      if (!reporteId && data.length) setReporteId(data[0].id);
    } catch (e) {
      console.error("Error cargando reportes:", e);
      setError(e?.response?.data?.detail || "Error cargando reportes.");
    } finally {
      setLoading(false);
    }
  };

  const loadReporteDetail = async (id) => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const res = await getReporteVentas(id);
      setReporte(res.data);
    } catch (e) {
      console.error("Error cargando detalle del reporte:", e);
      setError(e?.response?.data?.detail || "Error cargando el reporte.");
      setReporte(null);
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async (id) => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const res = await listarItemsReporteVentas(id, { 
        ordering, 
        page, 
        page_size: pageSize 
      });
      const isPaginated = Array.isArray(res.data?.results);
      const rows = isPaginated ? res.data.results : res.data;
      setItems(rows || []);
      setCount(isPaginated ? res.data.count : rows?.length || 0);
    } catch (e) {
      console.error("Error cargando items:", e);
      setError(e?.response?.data?.detail || "Error cargando el detalle de productos.");
      setItems([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  };

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
      if (res.data?.id) {
        await loadReporteDetail(res.data.id);
        setPage(1);
        await loadItems(res.data.id);
      }
      setMode("generar");
    } catch (e) {
      console.error("Error generando reporte:", e);
      setError(e?.response?.data?.detail || "No se pudo generar el reporte.");
    } finally {
      setGenerating(false);
    }
  };

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
      console.error("Error eliminando reporte:", e);
      setError(e?.response?.data?.detail || "No se pudo eliminar el reporte.");
    } finally {
      setLoading(false);
    }
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

  // Cálculos de paginación
  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / pageSize)), [count, pageSize]);

  // Función para formatear moneda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(value ?? 0);
  };

  return (
    <div className="reporte-ventas-container">
      <h2 className="reporte-mb-3">Reporte de Ventas por Rango</h2>

      {/* Toggle buttons */}
      <div className="reporte-toggle-container">
        <button
          className={`reporte-toggle-btn ${mode === "generar" ? "active" : ""}`}
          onClick={() => setMode("generar")}
        >
          Generar
        </button>
        <button
          className={`reporte-toggle-btn ${mode === "listar" ? "active" : ""}`}
          onClick={() => setMode("listar")}
        >
          Listar
        </button>
      </div>

      {/* MODO GENERAR */}
      {mode === "generar" && (
        <>
          {/* Formulario de generación */}
          <div className="reporte-card">
            <div className="reporte-card-body">
              <div className="reporte-row">
                <div className="reporte-col reporte-col-md-3">
                  <label className="reporte-form-label">Desde</label>
                  <input
                    type="date"
                    className="reporte-form-control"
                    value={desde}
                    min={limites.min}
                    max={limites.max}
                    onChange={(e) => setDesde(e.target.value || limites.min)}
                    required
                  />
                </div>

                <div className="reporte-col reporte-col-md-3">
                  <label className="reporte-form-label">Hasta</label>
                  <input
                    type="date"
                    className="reporte-form-control"
                    value={hasta}
                    min={limites.min}
                    max={limites.max}
                    onChange={(e) => setHasta(e.target.value || todayStr())}
                    required
                  />
                  <div className="reporte-form-text">El backend normaliza a [desde, hasta)</div>
                </div>

                <div className="reporte-col reporte-col-md-2 reporte-d-flex reporte-align-items-end">
                  <div className="reporte-form-check">
                    <input
                      id="soloAprobados"
                      className="reporte-form-check-input"
                      type="checkbox"
                      checked={soloAprobados}
                      onChange={(e) => setSoloAprobados(e.target.checked)}
                    />
                    <label className="reporte-form-check-label" htmlFor="soloAprobados">
                      Solo aprobados
                    </label>
                  </div>
                </div>

                <div className="reporte-col reporte-col-md-4 reporte-d-flex reporte-align-items-end reporte-gap-2">
                  <button 
                    className="reporte-btn-primary" 
                    onClick={onGenerar} 
                    disabled={generating}
                  >
                    {generating ? "Generando..." : "Generar reporte"}
                  </button>
                  <button
                    className="reporte-btn-secondary"
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
          </div>

          {/* Selector de reportes y configuración */}
          <div className="reporte-card">
            <div className="reporte-card-body">
              <div className="reporte-row">
                <div className="reporte-col reporte-col-md-6">
                  <label className="reporte-form-label">Reportes generados</label>
                  <select
                    className="reporte-form-select"
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

                <div className="reporte-col reporte-col-md-6">
                  <label className="reporte-form-label">Ordenar detalle por</label>
                  <select
                    className="reporte-form-select"
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
                </div>
              </div>
            </div>
          </div>

          {/* KPIs */}
          {reporte && (
            <div className="reporte-row reporte-mb-3">
              <div className="reporte-col reporte-col-md-3">
                <div className="reporte-kpi-card">
                  <div className="reporte-kpi-title">Ventas netas</div>
                  <div className="reporte-kpi-value">
                    {formatCurrency(reporte.ventas_netas)}
                  </div>
                  <div className="reporte-kpi-subtitle">
                    {reporte.fecha_inicio} → {reporte.fecha_fin}
                  </div>
                </div>
              </div>

              <div className="reporte-col reporte-col-md-3">
                <div className="reporte-kpi-card">
                  <div className="reporte-kpi-title">Items vendidos</div>
                  <div className="reporte-kpi-value">{reporte.items_totales ?? 0}</div>
                  <div className="reporte-kpi-subtitle">Tickets: {reporte.tickets ?? 0}</div>
                </div>
              </div>

              <div className="reporte-col reporte-col-md-3">
                <div className="reporte-kpi-card">
                  <div className="reporte-kpi-title">Top producto</div>
                  <div className="reporte-kpi-value" style={{fontSize: '1.25rem'}}>
                    {reporte.top?.producto?.nombre || "—"}
                  </div>
                  <div className="reporte-kpi-subtitle">Cantidad: {reporte.top?.cantidad ?? 0}</div>
                </div>
              </div>

              <div className="reporte-col reporte-col-md-3">
                <div className="reporte-kpi-card">
                  <div className="reporte-kpi-title">Menos vendido</div>
                  <div className="reporte-kpi-value" style={{fontSize: '1.25rem'}}>
                    {reporte.bottom?.producto?.nombre || "—"}
                  </div>
                  <div className="reporte-kpi-subtitle">Cantidad: {reporte.bottom?.cantidad ?? 0}</div>
                </div>
              </div>
            </div>
          )}

          {/* Alertas de error */}
          {error && (
            <div className="reporte-alert-danger" role="alert">
              {error}
            </div>
          )}

          {/* Tabla de detalle */}
          <div className="reporte-table-container">
            <div className="reporte-card-body">
              <div className="reporte-d-flex reporte-align-items-center reporte-justify-content-between reporte-mb-2">
                <h5 className="reporte-mb-0" style={{color: '#00bcd4', fontSize: '1.25rem', fontWeight: '600'}}>
                  Detalle por producto
                </h5>
                <span className="reporte-badge">
                  {count} productos
                </span>
              </div>

              {/* Vista de tabla para desktop */}
              <div className="reporte-table-responsive">
                <table className="reporte-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Producto</th>
                      <th className="reporte-text-end">Cantidad</th>
                      <th className="reporte-text-end">Ingresos</th>
                      <th className="reporte-text-end">Tickets</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((p) => (
                      <tr key={`${p.producto?.id ?? p.producto_id}-${p.cantidad}-${p.ingresos}`}>
                        <td>{p.producto?.id ?? p.producto_id}</td>
                        <td>{p.producto?.nombre ?? "—"}</td>
                        <td className="reporte-text-end">{p.cantidad}</td>
                        <td className="reporte-text-end">
                          {formatCurrency(p.ingresos)}
                        </td>
                        <td className="reporte-text-end">{p.tickets}</td>
                      </tr>
                    ))}
                    {!items.length && (
                      <tr>
                        <td colSpan="5" className="reporte-empty-state">
                          {loading ? "Cargando..." : "Sin datos para este reporte."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Vista de cards para móvil */}
              <div className="reporte-mobile-cards">
                {items.map((p) => (
                  <div key={`mobile-${p.producto?.id ?? p.producto_id}-${p.cantidad}-${p.ingresos}`} className="reporte-mobile-card">
                    <div className="reporte-mobile-card-header">
                      <div className="reporte-mobile-card-title">
                        {p.producto?.nombre ?? "—"}
                      </div>
                      <div className="reporte-mobile-card-id">
                        #{p.producto?.id ?? p.producto_id}
                      </div>
                    </div>
                    <div className="reporte-mobile-card-body">
                      <div className="reporte-mobile-card-field">
                        <div className="reporte-mobile-card-label">Cantidad</div>
                        <div className="reporte-mobile-card-value primary">
                          {p.cantidad?.toLocaleString('es-CO') ?? 0}
                        </div>
                      </div>
                      <div className="reporte-mobile-card-field">
                        <div className="reporte-mobile-card-label">Tickets</div>
                        <div className="reporte-mobile-card-value">
                          {p.tickets ?? 0}
                        </div>
                      </div>
                      <div className="reporte-mobile-card-field" style={{gridColumn: '1 / -1'}}>
                        <div className="reporte-mobile-card-label">Ingresos</div>
                        <div className="reporte-mobile-card-value currency">
                          {formatCurrency(p.ingresos)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {!items.length && (
                  <div className="reporte-empty-state">
                    {loading ? "Cargando..." : "Sin datos para este reporte."}
                  </div>
                )}
              </div>

              {/* Paginación */}
              {count > 0 && (
                <PaginationControls
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                  pageSize={pageSize}
                  onPageSizeChange={(newSize) => {
                    setPageSize(newSize);
                    setPage(1);
                  }}
                  totalItems={count}
                  loading={loading}
                />
              )}
            </div>
          </div>
        </>
      )}

      {/* MODO LISTAR */}
      {mode === "listar" && (
        <div className="reporte-card">
          <div className="reporte-card-body">
            <div className="reporte-d-flex reporte-justify-content-between reporte-align-items-center reporte-mb-2">
              <h5 className="reporte-mb-0" style={{color: '#00bcd4', fontSize: '1.25rem', fontWeight: '600'}}>
                Reportes generados
              </h5>
              <span className="reporte-badge">
                {reportes.length} reporte{reportes.length === 1 ? "" : "s"}
              </span>
            </div>
            
            <ListaReportesVentas
              reportes={reportes}
              seleccionadoId={reporteId}
              onSelect={(id) => {
                setReporteId(id);
                setMode("generar");
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
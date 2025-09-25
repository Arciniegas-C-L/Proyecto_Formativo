import { useEffect, useMemo, useState } from "react";
import {
  listarFacturas,
  descargarFacturaPDF,
  descargarComprobantePago,
} from "../../api/Factura.api";
import { Link } from "react-router-dom";
import "../../assets/css/Facturas/Facturas.css";

function usePaginatedResponse(data) {
  return useMemo(() => {
    if (!data) return { items: [], count: 0 };
    if (Array.isArray(data)) return { items: data, count: data.length };
    if (Array.isArray(data.results))
      return { items: data.results, count: data.count ?? data.results.length };
    return { items: [], count: 0 };
  }, [data]);
}

const fmtMoney = (value, currency = "COP") => {
  if (value == null || value === "") return "—";
  const num = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(num)) return String(value);
  try {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency,
    }).format(num);
  } catch {
    return new Intl.NumberFormat("es-CO").format(num);
  }
};

const fmtDate = (value) => {
  if (!value) return "—";
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value);
    // dd/mm/aaaa hh:mm
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  } catch {
    return String(value);
  }
};

const descargarBlob = (blob, nombreArchivo) => {
  const url = window.URL.createObjectURL(
    new Blob([blob], { type: "application/pdf" })
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = nombreArchivo;
  a.click();
  window.URL.revokeObjectURL(url);
};

export function Facturas() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [data, setData] = useState(null);

  // Filtros
  const [qNumero, setQNumero] = useState("");
  const [qDesde, setQDesde] = useState("");
  const [qHasta, setQHasta] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { items, count } = usePaginatedResponse(data);
  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  const fetchData = async () => {
    setLoading(true);
    setErr(null);
    try {
      const params = { page, page_size: pageSize };
      if (qNumero.trim()) params.numero = qNumero.trim();
      if (qDesde) params.fecha_desde = qDesde;
      if (qHasta) params.fecha_hasta = qHasta;

      const { data: resp } = await listarFacturas(params);
      setData(resp);
    } catch (e) {
      setErr(
        e?.response?.data?.detail || e?.message || "Error cargando facturas"
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  const onBuscar = (e) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  const onLimpiar = () => {
    setQNumero("");
    setQDesde("");
    setQHasta("");
    setPage(1);
    fetchData();
  };

  const descargarPdfFactura = async (id, numero) => {
    try {
      const { data: blob } = await descargarFacturaPDF(id);
      descargarBlob(blob, `Factura_${numero || id}.pdf`);
    } catch {
      alert("No fue posible descargar el PDF de la factura.");
    }
  };

  const descargarPdfComprobante = async (id, numero) => {
    try {
      const { data: blob } = await descargarComprobantePago(id);
      descargarBlob(blob, `Comprobante_${numero || id}.pdf`);
    } catch {
      alert("No fue posible descargar el comprobante de pago.");
    }
  };

  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages, p + 1));

  // Render de cada factura como card (para móviles)
  const renderFacturaCard = (f) => {
    const fecha = f.fecha || f.emitida_en || f.created_at || null;
    const correo =
      f.cliente_email ||
      f.usuario_email ||
      f.email ||
      (f.usuario && f.usuario.email) ||
      "—";
    const moneda = f.moneda || "COP";
    const totalFmt = fmtMoney(f.total, moneda);
    const estado = (f.estado || "").toLowerCase();
    const badge =
      estado === "pagada"
        ? "facturas-badge-success"
        : estado === "pendiente"
        ? "facturas-badge-warning"
        : estado === "anulada"
        ? "facturas-badge-danger"
        : "facturas-badge-secondary";

    return (
      <div key={f.id} className="facturas-card">
        <div className="facturas-card-header">
          <div className="facturas-card-number">
            <span className="fw-semibold text-cyan">
              {f.numero || "—"}
            </span>
            {f.estado && (
              <span className={`facturas-badge ${badge}`}>
                {f.estado}
              </span>
            )}
          </div>
        </div>
        
        <div className="facturas-card-body">
          <div className="facturas-card-row">
            <span className="facturas-card-label">Fecha:</span>
            <span className="facturas-card-value">{fmtDate(fecha)}</span>
          </div>
          
          <div className="facturas-card-row">
            <span className="facturas-card-label">Correo:</span>
            <span className="facturas-card-value facturas-card-email">{correo}</span>
          </div>
          
          <div className="facturas-card-row">
            <span className="facturas-card-label">Total:</span>
            <span className="facturas-card-value facturas-card-total">
              {totalFmt} {moneda}
            </span>
          </div>
        </div>
        
        <div className="facturas-card-actions">
          <Link
            className="btn btn-cyan btn-sm"
            to={`/facturas/${f.id}`}
          >
            <i className="bi bi-eye"></i>
            Ver
          </Link>
          <button
            className="btn btn-purple btn-sm"
            onClick={() => descargarPdfFactura(f.id, f.numero)}
          >
            <i className="bi bi-file-earmark-pdf"></i>
            PDF
          </button>
          <button
            className="btn btn-purple btn-sm"
            onClick={() => descargarPdfComprobante(f.id, f.numero)}
          >
            <i className="bi bi-receipt"></i>
            Comp.
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="facturas-page">
      {/* Header con botones a la derecha */}
      <div className="facturas-header">
        <div className="facturas-header-title">
          <i className="bi bi-receipt fs-3 me-2 text-cyan" />
          <h1 className="h3 mb-0 text-white">Lista de Facturas</h1>
        </div>
        <div className="facturas-header-actions">
          <button
            type="submit"
            form="form-filtros"
            className="btn btn-cyan btn-compact"
            disabled={loading}
          >
            <i className="bi bi-search me-1" /> 
            <span className="d-none d-sm-inline">Buscar</span>
          </button>
          <button
            type="button"
            className="btn btn-purple btn-compact"
            onClick={onLimpiar}
            disabled={loading}
          >
            <i className="bi bi-x-circle me-1" />
            <span className="d-none d-sm-inline">Limpiar</span>
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="facturas-filters-card mb-3">
        <div className="card-body">
          <form
            id="form-filtros"
            className="facturas-filters-form"
            onSubmit={onBuscar}
          >
            <div className="facturas-filter-group">
              <label className="form-label text-black">Número</label>
              <input
                type="text"
                className="form-control facturas-input"
                value={qNumero}
                onChange={(e) => setQNumero(e.target.value)}
                placeholder="Ej: F-000123"
              />
            </div>
            
            <div className="facturas-filter-dates">
              <div className="facturas-filter-group">
                <label className="form-label text-black">Desde</label>
                <input
                  type="date"
                  className="form-control facturas-input"
                  value={qDesde}
                  onChange={(e) => setQDesde(e.target.value)}
                />
              </div>
              <div className="facturas-filter-group">
                <label className="form-label text-black">Hasta</label>
                <input
                  type="date"
                  className="form-control facturas-input"
                  value={qHasta}
                  onChange={(e) => setQHasta(e.target.value)}
                />
              </div>
            </div>
            
            <div className="facturas-filter-group">
              <label className="form-label text-black">Filas por página</label>
              <select
                className="form-select facturas-input"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
              >
                {[5, 10, 20, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </form>
        </div>
      </div>

      {loading && (
        <div
          className="alert facturas-alert-info d-flex align-items-center"
          role="alert"
        >
          <div
            className="spinner-border spinner-border-sm me-2"
            role="status"
            aria-hidden="true"
          />
          Cargando facturas…
        </div>
      )}

      {err && !loading && (
        <div className="alert facturas-alert-warning" role="alert">
          {err}
        </div>
      )}

      {!loading && !err && (
        <>
          {/* Vista de tabla para pantallas medianas y grandes */}
          <div className="facturas-table-container d-none d-lg-block">
            <table className="table facturas-table align-middle mb-0">
              <thead className="facturas-table-header">
                <tr>
                  <th>Número</th>
                  <th>Fecha</th>
                  <th>Correo</th>
                  <th className="text-end">Total</th>
                  <th>Moneda</th>
                  <th>Estado</th>
                  <th style={{ width: 240 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center text-muted py-4">
                      No hay facturas para los filtros seleccionados.
                    </td>
                  </tr>
                )}
                {items.map((f) => {
                  const fecha =
                    f.fecha || f.emitida_en || f.created_at || null;
                  const correo =
                    f.cliente_email ||
                    f.usuario_email ||
                    f.email ||
                    (f.usuario && f.usuario.email) ||
                    "—";
                  const moneda = f.moneda || "COP";
                  const totalFmt = fmtMoney(f.total, moneda);
                  const estado = (f.estado || "").toLowerCase();
                  const badge =
                    estado === "pagada"
                      ? "facturas-badge-success"
                      : estado === "pendiente"
                      ? "facturas-badge-warning"
                      : estado === "anulada"
                      ? "facturas-badge-danger"
                      : "facturas-badge-secondary";

                  return (
                    <tr key={f.id} className="facturas-table-row">
                      <td className="fw-semibold text-cyan">
                        {f.numero || "—"}
                      </td>
                      <td className="text-black">{fmtDate(fecha)}</td>
                      <td className="text-black">{correo}</td>
                      <td className="text-end fw-bold text-black">
                        {totalFmt}
                      </td>
                      <td className="text-black">{moneda}</td>
                      <td>
                        {f.estado ? (
                          <span className={`facturas-badge ${badge}`}>
                            {f.estado}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        <div className="facturas-actions">
                          <Link
                            className="btn btn-cyan btn-sm"
                            to={`/facturas/${f.id}`}
                          >
                            Ver
                          </Link>
                          <button
                            className="btn btn-purple btn-sm"
                            onClick={() =>
                              descargarPdfFactura(f.id, f.numero)
                            }
                          >
                            PDF
                          </button>
                          <button
                            className="btn btn-purple btn-sm"
                            onClick={() =>
                              descargarPdfComprobante(f.id, f.numero)
                            }
                          >
                            Comprobante
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Vista de cards para pantallas pequeñas y medianas */}
          <div className="facturas-cards-container d-lg-none">
            {items.length === 0 ? (
              <div className="facturas-empty-state">
                <i className="bi bi-inbox fs-1 text-muted mb-3"></i>
                <p className="text-muted">No hay facturas para los filtros seleccionados.</p>
              </div>
            ) : (
              items.map(renderFacturaCard)
            )}
          </div>

          {/* Paginación */}
          <div className="facturas-pagination">
            <div className="facturas-pagination-info">
              <span className="facturas-results-count">
                {count} resultado{count === 1 ? "" : "s"}
              </span>
              <span className="facturas-page-info d-none d-sm-inline">
                · Página {page} de {totalPages}
              </span>
            </div>
            <div className="facturas-pagination-controls">
              <button
                className="btn btn-purple btn-sm"
                disabled={page <= 1 || loading}
                onClick={goPrev}
              >
                <i className="bi bi-chevron-left"></i>
                <span className="d-none d-sm-inline ms-1">Anterior</span>
              </button>
              <span className="facturas-page-numbers d-none d-md-flex">
                Página {page} de {totalPages}
              </span>
              <button
                className="btn btn-cyan btn-sm"
                disabled={page >= totalPages || loading}
                onClick={goNext}
              >
                <span className="d-none d-sm-inline me-1">Siguiente</span>
                <i className="bi bi-chevron-right"></i>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
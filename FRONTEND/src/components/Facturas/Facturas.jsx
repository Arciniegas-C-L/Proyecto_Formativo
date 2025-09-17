import { useEffect, useMemo, useState } from "react";
import { listarFacturas, descargarFacturaPDF } from "../../api/Factura.api";
import { Link } from "react-router-dom";

function usePaginatedResponse(data) {
  return useMemo(() => {
    if (!data) return { items: [], count: 0 };
    if (Array.isArray(data)) return { items: data, count: data.length };
    if (Array.isArray(data.results)) return { items: data.results, count: data.count ?? data.results.length };
    return { items: [], count: 0 };
  }, [data]);
}

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
      if (qNumero) params.numero = qNumero;
      if (qDesde) params.fecha_desde = qDesde;
      if (qHasta) params.fecha_hasta = qHasta;

      const { data: resp } = await listarFacturas(params);
      setData(resp);
    } catch (e) {
      setErr(e?.response?.data?.detail || e?.message || "Error cargando facturas");
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

  const descargarPdf = async (id, numero) => {
    try {
      const { data: blob } = await descargarFacturaPDF(id);
      const url = window.URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `Factura_${numero || id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("No fue posible descargar el PDF.");
    }
  };

  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages, p + 1));

  return (
    <div className="container my-4">
      <div className="d-flex align-items-center mb-3">
        <i className="bi bi-receipt fs-3 me-2" />
        <h1 className="h4 mb-0">Facturas</h1>
      </div>

      <div className="card shadow-sm border-0 mb-3">
        <div className="card-body">
          <form className="row g-3 align-items-end" onSubmit={onBuscar}>
            <div className="col-12 col-md-3">
              <label className="form-label small text-muted mb-1">Número</label>
              <input
                type="text"
                className="form-control"
                value={qNumero}
                onChange={(e) => setQNumero(e.target.value)}
                placeholder="Ej: F-000123"
              />
            </div>
            <div className="col-6 col-md-2">
              <label className="form-label small text-muted mb-1">Desde</label>
              <input type="date" className="form-control" value={qDesde} onChange={(e) => setQDesde(e.target.value)} />
            </div>
            <div className="col-6 col-md-2">
              <label className="form-label small text-muted mb-1">Hasta</label>
              <input type="date" className="form-control" value={qHasta} onChange={(e) => setQHasta(e.target.value)} />
            </div>
            <div className="col-6 col-md-2">
              <label className="form-label small text-muted mb-1">Filas</label>
              <select className="form-select" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                {[5, 10, 20, 50].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div className="col-12 col-md-3 d-flex gap-2">
              <button type="submit" className="btn btn-primary w-100">
                <i className="bi bi-search me-1" /> Buscar
              </button>
              <button type="button" className="btn btn-outline-secondary" onClick={onLimpiar}>
                Limpiar
              </button>
            </div>
          </form>
        </div>
      </div>

      {loading && (
        <div className="alert alert-info d-flex align-items-center" role="alert">
          <div className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
          Cargando facturas…
        </div>
      )}

      {err && !loading && <div className="alert alert-warning" role="alert">{err}</div>}

      {!loading && !err && (
        <div className="card shadow-sm border-0">
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Número</th>
                  <th>Fecha</th>
                  <th>Correo</th>{/* ← antes decía Cliente */}
                  <th>Total</th>
                  <th>Moneda</th>
                  <th>Estado</th>
                  <th style={{ width: 160 }}>Acciones</th>
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
                {items.map((f) => (
                  <tr key={f.id}>
                    <td className="fw-semibold">{f.numero || "—"}</td>
                    <td>{f.fecha || f.created_at || "—"}</td>
                    <td>
                      {f.cliente_email
                        || f.usuario_email
                        || f.email
                        || (f.usuario && f.usuario.email)
                        || "—"}
                    </td>
                    <td>{f.total != null ? f.total : "—"}</td>
                    <td>{f.moneda || "—"}</td>
                    <td>
                      {f.estado ? (
                        <span className={`badge ${f.estado === "pagada" ? "bg-success" : "bg-secondary"}`}>
                          {f.estado}
                        </span>
                      ) : "—"}
                    </td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        <Link className="btn btn-outline-primary" to={`/facturas/${f.id}`}>
                          Ver
                        </Link>
                        <button className="btn btn-outline-secondary" onClick={() => descargarPdf(f.id, f.numero)}>
                          PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="d-flex justify-content-between align-items-center p-3">
            <div className="small text-muted">
              {count} resultado{count === 1 ? "" : "s"} · Página {page} de {totalPages}
            </div>
            <div className="btn-group">
              <button className="btn btn-outline-secondary btn-sm" disabled={page <= 1} onClick={goPrev}>
                « Anterior
              </button>
              <button className="btn btn-outline-secondary btn-sm" disabled={page >= totalPages} onClick={goNext}>
                Siguiente »
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

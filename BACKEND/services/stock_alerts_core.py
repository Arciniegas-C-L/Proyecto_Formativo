# BACKEND/services/stock_alerts_core.py
import logging
from django.conf import settings
from django.core.cache import cache
from BACKEND.models import Inventario, Usuario, Rol
from BACKEND.utils_email import send_email_raw

logger = logging.getLogger(__name__)

LOW_STOCK_UMBRAL = 5
DIGEST_TOP_N = 10
LOW_STOCK_CACHE_TTL = 120 * 60  # 2 horas

def _admin_emails():
    try:
        rol_admin = Rol.objects.get(nombre__iexact='administrador')
    except Rol.DoesNotExist:
        logger.warning("Rol 'administrador' no existe; no hay destinatarios para alertas.")
        return []
    emails_qs = (Usuario.objects
                 .filter(rol=rol_admin, estado=True, is_active=True)
                 .exclude(correo__isnull=True).exclude(correo='')
                 .values_list('correo', flat=True))
    cleaned = sorted({(e or "").strip() for e in emails_qs if (e or "").strip()})
    # Debug opcional controlado por setting
    if getattr(settings, "STOCK_ALERTS_DEBUG", False):
        logger.warning("(_admin_emails) -> %s", cleaned)
    return cleaned

def _stock_of(inv: Inventario) -> int:
    s = inv.stock_talla if inv.stock_talla is not None else inv.cantidad
    try:
        return int(s or 0)
    except Exception:
        return 0

def _item_ctx(inv: Inventario):
    return {
        "categoria": inv.producto.subcategoria.categoria.nombre,
        "subcategoria": inv.producto.subcategoria.nombre,
        "producto": inv.producto.nombre,
        "grupo_talla": inv.talla.grupo.nombre,
        "talla": inv.talla.nombre,
        "stock": _stock_of(inv),
    }

def _table_html(rows, title, umbral=None):
    header = f"<h2>{title}</h2>"
    if umbral is not None:
        header += f"<p>Umbral: <strong>{umbral}</strong></p>"
    head = ("<table border='1' cellpadding='6' cellspacing='0'>"
            "<thead><tr><th>Categoría</th><th>Subcategoría</th><th>Producto</th>"
            "<th>Grupo Talla</th><th>Talla</th><th>Stock</th></tr></thead><tbody>")
    body = "".join(
        f"<tr><td>{r['categoria']}</td><td>{r['subcategoria']}</td>"
        f"<td>{r['producto']}</td><td>{r['grupo_talla']}</td>"
        f"<td>{r['talla']}</td><td><strong>{r['stock']}</strong></td></tr>"
        for r in rows
    )
    return header + head + body + "</tbody></table>"

def _send_low_stock_email_single(inv: Inventario, umbral: int):
    html = _table_html([_item_ctx(inv)], title="Alerta de bajo stock por talla", umbral=umbral)
    sent = send_email_raw(
        subject=f"[ALERTA] Bajo stock: {inv.producto.nombre} / Talla {inv.talla.nombre}",
        to_emails=_admin_emails(),
        html_body=html,
        text_body=None
    )
    if getattr(settings, "STOCK_ALERTS_DEBUG", False):
        logger.warning("(_send_low_stock_email_single) enviados=%s", sent)

def low_stock_event_check(inv: Inventario, umbral: int = LOW_STOCK_UMBRAL):
    stock = _stock_of(inv)
    key = f"lowstock:inv:{inv.pk}:u{umbral}"
    if stock < umbral:
        if not cache.get(key):
            _send_low_stock_email_single(inv, umbral=umbral)
            cache.set(key, True, timeout=LOW_STOCK_CACHE_TTL)
    else:
        cache.delete(key)

def build_digest_html(umbral: int, items):
    rows = [_item_ctx(i) for i in items]
    title = "Resumen diario: Ítems bajo stock" if items else "Resumen diario"
    return _table_html(rows, title=title, umbral=umbral), rows

from django.core.cache import cache
from BACKEND.models import Usuario, Rol, Inventario
from BACKEND.utils_email import send_email_raw

LOW_STOCK_UMBRAL = 5
LOW_STOCK_CACHE_TTL = 90 * 60  # 90 min

def _admin_emails():
    try:
        rol_admin = Rol.objects.get(nombre__iexact='administrador')
    except Rol.DoesNotExist:
        return []
    qs = (Usuario.objects
          .filter(rol=rol_admin, estado=True, is_active=True)
          .exclude(correo__isnull=True)
          .exclude(correo=''))
    return list(qs.values_list('correo', flat=True))

def _stock_of(inv: Inventario) -> int:
    s = inv.stock_talla if inv.stock_talla is not None else inv.cantidad
    try:
        return int(s or 0)
    except:
        return 0

def _row(inv: Inventario):
    return (f"<tr><td>{inv.producto.subcategoria.categoria.nombre}</td>"
            f"<td>{inv.producto.subcategoria.nombre}</td>"
            f"<td>{inv.producto.nombre}</td>"
            f"<td>{inv.talla.grupo.nombre}</td>"
            f"<td>{inv.talla.nombre}</td>"
            f"<td><strong>{_stock_of(inv)}</strong></td></tr>")

def _table_single(inv: Inventario, umbral: int):
    head = ("<h2>Alerta de bajo stock por talla</h2>"
            f"<p>Umbral: <strong>{umbral}</strong></p>"
            "<table border='1' cellpadding='6' cellspacing='0'>"
            "<thead><tr><th>Categoría</th><th>Subcategoría</th><th>Producto</th>"
            "<th>Grupo Talla</th><th>Talla</th><th>Stock</th></tr></thead><tbody>")
    return head + _row(inv) + "</tbody></table>"

def low_stock_event_check(inv: Inventario, umbral: int = LOW_STOCK_UMBRAL):
    stock = _stock_of(inv)
    key = f"lowstock:inv:{inv.pk}:u{umbral}"
    if stock < umbral:
        if not cache.get(key):  # cooldown
            html = _table_single(inv, umbral)
            send_email_raw(
                subject=f"[ALERTA] Bajo stock: {inv.producto.nombre} / Talla {inv.talla.nombre}",
                to_emails=_admin_emails(),
                html_body=html
            )
            cache.set(key, True, timeout=LOW_STOCK_CACHE_TTL)
    else:
        cache.delete(key)

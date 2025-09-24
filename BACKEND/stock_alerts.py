from django.utils import timezone
from BACKEND.models import StockAlertActivo, Notificacion

LOW_THRESHOLD = 5  # regla: 5 o menos = bajo; 0 = sin stock

def upsert_stock_alert_for_inventory(inv):
    qty = int(inv.stock_talla or 0)

    if qty <= 0:
        tipo = 'stock_out'
    elif qty <= LOW_THRESHOLD:
        tipo = 'stock_low'
    else:
        tipo = None

    if not tipo:
        # resolver si había alerta
        StockAlertActivo.objects.filter(
            inventario=inv, resuelto=False
        ).update(resuelto=True, actualizado_en=timezone.now())
        return

    StockAlertActivo.objects.update_or_create(
        inventario=inv,
        defaults={'tipo': tipo, 'cantidad_actual': qty, 'resuelto': False}
    )

    Notificacion.objects.get_or_create(
        tipo=tipo,
        metadata={
            'inventario_id': inv.idInventario,
            'producto_id': inv.producto_id,
            'talla_id': inv.talla_id,
        },
        defaults={
            'titulo': 'Stock bajo' if tipo == 'stock_low' else 'Sin stock',
            'mensaje': f'{inv.producto.nombre} / {inv.talla.nombre}: {qty} uds.',
        }
    )

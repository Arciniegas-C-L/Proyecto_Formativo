# BACKEND/services/orders.py
from django.db import transaction
from django.core.exceptions import ValidationError
from BACKEND.models import Pedido, Inventario
#from BACKEND.stock_alerts import upsert_stock_alert_for_inventory <-- i´m using signal

@transaction.atomic
def confirmar_pedido_y_descontar_stock(pedido_id):
    pedido = Pedido.objects.select_related('usuario').prefetch_related('items').get(idPedido=pedido_id)

    for it in pedido.items.all():
        inv = Inventario.objects.select_for_update().get(
            producto=it.producto,
            talla=it.talla
        )
        if inv.stock_talla < it.cantidad:
            raise ValidationError({'detail': f'Sin stock suficiente para {it.producto.nombre} / {it.talla.nombre}'})

        inv.stock_talla -= it.cantidad
        inv.save()  # <- si tienes el signal, con esto basta
        # Si NO usas el signal, descomenta la siguiente línea:
        # upsert_stock_alert_for_inventory(inv)

    return pedido

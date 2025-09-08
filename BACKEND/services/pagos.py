from django.db import transaction
from decimal import Decimal
from BACKEND.models import (Carrito, Pago, WebhookEvent, Pedido, PedidoProducto,
                            Inventario, Factura, FacturaItem)

MP_TO_INTERNO = {'approved':'pagado','pending':'pendiente','in_process':'pendiente',
                 'rejected':'rechazado','cancelled':'cancelado','refunded':'reembolsado',
                 'charged_back':'contracargo'}

def _devolver_stock(carrito):
    for item in carrito.items.select_related('producto','talla'):
        inv_qs = Inventario.objects.filter(producto=item.producto)
        if item.talla: inv_qs = inv_qs.filter(talla=item.talla)
        inv = inv_qs.first()
        if inv:
            inv.stock_talla = (inv.stock_talla or 0) + item.cantidad
            inv.save(update_fields=['stock_talla'])

def _emitir_factura_desde_pedido(pedido: Pedido, mp_payment_id: str, moneda='COP') -> Factura:
    # Consecutivo simple (ajústalo a tu gusto/tabla de consecutivos)
    consecutivo = f"FAC-{pedido.idPedido}"
    subtotal = Decimal('0')
    for it in PedidoProducto.objects.filter(pedido=pedido).select_related('producto'):
        precio = Decimal(getattr(it.producto,'precio',0) or 0)
        subtotal += precio

    impuestos = Decimal('0')  # si no manejas IVA aún
    total = subtotal + impuestos

    factura = Factura.objects.create(
        numero=consecutivo,
        pedido=pedido,
        usuario=pedido.usuario,
        subtotal=subtotal,
        impuestos=impuestos,
        total=total,
        moneda=moneda,
        metodo_pago='mercadopago',
        mp_payment_id=mp_payment_id
    )

    for it in PedidoProducto.objects.filter(pedido=pedido).select_related('producto'):
        precio = Decimal(getattr(it.producto,'precio',0) or 0)
        FacturaItem.objects.create(
            factura=factura,
            producto=it.producto,
            descripcion=it.producto.nombre,
            cantidad=1,                 # si tu PedidoProducto no trae cantidad, usa 1
            precio=precio,
            subtotal=precio
        )
    return factura

@transaction.atomic
def procesar_pago_de_mp(payment_json: dict):
    payment_id = str(payment_json.get('id'))
    status     = payment_json.get('status')
    status_det = payment_json.get('status_detail','')
    external   = payment_json.get('external_reference','')
    amount     = payment_json.get('transaction_amount') or 0
    currency   = payment_json.get('currency_id') or 'COP'

    carrito = Carrito.objects.filter(external_reference=external).select_for_update().first()

    pago, _ = Pago.objects.update_or_create(
        mp_payment_id=payment_id,
        defaults=dict(
            external_reference=external,
            status=status,
            status_detail=status_det,
            amount=amount,
            currency=currency,
            raw=payment_json,
            carrito=carrito
        )
    )

    if not carrito:
        return pago

    carrito.payment_id = payment_id
    carrito.mp_status  = status
    carrito.save(update_fields=['payment_id','mp_status'])

    from BACKEND.models import EstadoCarrito
    EstadoCarrito.objects.create(
        carrito=carrito,
        estado=MP_TO_INTERNO.get(status,'pendiente'),
        observacion=f"Pago {status} ({status_det})"
    )

    if status == 'approved':
        # Crear pedido si aún no existe (idempotente)
        pedido = Pedido.objects.filter(usuario=carrito.usuario, estado=True, total=carrito.calcular_total()).first()
        if not pedido:
            pedido = Pedido.objects.create(
                usuario=carrito.usuario,
                total=carrito.calcular_total(),
                estado=True
            )
            for it in carrito.items.all():
                PedidoProducto.objects.create(pedido=pedido, producto=it.producto)

        pago.pedido = pedido
        pago.save(update_fields=['pedido'])

        # Cerrar carrito
        carrito.estado = False
        carrito.save(update_fields=['estado'])

        # Emitir factura (idempotente “natural” por ser OneToOne con Pedido)
        if not hasattr(pedido, 'factura'):
            _emitir_factura_desde_pedido(pedido, mp_payment_id=payment_id, moneda=currency)

    elif status in ('rejected','cancelled'):
        _devolver_stock(carrito)

    return pago

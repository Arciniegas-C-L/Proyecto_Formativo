# reportes_rango.py
from datetime import timedelta, datetime
from decimal import Decimal
from django.db import transaction
from django.db.models import Sum, Count, Exists, OuterRef
from django.utils import timezone

from .models import FacturaItem, Pago, SalesRangeReport, SalesRangeReportItem

def _normalize_dates(fecha_inicio, fecha_fin):
    """
    Asegura fecha_inicio <= fecha_fin y usa convención [inicio, fin) exclusiva en fin.
    Si el usuario pasa mismas fechas, forzamos fin = inicio + 1 día.
    """
    if fecha_inicio > fecha_fin:
        fecha_inicio, fecha_fin = fecha_fin, fecha_inicio
    if fecha_inicio == fecha_fin:
        fecha_fin = fecha_inicio + timedelta(days=1)
    return fecha_inicio, fecha_fin

@transaction.atomic
def build_range_report(fecha_inicio, fecha_fin, incluir_aprobados=True):
    """
    Construye (o reconstruye) un reporte en el rango [fecha_inicio, fecha_fin).
    - Borra/Regenera si ya existe la combinación (fecha_inicio, fecha_fin, incluir_aprobados).
    - Agrega por producto: cantidad, ingresos, tickets.
    - Calcula KPIs + top/bottom por cantidad.
    Devuelve la instancia de SalesRangeReport creada.
    """
    # Normaliza fechas
    fecha_inicio, fecha_fin = _normalize_dates(fecha_inicio, fecha_fin)

    # Si ya existe, lo borramos para regenerar (idempotencia)
    SalesRangeReport.objects.filter(
        fecha_inicio=fecha_inicio, fecha_fin=fecha_fin, incluir_aprobados=incluir_aprobados
    ).delete()

    # Subquery pagos aprobados por pedido (si aplica)
    pagos_aprobados = Pago.objects.filter(
        pedido=OuterRef('factura__pedido'),
        status='approved'
    )

    # Items de factura en el rango por fecha de emisión
    items_qs = (FacturaItem.objects
        .filter(
            factura__emitida_en__date__gte=fecha_inicio,
            factura__emitida_en__date__lt=fecha_fin,
        )
    )

    if incluir_aprobados:
        items_qs = items_qs.annotate(pago_ok=Exists(pagos_aprobados)).filter(pago_ok=True)

    # Agregados por producto
    agregados = (items_qs
        .values('producto')  # producto_id
        .annotate(
            cantidad=Sum('cantidad'),
            ingresos=Sum('subtotal'),
            tickets=Count('factura', distinct=True),
        )
    )

    total_neto = Decimal('0')
    total_items = 0

    # Crear cabecera
    reporte = SalesRangeReport.objects.create(
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin,
        incluir_aprobados=incluir_aprobados,
        ventas_netas=Decimal('0'),
        items_totales=0,
        tickets=0,
    )

    # Insertar detalle
    items_bulk = []
    for a in agregados:
        pid = a['producto']
        cant = int(a['cantidad'] or 0)
        ing  = a['ingresos'] or Decimal('0')
        tks  = int(a['tickets'] or 0)

        items_bulk.append(SalesRangeReportItem(
            reporte=reporte,
            producto_id=pid,
            cantidad=cant,
            ingresos=ing,
            tickets=tks
        ))
        total_neto += ing
        total_items += cant

    if items_bulk:
        SalesRangeReportItem.objects.bulk_create(items_bulk, batch_size=500)

    # Tickets únicos del rango (sin sobrecontar)
    tickets_unicos = items_qs.values('factura').distinct().count()

    # Top / Bottom por cantidad (excluye ceros)
    top = (SalesRangeReportItem.objects
           .filter(reporte=reporte, cantidad__gt=0)
           .select_related('producto')
           .order_by('-cantidad', '-ingresos')
           .first())
    bottom = (SalesRangeReportItem.objects
              .filter(reporte=reporte, cantidad__gt=0)
              .select_related('producto')
              .order_by('cantidad', 'ingresos')
              .first())

    # Actualiza cabecera con KPIs y snapshots
    reporte.ventas_netas = total_neto
    reporte.items_totales = total_items
    reporte.tickets = tickets_unicos
    if top:
        reporte.top_producto = top.producto
        reporte.top_producto_nombre = top.producto.nombre
        reporte.top_cantidad = top.cantidad
    if bottom:
        reporte.bottom_producto = bottom.producto
        reporte.bottom_producto_nombre = bottom.producto.nombre
        reporte.bottom_cantidad = bottom.cantidad
    reporte.save(update_fields=[
        'ventas_netas','items_totales','tickets',
        'top_producto','top_producto_nombre','top_cantidad',
        'bottom_producto','bottom_producto_nombre','bottom_cantidad'
    ])

    return reporte

from django.contrib import admin
from .models import Rol, Usuario, Proveedor, Categoria, Producto, Inventario, Movimiento, Pedido, PedidoProducto, Pago, TipoPago, Subcategoria
# Register your models here.
admin.site.register(Rol)
admin.site.register(Usuario)
admin.site.register(Proveedor)
admin.site.register(Categoria)
admin.site.register(Producto)
admin.site.register(Inventario)
admin.site.register(Movimiento)
admin.site.register(Pedido)
admin.site.register(PedidoProducto)
admin.site.register(Pago)
admin.site.register(TipoPago)
admin.site.register(Subcategoria)
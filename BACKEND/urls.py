from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views


router = DefaultRouter()
router.register(r'rol', views.Rolview, 'rol')
router.register(r'usuario', views.Usuarioview, 'usuario')
router.register(r'producto', views.ProductoView, 'producto')
router.register(r'pedido', views.PedidoView, 'pedido')
router.register(r'pedido_detalle', views.PedidoProductoView, 'pedido_detalle')
router.register(r'categoria', views.CategoriaView, 'categoria')
router.register(r'proveedores', views.ProveedorView, 'proveedores')
router.register(r'inventario', views.InventarioView, 'inventario')

urlpatterns = [
    path('api/', include(router.urls)),
]


from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views


router = DefaultRouter()
router.register(r'rol', views.Rolview, 'rol')
router.register(r'usuario', views.Usuarioview, 'usuario')
router.register(r'producto', views.ProductoView, 'producto')
router.register(r'pedido', views.PedidoView, 'pedido')
router.register(r'pedido_detalle', views.PedidoProductoView, 'pedido_detalle')
router.register(r'categoria', views.CategoriaViewSet, 'categoria')
router.register(r'proveedores', views.ProveedorView, 'proveedores')
router.register(r'inventario', views.InventarioView, 'inventario')
router.register(r'carrito', views.CarritoView, 'carrito')
router.register(r'carrito-item', views.CarritoItemView, 'carrito-item')
router.register(r'estado-carrito', views.EstadoCarritoView, 'estado-carrito')
router.register(r'subcategoria', views.SubcategoriaViewSet, 'subcategoria')

urlpatterns = [
    path('api/', include(router.urls)),
    path('', include(router.urls)),
]


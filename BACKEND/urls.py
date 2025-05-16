from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import login_usuario
from .views import ProveedorViewSet


router = DefaultRouter()
router.register(r'rol', views.Rolview, 'rol')
router.register(r'usuario', views.Usuarioview, 'usuario')
router.register(r'producto', views.ProductoView, 'producto')
router.register(r'pedido', views.PedidoView, 'pedido')
router.register(r'pedido_detalle', views.PedidoProductoView, 'pedido_detalle')
router.register(r'categoria', views.CategoriaView, 'categoria')
router.register(r'proveedores', ProveedorViewSet, 'proveedores')
router.register(r'inventario', views.InventarioView, 'inventario')


urlpatterns = [
    path('api/', include(router.urls)),
    path('api/usuario/login/', login_usuario),
]

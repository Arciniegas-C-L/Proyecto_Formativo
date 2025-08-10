from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)


from . import views


router = DefaultRouter()
router.register(r'rol', views.Rolview, 'rol')
router.register(r'usuario', views.UsuarioViewSet, 'usuario')
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
router.register(r'talla', views.TallaViewSet, 'talla')
router.register(r'grupo-talla', views.GrupoTallaViewSet, 'grupo-talla')

urlpatterns = [
    path('api/', include(router.urls)),
    path('', include(router.urls)),
    path('api/usuario/login/', views.UsuarioViewSet.as_view({'get': 'login', 'post': 'login'}), name='usuario_login'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),  # Login
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),  # Refrescar token
]

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)


from . import views


router = DefaultRouter()
router.register(r'rol', views.Rolview, 'rol')
router.register(r'direccion', views.DireccionViewSet, basename='direccion')
router.register(r'usuario', views.UsuarioViewSet, basename='usuario')
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
router.register(r'facturas', views.FacturaView, 'facturas')
router.register(r'pedidoproductos', views.PedidoProductoView, basename='pedidoproducto')

urlpatterns = [
    path('api/', include(router.urls)),
    path('usuario/registro/', views.UsuarioViewSet.as_view({'post': 'register'}), name='usuario_register'),
    path('usuario/guest/', views.UsuarioViewSet.as_view({'post': 'guest'}), name='usuario_guest'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),  # Login
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),  # Refrescar token
]

urlpatterns += [
    path('', include(router.urls)),
    path('BACKEND/api/usuario/recuperar_password/', views.UsuarioViewSet.as_view({'post': 'recuperar_password'}), name='recuperar_password'),
    path('BACKEND/api/usuario/verificar_codigo/', views.UsuarioViewSet.as_view({'post': 'verificar_codigo'}), name='verificar_codigo'),
    path('BACKEND/api/usuario/reset_password/', views.UsuarioViewSet.as_view({'post': 'reset_password'}), name='reset_password'),
]

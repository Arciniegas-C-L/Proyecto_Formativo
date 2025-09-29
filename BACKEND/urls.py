# urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views
from BACKEND.views import send_low_stock_digest

public_router = DefaultRouter()
public_router.register(r'producto', views.ProductoView, basename='producto')
public_router.register(r'categoria', views.CategoriaViewSet, basename='categoria')
public_router.register(r'subcategoria', views.SubcategoriaViewSet, basename='subcategoria')
public_router.register(r'talla', views.TallaViewSet, basename='talla')
public_router.register(r'grupo-talla', views.GrupoTallaViewSet, basename='grupo-talla')
public_router.register(r'comentarios', views.ComentarioViewSet, basename='comentario')
public_router.register(r'carrito', views.CarritoView, basename='carrito')  # si permites anónimo
public_router.register(r'usuario', views.UsuarioViewSet, basename='usuario')

protected_router = DefaultRouter()
protected_router.register(r'rol', views.Rolview, basename='rol')
protected_router.register(r'direccion', views.DireccionViewSet, basename='direccion')
protected_router.register(r'usuario', views.UsuarioViewSet, basename='usuario')
protected_router.register(r'producto', views.ProductoView, basename='producto')
protected_router.register(r'pedido', views.PedidoView, basename='pedido')
protected_router.register(r'pedido_detalle', views.PedidoProductoView, basename='pedido_detalle')
protected_router.register(r'categoria', views.CategoriaViewSet, basename='categoria')
protected_router.register(r'proveedores', views.ProveedorView, basename='proveedores')
protected_router.register(r'inventario', views.InventarioView, basename='inventario')
protected_router.register(r'carrito', views.CarritoView, basename='carrito')
protected_router.register(r'carrito-item', views.CarritoItemView, basename='carrito-item')
protected_router.register(r'estado-carrito', views.EstadoCarritoView, basename='estado-carrito')
protected_router.register(r'subcategoria', views.SubcategoriaViewSet, basename='subcategoria')
protected_router.register(r'talla', views.TallaViewSet, basename='talla')
protected_router.register(r'grupo-talla', views.GrupoTallaViewSet, basename='grupo-talla')
protected_router.register(r'facturas', views.FacturaView, basename='facturas')
protected_router.register(r'pedidoproductos', views.PedidoProductoView, basename='pedidoproducto')
protected_router.register(r'comentarios', views.ComentarioViewSet, basename='comentario')
protected_router.register(r'reportes/ventas/rango',views.SalesRangeReportViewSet,basename='sales-range-report')


urlpatterns = [
    # Público bajo /BACKEND/  (coincide con tu VITE_API_URL_PUBLIC)
    path('', include(public_router.urls)),

    # Protegido bajo /BACKEND/api/ (coincide con tu VITE_API_URL_PROTECTED)
    path('api/', include(protected_router.urls)),

    # JWT
    path('BACKEND/api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('BACKEND/api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    #Email de alerta
    path('stock/send-digest/', send_low_stock_digest, name='send_low_stock_digest'),
]

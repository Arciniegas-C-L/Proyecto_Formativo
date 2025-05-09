from rest_framework import viewsets
from .serializer import RolSerializer, UsuarioSerializer, ProveedorSerializer, CategoriaSerializer, ProductoSerializer, InventarioSerializer, MovimientoSerializer, PedidoSerializer, PedidoProductoSerializer, PagoSerializer, TipoPagoSerializer
from .models import Rol, Usuario, Proveedor, Categoria, Producto, Inventario, Movimiento, Pedido, PedidoProducto, Pago, TipoPago

# Create your views here.

class Rolview(viewsets.ModelViewSet):
    serializer_class = RolSerializer
    queryset = Rol.objects.all()
    

class Usuarioview(viewsets.ModelViewSet):
    serializer_class = UsuarioSerializer
    queryset = Usuario.objects.all()
    
class ProveedorView(viewsets.ModelViewSet):
    serializer_class = ProveedorSerializer
    queryset = Proveedor.objects.all()
    
class CategoriaView(viewsets.ModelViewSet):
    serializer_class = CategoriaSerializer
    queryset = Categoria.objects.all()
    
class ProductoView(viewsets.ModelViewSet):
    serializer_class = ProductoSerializer
    queryset = Producto.objects.all()
    
class InventarioView(viewsets.ModelViewSet):
    serializer_class = InventarioSerializer
    queryset = Inventario.objects.all()
    
class MovimientoView(viewsets.ModelViewSet):
    serializer_class = MovimientoSerializer
    queryset = Movimiento.objects.all()
    
class PedidoView(viewsets.ModelViewSet):
    serializer_class = PedidoSerializer
    queryset = Pedido.objects.all()
    
class PedidoProductoView(viewsets.ModelViewSet):
    serializer_class = PedidoProductoSerializer
    queryset = PedidoProducto.objects.all()
    
class PagoView(viewsets.ModelViewSet):
    serializer_class = PagoSerializer
    queryset = Pago.objects.all()
    
class TipoPagoView(viewsets.ModelViewSet):
    serializer_class = TipoPagoSerializer
    queryset = TipoPago.objects.all()
    
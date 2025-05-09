from rest_framework import serializers
from .models import Rol, Usuario, Proveedor, Categoria, Producto, Inventario, Movimiento, Pedido, PedidoProducto, Pago, TipoPago

class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rol
        fields = '__all__'
        
class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['idUsuario', 'nombre', 'apellido', 'correo', 'contrasena', 'telefono', 'rol']
        extra_kwargs = {'rol': {'required': False}}  # Hacemos que 'rol' sea opcional

    def create(self, validated_data):
        from .models import Rol
        rol_cliente, _ = Rol.objects.get_or_create(nombre='Cliente')  # Busca o crea el rol "Cliente"
        validated_data['rol'] = rol_cliente
        return super().create(validated_data)

class ProveedorSerializer(serializers.ModelSerializer):
    usuario = UsuarioSerializer()  # Información del usuario relacionada con el proveedor

    class Meta:
        model = Proveedor
        fields = ['idProveedor', 'nombre', 'contacto', 'estado', 'usuario']

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ['idCategoria', 'nombre', 'estado']

class ProductoSerializer(serializers.ModelSerializer):
    categoria = CategoriaSerializer()  # Información de la categoría relacionada con el producto

    class Meta:
        model = Producto
        fields = ['idProducto', 'nombre', 'descripcion', 'precio', 'imagen', 'categoria']

class InventarioSerializer(serializers.ModelSerializer):
    producto = ProductoSerializer()  # Información del producto relacionado con el inventario

    class Meta:
        model = Inventario
        fields = ['idInventario', 'cantidad', 'fechaRegistro', 'stockMinimo', 'producto']

class MovimientoSerializer(serializers.ModelSerializer):
    inventario = InventarioSerializer()  # Información del inventario relacionado con el movimiento

    class Meta:
        model = Movimiento
        fields = ['idmovimiento', 'tipo', 'cantidad', 'fecha', 'inventario']

class PedidoSerializer(serializers.ModelSerializer):
    usuario = UsuarioSerializer()  # Información del usuario relacionada con el pedido

    class Meta:
        model = Pedido
        fields = ['idPedido', 'total', 'estado', 'usuario']

class PedidoProductoSerializer(serializers.ModelSerializer):
    pedido = PedidoSerializer()  # Información del pedido relacionado
    producto = ProductoSerializer()  # Información del producto relacionado

    class Meta:
        model = PedidoProducto
        fields = ['pedido', 'producto']

class PagoSerializer(serializers.ModelSerializer):
    pedido = PedidoSerializer()  # Información del pedido relacionado con el pago

    class Meta:
        model = Pago
        fields = ['idPago', 'total', 'fechaPago', 'pedido']

class TipoPagoSerializer(serializers.ModelSerializer):
    pago = PagoSerializer()  # Información del pago relacionado con el tipo de pago

    class Meta:
        model = TipoPago
        fields = ['idtipoPago', 'nombre', 'monto', 'pago']
from rest_framework import serializers
from .models import Rol, Usuario, Proveedor, Categoria, Producto, Inventario, Movimiento, Pedido, PedidoProducto, Pago, TipoPago

class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rol
        fields = '__all__'
        
class UsuarioSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = Usuario
        fields = ['idUsuario', 'nombre', 'apellido', 'correo', 'password', 'telefono']
    

    def create(self, validated_data):
        rol_cliente, _ = Rol.objects.get_or_create(nombre='Cliente')
        password = validated_data.pop('password')
        usuario = Usuario(**validated_data)
        usuario.rol = rol_cliente
        usuario.set_password(password)
        usuario.save()
        return usuario



class ProveedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proveedor
        fields = ['idProveedor', 'nombre', 'tipo', 'correo', 'telefono','estado',]

class CategoriaSerializer(serializers.ModelSerializer):
        model = Categoria
        fields = ['idCategoria', 'nombre', 'estado']

class ProductoSerializer(serializers.ModelSerializer):
    categoria = CategoriaSerializer()  #

    class Meta:
        model = Producto
        fields = ['idProducto', 'nombre', 'descripcion', 'precio', 'imagen', 'categoria']

class InventarioSerializer(serializers.ModelSerializer):
    producto = ProductoSerializer() 

    class Meta:
        model = Inventario
        fields = ['idProveedor', 'nombre', 'tipo', 'productos', 'correo', 'telefono', 'estado', 'usuario']

class MovimientoSerializer(serializers.ModelSerializer):
    inventario = InventarioSerializer()  

    class Meta:
        model = Movimiento
        fields = ['idmovimiento', 'tipo', 'cantidad', 'fecha', 'inventario']

class PedidoSerializer(serializers.ModelSerializer):
    usuario = UsuarioSerializer()  

    class Meta:
        model = Pedido
        fields = ['idPedido', 'total', 'estado', 'usuario']

class PedidoProductoSerializer(serializers.ModelSerializer):
    pedido = PedidoSerializer()  
    producto = ProductoSerializer()  

    class Meta:
        model = PedidoProducto
        fields = ['pedido', 'producto']

class PagoSerializer(serializers.ModelSerializer):
    pedido = PedidoSerializer() 

    class Meta:
        model = Pago
        fields = ['idPago', 'total', 'fechaPago', 'pedido']

class TipoPagoSerializer(serializers.ModelSerializer):
    pago = PagoSerializer()  

    class Meta:
        model = TipoPago
        fields = ['idtipoPago', 'nombre', 'monto', 'pago']
from rest_framework import serializers
from .models import Rol, Usuario, Proveedor, Categoria, Producto, Inventario, Movimiento, Pedido, PedidoProducto, Pago, TipoPago, Subcategoria, CarritoItem, EstadoCarrito, Carrito
from django.contrib.auth.models import User

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
    class Meta:
        model = Categoria
        fields = ['idCategoria', 'nombre', 'estado']

    def validate_nombre(self, value):
        if self.instance:
            if Categoria.objects.filter(nombre__iexact=value).exclude(pk=self.instance.pk).exists():
                raise serializers.ValidationError("Ya existe una categoría con este nombre.")
        else:
            if Categoria.objects.filter(nombre__iexact=value).exists():
                raise serializers.ValidationError("Ya existe una categoría con este nombre.")
        return value
    
class SubcategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subcategoria
        fields = '__all__'

class ProductoSerializer(serializers.ModelSerializer):
    # No ponemos categoria porque no existe en Producto
    subcategoria = serializers.PrimaryKeyRelatedField(queryset=Subcategoria.objects.all(), required=False, allow_null=True)
    subcategoria_nombre = serializers.CharField(source='subcategoria.nombre', read_only=True)
    
    # Si quieres mostrar el nombre de la categoría (a través de subcategoria)
    categoria_nombre = serializers.CharField(source='subcategoria.categoria.nombre', read_only=True)

    class Meta:
        model = Producto
        fields = '__all__'
        read_only_fields = ['id']  # Cambiar idProducto por id si usas el id por defecto

    def validate_precio(self, value):
        if value <= 0:
            raise serializers.ValidationError("El precio debe ser mayor a 0")
        return value

    def validate_stock(self, value):
        if value < 0:
            raise serializers.ValidationError("El stock no puede ser negativo")
        return value


class InventarioSerializer(serializers.ModelSerializer):
    producto = ProductoSerializer(read_only=True)  # Solo lectura para mostrar detalles del producto
    producto_id = serializers.PrimaryKeyRelatedField(
        queryset=Producto.objects.all(),
        source='producto',
        write_only=True
    )

    class Meta:
        model = Inventario
        fields = ['idInventario', 'cantidad', 'fechaRegistro', 'stockMinimo', 'producto', 'producto_id']
        read_only_fields = ['fechaRegistro']

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
class ProductoSerializer(serializers.ModelSerializer):
    categoria = serializers.ReadOnlyField(source='subcategoria.categoria.idCategoria')  # campo solo lectura para mostrar categoría
    categoria_nombre = serializers.ReadOnlyField(source='subcategoria.categoria.nombre')  # opcional, para mostrar nombre también

    subcategoria = serializers.PrimaryKeyRelatedField(queryset=Subcategoria.objects.all(), required=True)

    class Meta:
        model = Producto
        fields = ['id', 'nombre', 'descripcion', 'precio', 'stock', 'subcategoria', 'imagen', 'categoria', 'categoria_nombre']

    def validate(self, data):
        subcategoria = data.get('subcategoria') or getattr(self.instance, 'subcategoria', None)

        if not subcategoria:
            raise serializers.ValidationError("La subcategoría es obligatoria.")
        return data
class CarritoItemSerializer(serializers.ModelSerializer):
    producto = ProductoSerializer(read_only=True)  # Solo lectura para mostrar detalles del producto
    producto_id = serializers.PrimaryKeyRelatedField(
        queryset=Producto.objects.all(),
        source='producto',
        write_only=True
    )

    class Meta:
        model = CarritoItem
        fields = [
            'idCarritoItem',
            'producto',
            'producto_id',
            'cantidad',
            'precio_unitario',
            'subtotal',
            'fechaAgregado'
        ]
        read_only_fields = ['precio_unitario', 'subtotal', 'fechaAgregado']

class EstadoCarritoSerializer(serializers.ModelSerializer):
    class Meta:
        model = EstadoCarrito
        fields = ['idEstado', 'estado', 'fechaCambio', 'observacion']
        read_only_fields = ['fechaCambio']

class CarritoSerializer(serializers.ModelSerializer):
    items = serializers.SerializerMethodField()
    estado_actual = serializers.SerializerMethodField()
    total = serializers.SerializerMethodField()

    class Meta:
        model = Carrito
        fields = [
            'idCarrito',
            'usuario',
            'fechaCreacion',
            'fechaActualizacion',
            'estado',
            'items',
            'estado_actual',
            'total'
        ]
        read_only_fields = ['fechaCreacion', 'fechaActualizacion']

    def get_items(self, obj):
        items = obj.items.select_related('producto').all()
        return CarritoItemSerializer(items, many=True).data

    def get_estado_actual(self, obj):
        estado = obj.estadocarrito_set.first()
        if estado:
            return EstadoCarritoSerializer(estado).data
        return None

    def get_total(self, obj):
        return obj.calcular_total()

class CarritoCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Carrito
        fields = ['usuario']  # El usuario es opcional

    def create(self, validated_data):
        carrito = Carrito.objects.create(**validated_data)
        # Crear el estado inicial del carrito
        EstadoCarrito.objects.create(
            carrito=carrito,
            estado='activo',
            observacion='Carrito creado'
        )
        return carrito

class CarritoItemCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CarritoItem
        fields = ['carrito', 'producto', 'cantidad']

    def validate(self, data):
        # Validar que la cantidad sea positiva
        if data['cantidad'] <= 0:
            raise serializers.ValidationError("La cantidad debe ser mayor a 0")
        
        # Validar que haya suficiente stock
        producto = data['producto']
        inventario = Inventario.objects.filter(producto=producto).first()
        
        # Si no hay registro de inventario, asumimos que hay stock disponible
        if not inventario:
            return data
            
        # Si hay registro de inventario, validamos el stock
        # Verificar si ya existe el producto en el carrito
        carrito_item_existente = CarritoItem.objects.filter(
            carrito=data['carrito'],
            producto=producto
        ).first()
        
        cantidad_total = data['cantidad']
        if carrito_item_existente:
            cantidad_total += carrito_item_existente.cantidad
            
        if cantidad_total > inventario.cantidad:
            raise serializers.ValidationError(
                f"No hay suficiente stock disponible. Stock actual: {inventario.cantidad}, " +
                f"Cantidad en carrito: {carrito_item_existente.cantidad if carrito_item_existente else 0}, " +
                f"Cantidad solicitada: {data['cantidad']}"
            )
        
        return data

    def create(self, validated_data):
        try:
            # Intentar obtener el item existente
            carrito_item = CarritoItem.objects.filter(
                carrito=validated_data['carrito'],
                producto=validated_data['producto']
            ).first()
            
            if carrito_item:
                # Si existe, actualizar la cantidad
                carrito_item.cantidad += validated_data['cantidad']
                carrito_item.save()
                return carrito_item
            else:
                # Si no existe, crear uno nuevo
                return CarritoItem.objects.create(**validated_data)
                
        except Exception as e:
            raise serializers.ValidationError(f"Error al agregar el producto al carrito: {str(e)}")

class CarritoUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Carrito
        fields = ['estado']

    def update(self, instance, validated_data):
        # Actualizar el estado del carrito
        instance.estado = validated_data.get('estado', instance.estado)
        instance.save()
        
        # Crear un nuevo registro de estado
        EstadoCarrito.objects.create(
            carrito=instance,
            estado='pendiente' if not instance.estado else 'activo',
            observacion='Estado actualizado'
        )
        
        return instance

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['id', 'username', 'email', 'role']
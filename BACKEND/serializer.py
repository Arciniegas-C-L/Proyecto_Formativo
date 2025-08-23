from rest_framework import serializers
from .models import (
    Rol, Usuario, Proveedor, Categoria, Producto, Inventario, Movimiento, 
    Pedido, PedidoProducto, Pago, TipoPago, Subcategoria, CarritoItem, 
    EstadoCarrito, Carrito, Talla, GrupoTalla
)
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rol
        fields = '__all__'

class UsuarioSerializer(serializers.ModelSerializer):
    rol_nombre = serializers.CharField(source='rol.nombre', read_only=True)
    

    class Meta:
        model = Usuario
        fields = ['idUsuario', 'nombre', 'apellido', 'correo', 'telefono', 'estado', 'rol_nombre']


class LoginSerializer(serializers.Serializer):
    correo = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        correo = data.get('correo')
        password = data.get('password')

        if correo and password:
            user = authenticate(request=self.context.get('request'), username=correo, password=password)

            if not user:
                raise serializers.ValidationError("Credenciales inválidas", code='authorization')
        else:
            raise serializers.ValidationError("Debe incluir correo y contraseña", code='authorization')

        data['user'] = user
        return data
    
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        correo = attrs.get("correo")
        password = attrs.get("password")

        try:
            usuario = Usuario.objects.get(correo=correo)
        except Usuario.DoesNotExist:
            raise serializers.ValidationError("Correo o contraseña inválidos")

        if not usuario.check_password(password):
            raise serializers.ValidationError("Correo o contraseña inválidos")

        if not usuario.is_active:
            raise serializers.ValidationError("Usuario inactivo")

        # Esto obtiene los tokens
        data = super().validate({
            "username": usuario.correo,  
            "password": password
        })

        # Añadimos datos extra para el frontend
        data['usuario'] = {
            "id": usuario.id,
            "nombre": usuario.nombre,
            "apellido": usuario.apellido,
            "correo": usuario.correo,
            "rol": usuario.rol.nombre if usuario.rol else None
        }

        return data

    def to_internal_value(self, data):
        return {
            'correo': data.get('correo'),
            'password': data.get('password')
        }
    
class UsuarioRegistroSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    rol = serializers.PrimaryKeyRelatedField(queryset=Rol.objects.all())  # recibe el ID del rol

    class Meta:
        model = Usuario
        fields = ['nombre', 'apellido', 'correo', 'password', 'rol']

    def validate_correo(self, value):
        if Usuario.objects.filter(correo=value).exists():
            raise serializers.ValidationError("El correo ya está registrado.")
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        usuario = Usuario(**validated_data)
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
    categoria_nombre = serializers.CharField(source='categoria.nombre', read_only=True)
    grupo_talla_nombre = serializers.CharField(source='grupoTalla.nombre', read_only=True)
    tallas_disponibles = serializers.SerializerMethodField()

    class Meta:
        model = Subcategoria
        fields = [
            'idSubcategoria',
            'nombre',
            'estado',
            'categoria',
            'categoria_nombre',
            'stockMinimo',
            'grupoTalla',
            'grupo_talla_nombre',
            'tallas_disponibles'
        ]

    def get_tallas_disponibles(self, obj):
        if obj.grupoTalla:
            return [talla.nombre for talla in obj.grupoTalla.tallas.filter(estado=True)]
        return []

    def validate_stockMinimo(self, value):
        if value < 0:
            raise serializers.ValidationError("El stock mínimo no puede ser negativo")
        return value

class GrupoTallaSerializer(serializers.ModelSerializer):
    tallas = serializers.SerializerMethodField()

    class Meta:
        model = GrupoTalla
        fields = ['idGrupoTalla', 'nombre', 'descripcion', 'estado', 'tallas']

    def get_tallas(self, obj):
        tallas = obj.tallas.filter(estado=True)
        return [{
            'id': talla.id,
            'nombre': talla.nombre,
            'estado': talla.estado
        } for talla in tallas]

    def validate_nombre(self, value):
        if self.instance:
            if GrupoTalla.objects.filter(nombre__iexact=value).exclude(pk=self.instance.pk).exists():
                raise serializers.ValidationError("Ya existe un grupo de tallas con este nombre.")
        else:
            if GrupoTalla.objects.filter(nombre__iexact=value).exists():
                raise serializers.ValidationError("Ya existe un grupo de tallas con este nombre.")
        return value

class TallaSerializer(serializers.ModelSerializer):
    grupo = GrupoTallaSerializer(read_only=True)
    grupo_id = serializers.PrimaryKeyRelatedField(
        queryset=GrupoTalla.objects.all(),
        source='grupo',
        write_only=True
    )

    class Meta:
        model = Talla
        fields = ['id', 'nombre', 'grupo', 'grupo_id', 'estado']

    def validate(self, data):
        grupo = data.get('grupo')
        nombre = data.get('nombre')
        
        if self.instance:
            # Si estamos actualizando, excluimos la instancia actual
            if Talla.objects.filter(grupo=grupo, nombre__iexact=nombre).exclude(pk=self.instance.pk).exists():
                raise serializers.ValidationError(
                    f"Ya existe una talla con el nombre '{nombre}' en este grupo."
                )
        else:
            # Si estamos creando
            if Talla.objects.filter(grupo=grupo, nombre__iexact=nombre).exists():
                raise serializers.ValidationError(
                    f"Ya existe una talla con el nombre '{nombre}' en este grupo."
                )
        
        return data

class ProductoSerializer(serializers.ModelSerializer):
    subcategoria = serializers.PrimaryKeyRelatedField(queryset=Subcategoria.objects.all())
    subcategoria_nombre = serializers.CharField(source='subcategoria.nombre', read_only=True)
    categoria_nombre = serializers.CharField(source='subcategoria.categoria.nombre', read_only=True)
    inventario_tallas = serializers.SerializerMethodField()

    class Meta:
        model = Producto
        fields = [
            'id', 
            'nombre', 
            'descripcion', 
            'precio', 
            'stock', 
            'subcategoria', 
            'subcategoria_nombre',
            'categoria_nombre',
            'imagen',
            'inventario_tallas'
        ]

    def get_inventario_tallas(self, obj):
        inventarios = Inventario.objects.filter(producto=obj).select_related('talla')
        return [{
            'talla': inventario.talla.nombre,
            'stock': inventario.stock_talla
        } for inventario in inventarios]

    def validate_precio(self, value):
        if value <= 0:
            raise serializers.ValidationError("El precio debe ser mayor a 0")
        return value

    def validate_stock(self, value):
        if value < 0:
            raise serializers.ValidationError("El stock no puede ser negativo")
        return value


class InventarioSerializer(serializers.ModelSerializer):
    producto = ProductoSerializer(read_only=True)
    producto_id = serializers.PrimaryKeyRelatedField(
        queryset=Producto.objects.all(),
        source='producto',
        write_only=True
    )
    talla = TallaSerializer(read_only=True)
    talla_id = serializers.PrimaryKeyRelatedField(
        queryset=Talla.objects.filter(estado=True),
        source='talla',
        write_only=True
    )
    categoria = serializers.SerializerMethodField()
    subcategoria = serializers.SerializerMethodField()

    class Meta:
        model = Inventario
        fields = [
            'idInventario', 
            'cantidad', 
            'fechaRegistro', 
            'stockMinimo', 
            'producto', 
            'producto_id',
            'talla',
            'talla_id',
            'stock_talla',
            'categoria',
            'subcategoria'
        ]
        read_only_fields = ['fechaRegistro']

    def get_categoria(self, obj):
        return {
            'id': obj.producto.subcategoria.categoria.idCategoria,
            'nombre': obj.producto.subcategoria.categoria.nombre,
            'estado': obj.producto.subcategoria.categoria.estado
        }

    def get_subcategoria(self, obj):
        return {
            'id': obj.producto.subcategoria.idSubcategoria,
            'nombre': obj.producto.subcategoria.nombre,
            'estado': obj.producto.subcategoria.estado,
            'stockMinimo': obj.producto.subcategoria.stockMinimo
        }

    def validate(self, data):
        # Validar que no exista ya un inventario con el mismo producto y talla
        producto = data.get('producto')
        talla = data.get('talla')
        
        if self.instance:
            # Si estamos actualizando, excluimos la instancia actual
            if Inventario.objects.filter(producto=producto, talla=talla).exclude(pk=self.instance.pk).exists():
                raise serializers.ValidationError("Ya existe un inventario para este producto y talla.")
        else:
            # Si estamos creando
            if Inventario.objects.filter(producto=producto, talla=talla).exists():
                raise serializers.ValidationError("Ya existe un inventario para este producto y talla.")
        
        return data

class InventarioAgrupadoSerializer(serializers.Serializer):
    categoria = serializers.SerializerMethodField()
    subcategorias = serializers.SerializerMethodField()

    def get_categoria(self, obj):
        return {
            'id': obj['categoria__idCategoria'],
            'nombre': obj['categoria__nombre'],
            'estado': obj['categoria__estado']
        }

    def get_subcategorias(self, obj):
        subcategorias = Inventario.objects.filter(
            producto__subcategoria__categoria__idCategoria=obj['categoria__idCategoria']
        ).values(
            'producto__subcategoria__idSubcategoria',
            'producto__subcategoria__nombre',
            'producto__subcategoria__estado',
            'producto__subcategoria__stockMinimo'
        ).distinct()

        subcategorias_data = []
        for subcat in subcategorias:
            productos = Inventario.objects.filter(
                producto__subcategoria__idSubcategoria=subcat['producto__subcategoria__idSubcategoria']
            ).select_related(
                'producto',
                'talla',
                'producto__subcategoria',
                'producto__subcategoria__categoria'
            )

            subcategorias_data.append({
                'id': subcat['producto__subcategoria__idSubcategoria'],
                'nombre': subcat['producto__subcategoria__nombre'],
                'estado': subcat['producto__subcategoria__estado'],
                'stockMinimo': subcat['producto__subcategoria__stockMinimo'],
                'productos': InventarioSerializer(productos, many=True).data
            })

        return subcategorias_data

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
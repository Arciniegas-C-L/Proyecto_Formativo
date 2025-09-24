from .models import Comentario
from decimal import Decimal, ROUND_HALF_UP, InvalidOperation
from rest_framework import serializers
from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

# Importa modelos de forma explícita (¡nada de import *!)
from .models import (
    # usuarios / roles / direcciones
    Usuario, Rol, Direccion,

    # catálogo / stock
    Proveedor, Categoria, Subcategoria, GrupoTalla, Talla,
    Producto, Inventario, Movimiento,

    # pedidos / pagos
    Pedido, PedidoProducto, Pago, TipoPago,

    # carrito
    Carrito, CarritoItem, EstadoCarrito,

    # facturación
    Factura, FacturaItem, PedidoItem,
    SalesRangeReport,
    SalesRangeReportItem,
    Notificacion,
    StockAlertActivo,
)


from django.db.models import Q   # <-- IMPORTANTE
from django.contrib.auth import authenticate
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


# Serializer para Comentario
class ComentarioSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(read_only=True)
    usuario_apellido = serializers.CharField(read_only=True)
    usuario_avatar_seed = serializers.CharField(read_only=True)
    usuario_avatar_options = serializers.JSONField(read_only=True)

    class Meta:
        model = Comentario
        fields = ['id', 'usuario', 'usuario_nombre', 'usuario_apellido', 'usuario_avatar_seed', 'usuario_avatar_options', 'texto', 'valoracion', 'fecha']
        read_only_fields = ['usuario']

# Serializer para Direccion
class DireccionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Direccion
        fields = ['id', 'direccion']

class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rol
        fields = '__all__'


class UsuarioSerializer(serializers.ModelSerializer):
    rol = serializers.PrimaryKeyRelatedField(queryset=Rol.objects.all(), required=False, allow_null=True)
    rol_nombre = serializers.CharField(source='rol.nombre', read_only=True)
    avatar_seed = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    avatar_options = serializers.JSONField(required=False, allow_null=True)
    direccion = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    telefono = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = Usuario
        fields = [
            'idUsuario', 'nombre', 'apellido', 'correo', 'telefono', 'direccion', 'estado',
            'rol', 'rol_nombre', 'avatar_seed', 'avatar_options'
        ]

    def update(self, instance, validated_data):
        # Si avatar_seed o avatar_options llegan como string vacío, guárdalos como None
        avatar_seed = validated_data.get('avatar_seed', None)
        if avatar_seed == '':
            validated_data['avatar_seed'] = None
        avatar_options = validated_data.get('avatar_options', None)
        if avatar_options == '' or avatar_options is None:
            validated_data['avatar_options'] = None
        return super().update(instance, validated_data)
    
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
        extra_kwargs = {
            'stockMinimo': {'required': False, 'default': 0}
        }

    def get_tallas_disponibles(self, obj):
        if obj.grupoTalla:
            return [talla.nombre for talla in obj.grupoTalla.tallas.filter(estado=True)]
        return []

    def validate_stockMinimo(self, value):
        if value is None:
            return 0
        if value < 0:
            raise serializers.ValidationError("El stock mínimo no puede ser negativo")
        return value

    def validate_categoria(self, value):
        if not value:
            raise serializers.ValidationError("La categoría es requerida")
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
            'idTalla': inventario.talla.id,
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

class ProductoMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Producto
        fields = ("id", "nombre", "precio", "imagen")

class PedidoItemSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)
    talla_nombre    = serializers.CharField(source='talla.nombre', read_only=True)
    # opcional: ayuda mucho al front
    producto_data   = ProductoMiniSerializer(source='producto', read_only=True)

    class Meta:
        model = PedidoItem
        fields = [
            'id', 'producto', 'producto_nombre', 'producto_data',
            'talla', 'talla_nombre', 'cantidad', 'precio', 'subtotal'
        ]

    def validate(self, attrs):
        cantidad = attrs.get('cantidad') or 1
        precio   = attrs.get('precio')
        subtotal = attrs.get('subtotal')

        if precio is None:
            raise serializers.ValidationError("El campo 'precio' es obligatorio.")

        # Usa Decimal para comparar a 2 decimales
        calc = (Decimal(cantidad) * Decimal(precio)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        if subtotal is None:
            attrs['subtotal'] = calc
        else:
            sub_q = Decimal(subtotal).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
            if sub_q != calc:
                raise serializers.ValidationError("El 'subtotal' no coincide con cantidad * precio.")
        return attrs


# serializers.py
class PedidoSerializer(serializers.ModelSerializer):
    usuario_nombre   = serializers.CharField(source='usuario.nombre', read_only=True)
    usuario_apellido = serializers.CharField(source='usuario.apellido', read_only=True)  # opcional
    usuario_email    = serializers.EmailField(source='usuario.correo', read_only=True)
    items            = PedidoItemSerializer(many=True)

    # 🆕 Exponer snapshot de dirección (solo lectura)
    shipping_address     = serializers.JSONField(read_only=True)
    shipping_city        = serializers.CharField(read_only=True)
    shipping_department  = serializers.CharField(read_only=True)

    class Meta:
        model  = Pedido
        fields = [
            'idPedido', 'numero', 'total', 'estado', 'usuario',
            'usuario_nombre', 'usuario_apellido', 'usuario_email',
            'created_at', 'updated_at', 'items',
            # ⬇️ Nuevos campos de envío
            'shipping_address', 'shipping_city', 'shipping_department',
        ]
        read_only_fields = [
            'idPedido', 'total', 'created_at', 'updated_at',
            'shipping_address', 'shipping_city', 'shipping_department',
        ]

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        pedido = Pedido.objects.create(**validated_data)

        total = Decimal('0.00')
        objs = []
        for item in items_data:
            obj = PedidoItem(pedido=pedido, **item)
            objs.append(obj)
            total += Decimal(item['subtotal'])
        if objs:
            PedidoItem.objects.bulk_create(objs)

        pedido.total = total
        pedido.save(update_fields=['total'])
        return pedido

    @transaction.atomic
    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)

        for attr, val in validated_data.items():
            setattr(instance, attr, val)

        if items_data is not None:
            instance.items.all().delete()
            total = Decimal('0.00')
            objs = []
            for item in items_data:
                objs.append(PedidoItem(pedido=instance, **item))
                total += Decimal(item['subtotal'])
            if objs:
                PedidoItem.objects.bulk_create(objs)
            instance.total = total

        instance.save()
        return instance

    # 👇 Fallback SOLO para lectura:
    def to_representation(self, instance):
        data = super().to_representation(instance)

        # Normaliza shipping_address a {} en lugar de null para evitar chequeos en el front
        if data.get('shipping_address') is None:
            data['shipping_address'] = {}

        # Si no hay PedidoItem, armamos items mínimos desde PedidoProducto
        if not data.get('items'):
            pp_qs = (PedidoProducto.objects
                     .filter(pedido=instance)
                     .select_related('producto'))
            items = []
            for pp in pp_qs:
                precio = Decimal(str(getattr(pp.producto, 'precio', 0) or 0))
                items.append({
                    "id": f"pp-{pp.id}",          # id sintético
                    "producto": pp.producto_id,
                    "producto_nombre": pp.producto.nombre,
                    "producto_data": {            # útil para el front
                        "id": pp.producto_id,
                        "nombre": pp.producto.nombre,
                        "precio": str(precio),
                        "imagen": getattr(pp.producto, 'imagen', None),
                    },
                    "talla": None,
                    "talla_nombre": None,
                    "cantidad": 1,
                    "precio": str(precio),
                    "subtotal": str(precio),
                })
            data['items'] = items
        return data

class PedidoProductoSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)

    class Meta:
        model  = PedidoProducto
        fields = ['id', 'pedido', 'producto', 'producto_nombre']

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
    talla = TallaSerializer(read_only=True)

    class Meta:
        model = CarritoItem
        fields = [
            'idCarritoItem',
            'producto',
            'producto_id',
            'cantidad',
            'talla',
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
        fields = ['carrito', 'producto', 'cantidad', 'talla']

    def validate(self, data):
        # Validar que la cantidad sea positiva
        if data['cantidad'] <= 0:
            raise serializers.ValidationError("La cantidad debe ser mayor a 0")
        
        # Validar que haya suficiente stock
        producto = data['producto']
        talla = data.get('talla')
        
        # Buscar inventario por producto y talla
        if talla:
            inventario = Inventario.objects.filter(producto=producto, talla=talla).first()
        else:
            inventario = Inventario.objects.filter(producto=producto).first()
        
        # Si no hay registro de inventario, asumimos que hay stock disponible
        if not inventario:
            return data
            
        # Si hay registro de inventario, validamos el stock
        # Verificar si ya existe el producto en el carrito (con la misma talla si se especifica)
        filtro_existente = {
            'carrito': data['carrito'],
            'producto': producto
        }
        
        # Si se especifica talla, incluirla en el filtro
        if talla:
            filtro_existente['talla'] = talla
        
        carrito_item_existente = CarritoItem.objects.filter(**filtro_existente).first()
        
        cantidad_total = data['cantidad']
        if carrito_item_existente:
            cantidad_total += carrito_item_existente.cantidad
            
        # Usar stock_talla en lugar de cantidad
        stock_disponible = inventario.stock_talla if hasattr(inventario, 'stock_talla') else inventario.cantidad
        
        if cantidad_total > stock_disponible:
            raise serializers.ValidationError(
                f"No hay suficiente stock disponible. Stock actual: {stock_disponible}, " +
                f"Cantidad en carrito: {carrito_item_existente.cantidad if carrito_item_existente else 0}, " +
                f"Cantidad solicitada: {data['cantidad']}"
            )
        
        return data

    def create(self, validated_data):
        try:
            # Intentar obtener el item existente (con la misma talla si se especifica)
            filtro_existente = {
                'carrito': validated_data['carrito'],
                'producto': validated_data['producto']
            }
            
            # Si se especifica talla, incluirla en el filtro
            if validated_data.get('talla'):
                filtro_existente['talla'] = validated_data['talla']
            
            carrito_item = CarritoItem.objects.filter(**filtro_existente).first()
            
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

# ---------- Items de entrada (crear factura) ----------

class FacturaItemCreateSerializer(serializers.Serializer):
    producto_id = serializers.IntegerField()
    talla_id = serializers.IntegerField(required=False, allow_null=True)
    cantidad = serializers.IntegerField(min_value=1)
    precio = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)

    def validate(self, data):
        # Producto
        try:
            producto = Producto.objects.get(pk=data["producto_id"])
        except Producto.DoesNotExist:
            raise serializers.ValidationError({"producto_id": "Producto no existe."})

        # Precio por defecto: el del producto
        if "precio" not in data or data["precio"] is None:
            data["precio"] = Decimal(str(producto.precio))

        # Talla (opcional)
        talla = None
        talla_id = data.get("talla_id")
        if talla_id:
            try:
                talla = Talla.objects.get(pk=talla_id)
            except Talla.DoesNotExist:
                raise serializers.ValidationError({"talla_id": "Talla no existe."})

        # Inventario para (producto, talla)
        inv_qs = Inventario.objects.filter(producto=producto)
        inv_qs = inv_qs.filter(talla__isnull=True) if talla is None else inv_qs.filter(talla=talla)

        if not inv_qs.exists():
            raise serializers.ValidationError({"inventario": "No existe inventario para ese producto/talla."})

        # Guarda objetos resueltos para la fase de create()
        data["producto"] = producto
        data["talla"] = talla
        data["inventario_qs"] = inv_qs
        return data


class FacturaCreateSerializer(serializers.Serializer):
    # Cabecera
    numero = serializers.CharField(max_length=32)
    pedido_id = serializers.IntegerField()
    usuario_id = serializers.IntegerField()
    moneda = serializers.CharField(max_length=8, default="COP")
    metodo_pago = serializers.CharField(max_length=32, default="mercadopago")
    mp_payment_id = serializers.CharField(max_length=64, required=False, allow_blank=True)
    # ✅ nuevo (opcional, no rompe): si True NO descuenta stock
    skip_stock = serializers.BooleanField(required=False, default=False)

    # Detalle
    items = FacturaItemCreateSerializer(many=True)

    # ---- helpers seguros para stock (soporta stock_talla o cantidad) ----
    def _get_stock_value(self, inv):
        if hasattr(inv, "stock_talla"):
            return inv.stock_talla
        if hasattr(inv, "cantidad"):
            return inv.cantidad
        # Si el modelo tiene otro nombre de campo, ajusta aquí:
        raise serializers.ValidationError({"inventario": "Modelo Inventario no tiene campo de stock esperado."})

    def _set_stock_value(self, inv, value):
        if hasattr(inv, "stock_talla"):
            inv.stock_talla = value
            return
        if hasattr(inv, "cantidad"):
            inv.cantidad = value
            return
        raise serializers.ValidationError({"inventario": "Modelo Inventario no tiene campo de stock esperado."})

    def validate(self, data):
        if not data.get("items"):
            raise serializers.ValidationError({"items": "Debe enviar al menos un ítem."})

        # Pedido y usuario
        try:
            data["pedido"] = Pedido.objects.get(pk=data["pedido_id"])
        except Pedido.DoesNotExist:
            raise serializers.ValidationError({"pedido_id": "Pedido no existe."})

        try:
            data["usuario"] = Usuario.objects.get(pk=data["usuario_id"])
        except Usuario.DoesNotExist:
            raise serializers.ValidationError({"usuario_id": "Usuario no existe."})

        # Número de factura único
        if Factura.objects.filter(numero=data["numero"]).exists():
            raise serializers.ValidationError({"numero": "Ya existe una factura con ese número."})

        return data

    @transaction.atomic
    def create(self, validated):
        pedido = validated["pedido"]
        usuario = validated["usuario"]
        numero = validated["numero"]
        moneda = validated.get("moneda", "COP")
        metodo = validated.get("metodo_pago", "mercadopago")
        mp_id = validated.get("mp_payment_id", "")
        skip_stock = bool(validated.get("skip_stock", False))  # ✅

        # 1) Bloquear inventario de todos los (producto, talla)
        claves = {(it["producto"].pk, (it["talla"].pk if it["talla"] else None)) for it in validated["items"]}
        q = Q()
        for prod_id, talla_id in claves:
            if talla_id is None:
                q |= Q(producto_id=prod_id, talla_id__isnull=True)
            else:
                q |= Q(producto_id=prod_id, talla_id=talla_id)
        inv_bloq = Inventario.objects.select_for_update().filter(q) if q else Inventario.objects.none()
        inv_map = {(i.producto_id, i.talla_id): i for i in inv_bloq}

        # 2) Validar stock y acumular subtotal
        subtotal = Decimal("0.00")
        for it in validated["items"]:
            prod_id = it["producto"].pk
            talla_id = it["talla"].pk if it["talla"] else None
            cantidad = int(it["cantidad"])
            precio = Decimal(str(it["precio"]))

            inv = inv_map.get((prod_id, talla_id))
            if not inv:
                raise serializers.ValidationError({"inventario": "No existe inventario para ese producto/talla."})

            stock_actual = self._get_stock_value(inv)
            if not skip_stock:
                if stock_actual < cantidad:
                    nombre_prod = getattr(it["producto"], "nombre", f"Producto {prod_id}")
                    nombre_talla = getattr(it["talla"], "nombre", "") if it["talla"] else ""
                    msg = f"Stock insuficiente para {nombre_prod}"
                    if nombre_talla:
                        msg += f" - Talla {nombre_talla}"
                    msg += f". Disponible: {stock_actual}"
                    raise serializers.ValidationError({"inventario": msg})
                # Descontar en memoria solo si no se salta stock
                self._set_stock_value(inv, stock_actual - cantidad)

            subtotal += (precio * Decimal(cantidad))

        # 3) Guardar inventarios (solo si se descontó)
        if not skip_stock:
            for inv in inv_bloq:
                # guarda el campo correcto
                if hasattr(inv, "stock_talla"):
                    inv.save(update_fields=["stock_talla"])
                elif hasattr(inv, "cantidad"):
                    inv.save(update_fields=["cantidad"])
                else:
                    inv.save()

        # 4) Totales
        impuestos = Decimal("0.00")   # ajusta si manejas IVA
        total = subtotal + impuestos

        # 5) Crear factura
        factura = Factura.objects.create(
            numero=numero,
            pedido=pedido,
            usuario=usuario,
            subtotal=subtotal,
            impuestos=impuestos,
            total=total,
            moneda=moneda,
            metodo_pago=metodo,
            mp_payment_id=mp_id,
            emitida_en=timezone.now(),
            estado="emitida",
        )

        # 6) Crear ítems (ya lo tienes)
        items_bulk = []
        for it in validated["items"]:
            precio = Decimal(str(it["precio"]))
            cantidad = int(it["cantidad"])
            descripcion = (it["producto"].descripcion or getattr(it["producto"], "nombre", ""))[:255]
            items_bulk.append(FacturaItem(
                factura=factura,
                producto=it["producto"],
                descripcion=descripcion,
                cantidad=cantidad,
                precio=precio,
                subtotal=precio * Decimal(cantidad),
            ))
        FacturaItem.objects.bulk_create(items_bulk)

        # 6B) 🔁 SINCRONIZAR PedidoItem (lo que usa "Mis pedidos")
        # Dejamos las líneas del pedido exactamente como la factura
        from .models import PedidoItem
        pi_bulk = []
        PedidoItem.objects.filter(pedido=pedido).delete()
        for it in validated["items"]:
            precio = Decimal(str(it["precio"]))
            cantidad = int(it["cantidad"])
            pi_bulk.append(PedidoItem(
                pedido=pedido,
                producto=it["producto"],
                talla=it["talla"],          # puede ser None
                cantidad=cantidad,
                precio=precio,
                subtotal=precio * Decimal(cantidad),
            ))
        if pi_bulk:
            PedidoItem.objects.bulk_create(pi_bulk)

        # Alinear total del pedido con la factura
        pedido.total = total
        pedido.save(update_fields=["total"])

        return factura

class FacturaItemSerializer(serializers.ModelSerializer):
    # opcional y no rompe nada: nombre legible del producto
    producto_nombre = serializers.SerializerMethodField()

    class Meta:
        model = FacturaItem
        fields = ("id", "producto", "producto_nombre", "descripcion", "cantidad", "precio", "subtotal")
        read_only_fields = fields

    def get_producto_nombre(self, obj):
        p = getattr(obj, "producto", None)
        return getattr(p, "nombre", None) if p else None

class FacturaSerializer(serializers.ModelSerializer):
    items = serializers.SerializerMethodField()
    cliente_email = serializers.SerializerMethodField()
    fecha = serializers.SerializerMethodField()

    # 🆕 Snapshot de envío (solo lectura, vienen del pedido relacionado)
    shipping_address    = serializers.SerializerMethodField()
    shipping_city       = serializers.SerializerMethodField()
    shipping_department = serializers.SerializerMethodField()

    class Meta:
        model = Factura
        fields = (
            "id","numero","pedido","usuario",
            "subtotal","impuestos","total","moneda",
            "metodo_pago","mp_payment_id",
            "emitida_en","estado","items",
            "fecha",
            "cliente_email",
            # ⬇️ Nuevos campos
            "shipping_address","shipping_city","shipping_department",
        )
        read_only_fields = fields

    def get_items(self, obj):
        qs = getattr(obj, "items", None) or getattr(obj, "facturaitem_set", None)
        return FacturaItemSerializer(qs.all(), many=True).data if qs is not None else []

    def get_cliente_email(self, obj):
        u = getattr(obj, "usuario", None)
        if not u:
            return None

        possibles = [
            "email", "correo", "correo_electronico", "mail",
            "emailUsuario", "correoUsuario", "user_email"
        ]
        for attr in possibles:
            val = getattr(u, attr, None)
            if val:
                return str(val)

        try:
            text = str(u)
            if "@" in text:
                return text
        except Exception:
            pass
        return None

    def get_fecha(self, obj):
            dt = getattr(obj, "emitida_en", None) or getattr(obj, "created_at", None)
            if not dt:
                return None
            try:
                # dt llega en UTC si USE_TZ=True; la convertimos a Bogotá
                local_dt = timezone.localtime(dt, timezone.get_current_timezone())
                # ISO 8601 con offset, p.ej. 2025-09-22T12:57:00-05:00
                return local_dt.isoformat(timespec="minutes")
            except Exception:
                return str(dt)

    # 🆕 Extraer snapshot de envío desde el pedido asociado
    def get_shipping_address(self, obj):
        try:
            return getattr(obj.pedido, "shipping_address", {}) or {}
        except Exception:
            return {}

    def get_shipping_city(self, obj):
        try:
            return getattr(obj.pedido, "shipping_city", None)
        except Exception:
            return None

    def get_shipping_department(self, obj):
        try:
            return getattr(obj.pedido, "shipping_department", None)
        except Exception:
            return None


class PedidoProductoItemLiteSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)
    producto_imagen = serializers.SerializerMethodField()
    talla_nombre = serializers.CharField(source='talla.nombre', read_only=True, required=False)
    precio_unitario = serializers.SerializerMethodField()
    subtotal = serializers.SerializerMethodField()

    class Meta:
        model = PedidoProducto
        # Ajusta campos según tu modelo real (cantidad / precio pueden llamarse diferente)
        fields = [
            'id',              # id del item
            'producto',        # id del producto
            'producto_nombre',
            'producto_imagen',
            'talla',           # id talla (si existe en tu modelo)
            'talla_nombre',
            'cantidad',        # si no tienes campo, déjalo y calculamos subtotal con 1
            'precio_unitario',
            'subtotal',
        ]

    def get_producto_imagen(self, obj):
        img = getattr(getattr(obj, 'producto', None), 'imagen', None)
        # si usas ImageField:
        try:
            return img.url if img else None
        except Exception:
            return None

    def _precio_base(self, obj):
        # Si el modelo del item tiene precio, úsalo; si no, usa el del producto
        p = getattr(obj, 'precio', None)
        if p is not None:
            return p
        return getattr(getattr(obj, 'producto', None), 'precio', 0)

    def get_precio_unitario(self, obj):
        return self._precio_base(obj)

    def get_subtotal(self, obj):
        cant = getattr(obj, 'cantidad', 1) or 1
        return self._precio_base(obj) * cant


# --- NUEVO: Pedido con items embebidos ---
class PedidoConItemsSerializer(serializers.ModelSerializer):
    # Usamos la relación reversa por defecto: pedidoproducto_set
    items = PedidoProductoItemLiteSerializer(source='pedidoproducto_set', many=True, read_only=True)
    estado_label = serializers.SerializerMethodField()

    class Meta:
        model = Pedido
        # Agrega/ajusta más campos si los tienes (fecha, etc.)
        fields = ['idPedido', 'total', 'estado', 'estado_label', 'items', 'usuario']

    def get_estado_label(self, obj):
        return "Completado" if getattr(obj, 'estado', False) else "Pendiente"

class AddressSerializer(serializers.Serializer):
    nombre = serializers.CharField(max_length=120)
    telefono = serializers.CharField(max_length=50)
    departamento = serializers.CharField(max_length=120)
    ciudad = serializers.CharField(max_length=120)
    linea1 = serializers.CharField(max_length=255)
    linea2 = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    referencia = serializers.CharField(required=False, allow_blank=True, allow_null=True)

class CrearPreferenciaPagoSerializer(serializers.Serializer):
    email = serializers.EmailField()
    address = AddressSerializer()

# ─────────────────────────────────────────────────────────────
# Producto mínimo (anidado)
# ─────────────────────────────────────────────────────────────
class ProductoMinSerializer(serializers.ModelSerializer):
    class Meta:
        model = Producto
        fields = ("id", "nombre", "precio")
        read_only_fields = fields


# ─────────────────────────────────────────────────────────────
# Detalle por producto dentro del reporte
# ─────────────────────────────────────────────────────────────
class SalesRangeReportItemSerializer(serializers.ModelSerializer):
    producto   = ProductoMinSerializer(read_only=True)
    producto_id = serializers.IntegerField(source="producto.id", read_only=True)

    class Meta:
        model = SalesRangeReportItem
        fields = (
            "id",
            "reporte",
            "producto", "producto_id",
            "cantidad", "ingresos", "tickets",
        )
        read_only_fields = fields

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Normaliza decimales a string/number según prefieras
        # data["ingresos"] = str(data["ingresos"])
        return data


# ─────────────────────────────────────────────────────────────
# Cabecera del reporte: KPIs + top/bottom
# ─────────────────────────────────────────────────────────────
class SalesRangeReportSerializer(serializers.ModelSerializer):
    top = serializers.SerializerMethodField()
    bottom = serializers.SerializerMethodField()

    class Meta:
        model = SalesRangeReport
        fields = (
            "id",
            "fecha_inicio", "fecha_fin", "incluir_aprobados",
            "ventas_netas", "items_totales", "tickets",
            "top", "bottom",
            "generado_en",
        )
        read_only_fields = fields

    def get_top(self, obj):
        if not obj.top_producto:
            return None
        return {
            "producto": {
                "id": obj.top_producto.id,
                "nombre": obj.top_producto_nombre or obj.top_producto.nombre,
            },
            "cantidad": obj.top_cantidad,
        }

    def get_bottom(self, obj):
        if not obj.bottom_producto:
            return None
        return {
            "producto": {
                "id": obj.bottom_producto.id,
                "nombre": obj.bottom_producto_nombre or obj.bottom_producto.nombre,
            },
            "cantidad": obj.bottom_cantidad,
        }

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # ISO limpio
        data["fecha_inicio"] = instance.fecha_inicio.isoformat()
        data["fecha_fin"] = instance.fecha_fin.isoformat()
        data["generado_en"] = instance.generado_en.isoformat().replace("+00:00", "Z")
        return data


# ─────────────────────────────────────────────────────────────
# Entrada para generar reporte por rango
# ─────────────────────────────────────────────────────────────
class GenerarSalesRangeReportSerializer(serializers.Serializer):
    desde = serializers.DateField(help_text="Fecha inicio (inclusive) en formato YYYY-MM-DD")
    hasta = serializers.DateField(help_text="Fecha fin (inclusive o exclusiva; el backend normaliza a [desde, hasta))")
    solo_aprobados = serializers.BooleanField(required=False, default=True)

    def validate(self, attrs):
        d = attrs.get("desde")
        h = attrs.get("hasta")
        if d and h and d > h:
            # Permitimos invertir, pero advertimos; la view puede normalizar
            # Aquí solo devolvemos en orden si quieres:
            attrs["desde"], attrs["hasta"] = h, d
        return attrs
    
class NotificacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notificacion
        fields = [
            'id',
            'titulo',
            'mensaje',
            'tipo',
            'metadata',
            'creado_en',
            'leido_en',
            'resuelto'
        ]


class StockAlertActivoSerializer(serializers.ModelSerializer):
    producto = serializers.CharField(source='inventario.producto.nombre', read_only=True)
    talla = serializers.CharField(source='inventario.talla.nombre', read_only=True)
    class Meta:
        model = StockAlertActivo
        fields = [
            'id',
            'inventario',
            'producto',
            'talla',
            'tipo',
            'umbral',
            'cantidad',
            'creado_en'
        ]
# ----------------------------
# Comentarios de usuarios
# ----------------------------
from django.db import models
from rest_framework.exceptions import ValidationError
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager, Group, Permission
from django.utils import timezone
from datetime import timedelta
from django.db.models.signals import post_save
from django.dispatch import receiver

class Comentario(models.Model):

    usuario = models.ForeignKey('Usuario', on_delete=models.CASCADE, related_name='comentarios')
    texto = models.TextField()
    valoracion = models.PositiveSmallIntegerField(default=5)
    fecha = models.DateTimeField(auto_now_add=True)
    # Campos snapshot para mantener datos originales
    usuario_nombre = models.CharField(max_length=45, blank=True, null=True)
    usuario_apellido = models.CharField(max_length=45, blank=True, null=True)
    usuario_avatar_seed = models.CharField(max_length=32, blank=True, null=True)
    usuario_avatar_options = models.JSONField(blank=True, null=True)

    def __str__(self):
        return f"Comentario de {self.usuario.nombre} {self.usuario.apellido} - {self.valoracion} estrellas"



# ----------------------------
# Roles
# ----------------------------
class Rol(models.Model):
    idROL = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=45)

    def __str__(self):
        return self.nombre


# ----------------------------
# Usuarios y Manager
# ----------------------------
class UsuarioManager(BaseUserManager):

    def create_user(self, correo, nombre, apellido, password=None, **extra_fields):
        if not correo:
            raise ValueError("El correo es obligatorio")

        correo = self.normalize_email(correo)
        usuario = self.model(
            correo=correo,
            nombre=nombre,
            apellido=apellido,
            **extra_fields
        )
        usuario.set_password(password)
        usuario.save(using=self._db)
        return usuario

    def create_superuser(self, correo, nombre, apellido, password, **extra_fields):
        from BACKEND.models import Rol  # Importa aquí para evitar importaciones circulares

        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        # Asignar un rol automáticamente si no se proporcionó
        if 'rol' not in extra_fields or extra_fields['rol'] is None:
            try:
                rol_admin = Rol.objects.get(nombre='administrador')
            except Rol.DoesNotExist:
                rol_admin = Rol.objects.create(nombre='administrador')
            extra_fields['rol'] = rol_admin

        return self.create_user(correo, nombre, apellido, password, **extra_fields)


class Usuario(AbstractBaseUser, PermissionsMixin):
    avatar_seed = models.CharField(max_length=32, blank=True, null=True, help_text="Seed para el avatar personalizado")
    avatar_options = models.JSONField(blank=True, null=True, help_text="Opciones JSON del avatar personalizado")

    @property
    def rol_nombre(self):
        return self.rol.nombre if self.rol else None

    idUsuario = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=45)
    apellido = models.CharField(max_length=45)
    correo = models.EmailField(max_length=45, unique=True)
    telefono = models.CharField(max_length=15)
    direccion = models.CharField(max_length=255, blank=True, null=True)
    estado = models.BooleanField(default=True)

    rol = models.ForeignKey(Rol, on_delete=models.PROTECT)

    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(default=timezone.now)

    groups = models.ManyToManyField(
        Group,
        related_name='usuarios_set',
        blank=True,
        help_text='Los grupos a los que pertenece este usuario.',
        verbose_name='grupos'
    )
    user_permissions = models.ManyToManyField(
        Permission,
        related_name='usuarios_set_perm',
        blank=True,
        help_text='Permisos específicos para este usuario.',
        verbose_name='permisos de usuario'
    )

    USERNAME_FIELD = 'correo'
    REQUIRED_FIELDS = ['nombre', 'apellido']

    objects = UsuarioManager()

    def __str__(self):
        return f"{self.nombre} {self.apellido}"


# ----------------------------
# Direcciones de usuario
# ----------------------------
class Direccion(models.Model):
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='direcciones')
    direccion = models.CharField(max_length=255)

    from rest_framework.exceptions import ValidationError
    def save(self, *args, **kwargs):
        # Limitar a 3 direcciones por usuario
        if not self.pk and Direccion.objects.filter(usuario=self.usuario).count() >= 3:
            raise ValidationError({'detail': 'No puedes tener más de 3 direcciones.'})
        # No permitir direcciones duplicadas para el mismo usuario
        if Direccion.objects.filter(usuario=self.usuario, direccion=self.direccion).exclude(pk=self.pk).exists():
            raise ValidationError({'detail': 'Ya tienes una dirección igual registrada.'})
        # No permitir que la dirección sea igual a la de datos personales
        if self.usuario.direccion and self.direccion.strip() == self.usuario.direccion.strip():
            raise ValidationError({'detail': 'No puedes registrar una dirección igual a la de tus datos personales.'})
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.direccion} - {self.usuario.nombre} {self.usuario.apellido}"


# ----------------------------
# Código de recuperación
# ----------------------------
class CodigoRecuperacion(models.Model):
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    codigo = models.CharField(max_length=6)
    creado = models.DateTimeField(auto_now_add=True)
    intentos = models.PositiveIntegerField(default=0)

    def esta_expirado(self):
        return timezone.now() > self.creado + timedelta(minutes=10)

    def __str__(self):
        return f"Código para {self.usuario.correo} - {self.codigo}"


# ----------------------------
# Proveedor
# ----------------------------
class Proveedor(models.Model):
    TIPO_PROVEEDOR_CHOICES = [
        ('nacional', 'Nacional'),
        ('importado', 'Importado'),
    ]
    idProveedor = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=45)
    tipo = models.CharField(max_length=20, choices=TIPO_PROVEEDOR_CHOICES)
    productos = models.TextField(help_text="Lista de productos o descripcion")
    correo = models.EmailField()
    telefono = models.CharField(max_length=20)
    estado = models.BooleanField(default=True)

    def __str__(self):
        return self.nombre


# ----------------------------
# Categoría y Subcategoría
# ----------------------------
class Categoria(models.Model):
    idCategoria = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=45, unique=True)
    estado = models.BooleanField()

    def __str__(self):
        return self.nombre


class GrupoTalla(models.Model):
    idGrupoTalla = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=45, unique=True)
    descripcion = models.TextField(blank=True, null=True)
    estado = models.BooleanField(default=True)

    def __str__(self):
        return self.nombre

    class Meta:
        verbose_name = "Grupo de Tallas"
        verbose_name_plural = "Grupos de Tallas"


class Subcategoria(models.Model):
    idSubcategoria = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=45)
    estado = models.BooleanField()
    categoria = models.ForeignKey(Categoria, on_delete=models.CASCADE, related_name='subcategorias')
    stockMinimo = models.PositiveIntegerField(default=0)
    grupoTalla = models.ForeignKey('GrupoTalla', on_delete=models.SET_NULL, null=True, blank=True, related_name='subcategorias')

    class Meta:
        unique_together = ('nombre', 'categoria')
        verbose_name = "Subcategoría"
        verbose_name_plural = "Subcategorías"

    def __str__(self):
        return f"{self.nombre} (de {self.categoria.nombre})"


class Producto(models.Model):
    nombre = models.CharField(max_length=45)
    descripcion = models.TextField(max_length=200)
    precio = models.PositiveIntegerField()
    stock = models.PositiveIntegerField(default=0)
    subcategoria = models.ForeignKey(Subcategoria, on_delete=models.CASCADE, related_name='productos')
    imagen = models.ImageField(upload_to='productos/', blank=True, null=True)

    def __str__(self):
        return self.nombre


class Talla(models.Model):
    nombre = models.CharField(max_length=10)
    grupo = models.ForeignKey(GrupoTalla, on_delete=models.CASCADE, related_name='tallas')
    estado = models.BooleanField(default=True)

    class Meta:
        unique_together = ('nombre', 'grupo')
        verbose_name = "Talla"
        verbose_name_plural = "Tallas"

    def __str__(self):
        return f"{self.nombre} ({self.grupo.nombre})"


# ----------------------------
# Inventario y movimiento
# ----------------------------
class Inventario(models.Model):
    idInventario = models.AutoField(primary_key=True)
    cantidad = models.IntegerField(default=0)
    fechaRegistro = models.DateField(auto_now_add=True)
    stockMinimo = models.IntegerField(default=0)
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE, related_name='inventarios')
    talla = models.ForeignKey('Talla', on_delete=models.CASCADE, related_name='inventarios')
    stock_talla = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ('producto', 'talla')
        ordering = ['producto__subcategoria__categoria__nombre', 'producto__subcategoria__nombre', 'producto__nombre', 'talla__nombre']

    def __str__(self):
        return f"Inventario {self.idInventario} de {self.producto.nombre} - Talla {self.talla.nombre}"

    @property
    def categoria(self):
        return self.producto.subcategoria.categoria

    @property
    def subcategoria(self):
        return self.producto.subcategoria

    @classmethod
    def crear_inventario_para_producto(cls, producto, tallas=None):
        if not tallas:
            if producto.subcategoria.grupoTalla:
                tallas = producto.subcategoria.grupoTalla.tallas.filter(estado=True)
            else:
                return []

        inventarios_creados = []
        for talla in tallas:
            inventario, created = cls.objects.get_or_create(
                producto=producto,
                talla=talla,
                defaults={
                    'cantidad': 0,
                    'stockMinimo': producto.subcategoria.stockMinimo,
                    'stock_talla': 0
                }
            )
            if created:
                inventarios_creados.append(inventario)
        return inventarios_creados

    @classmethod
    def crear_inventario_para_subcategoria(cls, subcategoria):
        productos = subcategoria.productos.all()
        tallas = subcategoria.grupoTalla.tallas.filter(estado=True) if subcategoria.grupoTalla else []

        inventarios_creados = []
        for producto in productos:
            inventarios = cls.crear_inventario_para_producto(producto, tallas)
            inventarios_creados.extend(inventarios)
        return inventarios_creados

    @classmethod
    def crear_inventario_para_categoria(cls, categoria):
        subcategorias = categoria.subcategorias.all()
        inventarios_creados = []
        for subcategoria in subcategorias:
            inventarios = cls.crear_inventario_para_subcategoria(subcategoria)
            inventarios_creados.extend(inventarios)
        return inventarios_creados


class Movimiento(models.Model):
    idmovimiento = models.AutoField(primary_key=True)
    tipo = models.CharField(max_length=45)
    cantidad = models.CharField(max_length=45)
    fecha = models.DateField()
    inventario = models.ForeignKey(Inventario, on_delete=models.DO_NOTHING)

    def __str__(self):
        return f"Movimiento {self.idmovimiento} ({self.tipo})"


# ----------------------------
# Pedidos y pagos
# ----------------------------
# models.py
class Pedido(models.Model):
    idPedido   = models.AutoField(primary_key=True)
    numero     = models.CharField(max_length=30, unique=True, blank=True, null=True)  # si quieres filtrar por "numero"
    total      = models.DecimalField(max_digits=30, decimal_places=2, default=0)
    estado     = models.BooleanField(default=True)
    usuario    = models.ForeignKey(Usuario, on_delete=models.DO_NOTHING)
    created_at = models.DateTimeField(auto_now_add=True)  # lo usas en filtros/orden
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Pedido {self.idPedido}"


class PedidoProducto(models.Model):
    pedido = models.ForeignKey(Pedido, on_delete=models.DO_NOTHING)
    producto = models.ForeignKey(Producto, on_delete=models.DO_NOTHING)

    class Meta:
        unique_together = (('pedido', 'producto'),)

    def __str__(self):
        return f"Producto {self.producto.nombre} en Pedido {self.pedido.idPedido}"
    
class PedidoItem(models.Model):
    pedido   = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name='items')
    producto = models.ForeignKey(Producto, on_delete=models.PROTECT)
    talla    = models.ForeignKey(Talla, on_delete=models.PROTECT, null=True, blank=True)
    cantidad = models.PositiveIntegerField(default=1)
    precio   = models.DecimalField(max_digits=12, decimal_places=2)  # precio unitario al cerrar el pedido
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        unique_together = ('pedido', 'producto', 'talla')

class Pago(models.Model):
    pedido   = models.ForeignKey('Pedido', null=True, blank=True, on_delete=models.SET_NULL)
    carrito  = models.ForeignKey('Carrito', null=True, blank=True, on_delete=models.SET_NULL)

    mp_payment_id      = models.CharField(max_length=64, unique=True)
    external_reference = models.CharField(max_length=255, null=True, blank=True)
    status             = models.CharField(max_length=32)        # approved | pending | rejected...
    status_detail      = models.CharField(max_length=64, blank=True, default='')
    amount             = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    currency           = models.CharField(max_length=8, default='COP')

    raw        = models.JSONField(default=dict)                  # respuesta completa de MP
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
class TipoPago(models.Model):
    idtipoPago = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=45)
    monto = models.DecimalField(max_digits=30, decimal_places=2)
    pago = models.ForeignKey(Pago, on_delete=models.DO_NOTHING)

    def __str__(self):
        return self.nombre


# ----------------------------
# Carrito y Items
# ----------------------------
class Carrito(models.Model):
    idCarrito = models.AutoField(primary_key=True)
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, null=True, blank=True)
    fechaCreacion = models.DateTimeField(auto_now_add=True)
    fechaActualizacion = models.DateTimeField(auto_now=True)
    estado = models.BooleanField(default=True)

    # 🔥 Nuevos campos para Mercado Pago
    external_reference = models.CharField(max_length=100, blank=True, null=True)
    mp_init_point = models.URLField(blank=True, null=True)   # URL de Checkout Pro
    payment_id = models.CharField(max_length=100, blank=True, null=True)
    mp_status = models.CharField(max_length=50, blank=True, null=True)  # approved, pending, rejected

    def __str__(self):
        if self.usuario:
            return f"Carrito de {self.usuario.nombre} {self.usuario.apellido}"
        return f"Carrito {self.idCarrito}"

    def calcular_total(self):
        return sum(item.subtotal for item in self.items.all())

    class Meta:
        verbose_name = "Carrito"
        verbose_name_plural = "Carritos"


class EstadoCarrito(models.Model):
    ESTADO_CHOICES = [
        ('activo', 'Activo'),
        ('pendiente', 'Pendiente de Pago'),
        ('pagado', 'Pagado'),
        ('enviado', 'Enviado'),
        ('entregado', 'Entregado'),
        ('cancelado', 'Cancelado')
    ]

    idEstado = models.AutoField(primary_key=True)
    carrito = models.ForeignKey(Carrito, on_delete=models.CASCADE)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='activo')
    fechaCambio = models.DateTimeField(auto_now_add=True)
    observacion = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Estado {self.estado} - Carrito {self.carrito.idCarrito}"

    class Meta:
        verbose_name = "Estado del Carrito"
        verbose_name_plural = "Estados del Carrito"
        ordering = ['-fechaCambio']


class CarritoItem(models.Model):
    idCarritoItem = models.AutoField(primary_key=True)
    carrito = models.ForeignKey(Carrito, related_name='items', on_delete=models.CASCADE)
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    cantidad = models.PositiveIntegerField(default=1)
    talla = models.ForeignKey(Talla, on_delete=models.CASCADE, null=True, blank=True)
    precio_unitario = models.DecimalField(max_digits=30, decimal_places=2)
    subtotal = models.DecimalField(max_digits=30, decimal_places=2)
    fechaAgregado = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.cantidad} x {self.producto.nombre} en carrito {self.carrito.idCarrito}"

    def save(self, *args, **kwargs):
        self.precio_unitario = self.producto.precio
        self.subtotal = self.precio_unitario * self.cantidad
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = "Item del Carrito"
        verbose_name_plural = "Items del Carrito"
        unique_together = ('carrito', 'producto', 'talla')


# ----------------------------
# Señales (Signals)
# ----------------------------
@receiver(post_save, sender=Producto)
def crear_inventario_producto(sender, instance, created, **kwargs):
    if created:
        Inventario.crear_inventario_para_producto(instance)


@receiver(post_save, sender=Subcategoria)
def actualizar_inventario_subcategoria(sender, instance, created, **kwargs):
    if created:
        Inventario.crear_inventario_para_subcategoria(instance)
    elif kwargs.get('update_fields') and 'grupoTalla' in kwargs.get('update_fields'):
        try:
            productos = instance.productos.all()
            for producto in productos:
                Inventario.objects.filter(producto=producto).delete()
                if instance.grupoTalla:
                    tallas = instance.grupoTalla.tallas.filter(estado=True)
                    Inventario.crear_inventario_para_producto(producto, tallas)
        except Exception as e:
            print(f"Error al actualizar inventario para subcategoría {instance.idSubcategoria}: {str(e)}")
            pass


@receiver(post_save, sender=Talla)
def crear_inventario_para_nueva_talla(sender, instance, created, **kwargs):
    if created:
        nueva_talla = instance
        grupo_talla = nueva_talla.grupo

        subcategorias = Subcategoria.objects.filter(grupoTalla=grupo_talla)
        for subcategoria in subcategorias:
            productos = Producto.objects.filter(subcategoria=subcategoria)
            for producto in productos:
                Inventario.objects.get_or_create(
                    producto=producto,
                    talla=nueva_talla,
                    defaults={
                        'cantidad': 0,
                        'stockMinimo': producto.subcategoria.stockMinimo,
                        'stock_talla': 0
                    }
                )

class WebhookEvent(models.Model):
    mp_topic   = models.CharField(max_length=32)   # e.g. "payment"
    mp_id      = models.CharField(max_length=64)   # data.id
    raw        = models.JSONField(default=dict)
    processed  = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)
    class Meta:
        unique_together = ('mp_topic', 'mp_id')

# BACKEND/models.py
class Factura(models.Model):
    numero       = models.CharField(max_length=32, unique=True)         # consecutivo propio
    pedido       = models.OneToOneField('Pedido', on_delete=models.PROTECT)
    usuario      = models.ForeignKey('Usuario', on_delete=models.PROTECT)
    subtotal     = models.DecimalField(max_digits=12, decimal_places=2)
    impuestos    = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total        = models.DecimalField(max_digits=12, decimal_places=2)
    moneda       = models.CharField(max_length=8, default='COP')
    metodo_pago  = models.CharField(max_length=32, default='mercadopago')
    mp_payment_id= models.CharField(max_length=64, blank=True, default='')
    emitida_en   = models.DateTimeField(default=timezone.now)
    estado       = models.CharField(max_length=16, default='emitida')   # emitida, anulada, etc.
    class Meta:
        db_table = "BACKEND_factura"   # <— coincide con lo que busca el ORM


class FacturaItem(models.Model):
    factura    = models.ForeignKey(Factura, related_name='items', on_delete=models.CASCADE)
    producto   = models.ForeignKey('Producto', on_delete=models.PROTECT)
    descripcion= models.CharField(max_length=255)
    cantidad   = models.PositiveIntegerField()
    precio     = models.DecimalField(max_digits=12, decimal_places=2)   # unitario
    subtotal   = models.DecimalField(max_digits=12, decimal_places=2)
    class Meta:
        db_table = "BACKEND_facturaitem"
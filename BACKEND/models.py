from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager, AbstractUser, Group, Permission
from django.utils import timezone
from datetime import timedelta
from django.db.models.signals import post_save
from django.dispatch import receiver


# Roles
class Rol(models.Model):
    idROL = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=45)

    def __str__(self):
        return self.nombre

# Usuarios y Manager
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
                rol_admin = Rol.objects.get(nombre='administrador')  # Asegúrate de que exista este rol
            except Rol.DoesNotExist:
                # Crea el rol si no existe (opcional)
                rol_admin = Rol.objects.create(nombre='administrador')
            extra_fields['rol'] = rol_admin

        return self.create_user(correo, nombre, apellido, password, **extra_fields)


class Usuario(AbstractBaseUser, PermissionsMixin):

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

    # Se recomienda `on_delete=models.PROTECT` para no perder relaciones si un rol es eliminado
    rol = models.ForeignKey(Rol, on_delete=models.PROTECT)

    is_staff = models.BooleanField(default=False)  # Necesario para acceder al admin
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(default=timezone.now)

    # Grupos y permisos específicos para usuarios personalizados
    groups = models.ManyToManyField(
        Group,
        related_name='usuarios_set',  # Evita conflictos con modelos personalizados
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

    USERNAME_FIELD = 'correo'  # Autenticación por correo
    REQUIRED_FIELDS = ['nombre', 'apellido']  # Campos requeridos al crear superusuario

    objects = UsuarioManager()  # Tu manager personalizado

    def __str__(self):
        return f"{self.nombre} {self.apellido}"

# Código de recuperación para usuarios
class CodigoRecuperacion(models.Model):
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    codigo = models.CharField(max_length=6)
    creado = models.DateTimeField(auto_now_add=True)
    intentos = models.PositiveIntegerField(default=0)

    def esta_expirado(self):
        return timezone.now() > self.creado + timedelta(minutes=10)

    def __str__(self):
        return f"Código para {self.usuario.correo} - {self.codigo}"

# Proveedor
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

# Categoría y Subcategoría
class Categoria(models.Model):
    idCategoria = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=45, unique=True)
    estado = models.BooleanField()

    def __str__(self):
        return self.nombre

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

# Producto
class Producto(models.Model):
    nombre = models.CharField(max_length=45)
    descripcion = models.TextField(max_length=200)
    precio = models.PositiveIntegerField()
    stock = models.PositiveIntegerField(default=0)
    subcategoria = models.ForeignKey(Subcategoria, on_delete=models.CASCADE, related_name='productos')
    imagen = models.ImageField(upload_to='productos/', blank=True, null=True)

    def __str__(self):
        return self.nombre

# Inventario y movimiento
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
        """
        Crea registros de inventario para un producto con todas sus tallas disponibles.
        Si no se proporcionan tallas, usa las tallas del grupo de tallas de la subcategoría.
        """
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
        """
        Crea registros de inventario para todos los productos de una subcategoría.
        """
        productos = subcategoria.productos.all()
        tallas = subcategoria.grupoTalla.tallas.filter(estado=True) if subcategoria.grupoTalla else []

        inventarios_creados = []
        for producto in productos:
            inventarios = cls.crear_inventario_para_producto(producto, tallas)
            inventarios_creados.extend(inventarios)

        return inventarios_creados

    @classmethod
    def crear_inventario_para_categoria(cls, categoria):
        """
        Crea registros de inventario para todos los productos de una categoría.
        """
        subcategorias = categoria.subcategorias.all()
        inventarios_creados = []

        for subcategoria in subcategorias:
            inventarios = cls.crear_inventario_para_subcategoria(subcategoria)
            inventarios_creados.extend(inventarios)

        return inventarios_creados

# Agregar señales para crear inventario automáticamente
@receiver(post_save, sender=Producto)
def crear_inventario_producto(sender, instance, created, **kwargs):
    """
    Cuando se crea un nuevo producto, crear automáticamente sus registros de inventario.
    """
    if created:
        Inventario.crear_inventario_para_producto(instance)

@receiver(post_save, sender=Subcategoria)
def actualizar_inventario_subcategoria(sender, instance, created, **kwargs):
    """
    Cuando se crea una nueva subcategoría o se actualiza su grupo de tallas,
    actualizar el inventario de sus productos.
    """
    if created:
        # Si es una nueva subcategoría, simplemente crear el inventario
        Inventario.crear_inventario_para_subcategoria(instance)
    elif 'grupoTalla' in kwargs.get('update_fields', []):
        try:
            # Obtener los productos de la subcategoría
            productos = instance.productos.all()
            
            # Para cada producto
            for producto in productos:
                # Eliminar los registros de inventario existentes
                Inventario.objects.filter(producto=producto).delete()
                
                # Crear nuevos registros de inventario con las nuevas tallas
                if instance.grupoTalla:
                    tallas = instance.grupoTalla.tallas.filter(estado=True)
                    Inventario.crear_inventario_para_producto(producto, tallas)
        except Exception as e:
            print(f"Error al actualizar inventario para subcategoría {instance.idSubcategoria}: {str(e)}")
            # No propagamos la excepción para evitar que falle la actualización del grupo de tallas
            pass

class Movimiento(models.Model):
    idmovimiento = models.AutoField(primary_key=True)
    tipo = models.CharField(max_length=45)
    cantidad = models.CharField(max_length=45)
    fecha = models.DateField()
    inventario = models.ForeignKey(Inventario, on_delete=models.DO_NOTHING)

    def __str__(self):
        return f"Movimiento {self.idmovimiento} ({self.tipo})"

# Pedidos y pagos
class Pedido(models.Model):
    idPedido = models.AutoField(primary_key=True)
    total = models.DecimalField(max_digits=30, decimal_places=2)
    estado = models.BooleanField()
    usuario = models.ForeignKey(Usuario, on_delete=models.DO_NOTHING)

    def __str__(self):
        return f"Pedido {self.idPedido}"

class PedidoProducto(models.Model):
    pedido = models.ForeignKey(Pedido, on_delete=models.DO_NOTHING)
    producto = models.ForeignKey(Producto, on_delete=models.DO_NOTHING)

    class Meta:
        unique_together = (('pedido', 'producto'),)

    def __str__(self):
        return f"Producto {self.producto.nombre} en Pedido {self.pedido.idPedido}"

class Pago(models.Model):
    idPago = models.AutoField(primary_key=True)
    total = models.DecimalField(max_digits=30, decimal_places=2)
    fechaPago = models.DateField()
    pedido = models.ForeignKey(Pedido, on_delete=models.DO_NOTHING)

    def __str__(self):
        return f"Pago {self.idPago}"

class TipoPago(models.Model):
    idtipoPago = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=45)
    monto = models.DecimalField(max_digits=30, decimal_places=2)
    pago = models.ForeignKey(Pago, on_delete=models.DO_NOTHING)

    def __str__(self):
        return self.nombre

# Carrito de compras y items
class Carrito(models.Model):
    idCarrito = models.AutoField(primary_key=True)
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, null=True, blank=True)  # Opcional
    fechaCreacion = models.DateTimeField(auto_now_add=True)
    fechaActualizacion = models.DateTimeField(auto_now=True)
    estado = models.BooleanField(default=True)  # True = activo, False = convertido en pedido

    def __str__(self):
        if self.usuario:
            return f"Carrito de {self.usuario.nombre} {self.usuario.apellido}"
        return f"Carrito {self.idCarrito}"

    def calcular_total(self):
        return sum(item.subtotal for item in self.items.all())

    class Meta:
        verbose_name = "Carrito"
        verbose_name_plural = "Carritos"

class CarritoItem(models.Model):
    idCarritoItem = models.AutoField(primary_key=True)
    carrito = models.ForeignKey(Carrito, related_name='items', on_delete=models.CASCADE)
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    cantidad = models.PositiveIntegerField(default=1)
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
        unique_together = ('carrito', 'producto')

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

class GrupoTalla(models.Model):
    idGrupoTalla = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=45, unique=True)  # Ej: 'Calzado', 'Ropa', 'Accesorios'
    descripcion = models.TextField(blank=True, null=True)
    estado = models.BooleanField(default=True)

    def __str__(self):
        return self.nombre

    class Meta:
        verbose_name = "Grupo de Tallas"
        verbose_name_plural = "Grupos de Tallas"

class Talla(models.Model):
    nombre = models.CharField(max_length=10)  # Ej: 'S', 'M', 'L', '38', etc.
    grupo = models.ForeignKey(GrupoTalla, on_delete=models.CASCADE, related_name='tallas')
    estado = models.BooleanField(default=True)

    class Meta:
        unique_together = ('nombre', 'grupo')
        verbose_name = "Talla"
        verbose_name_plural = "Tallas"

    def __str__(self):
        return f"{self.nombre} ({self.grupo.nombre})"


from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.utils import timezone
from datetime import timedelta

# Create your models here.
class CodigoRecuperacion(models.Model):
    usuario = models.ForeignKey('Usuario', on_delete=models.CASCADE)
    codigo = models.CharField(max_length=6)
    creado = models.DateTimeField(auto_now_add=True)
    intentos = models.PositiveIntegerField(default=0)

    def esta_expirado(self):
        return timezone.now() > self.creado + timedelta(minutes=10)

    def __str__(self):
        return f"Código para {self.usuario.correo} - {self.codigo}"

class UsuarioManager(BaseUserManager):
    def create_user(self, correo, nombre, apellido, password=None, **extra_fields):
        if not correo:
            raise ValueError("El correo es obligatorio")
        correo = self.normalize_email(correo)
        usuario = self.model(correo=correo, nombre=nombre, apellido=apellido, **extra_fields)
        usuario.set_password(password)
        usuario.save(using=self._db)
        return usuario

    def create_superuser(self, correo, nombre, apellido, password, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(correo, nombre, apellido, password, **extra_fields)


class Usuario(AbstractBaseUser, PermissionsMixin):
    idUsuario = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=45)
    apellido = models.CharField(max_length=45)
    correo = models.EmailField(max_length=45, unique=True)
    telefono = models.CharField(max_length=15)
    estado = models.BooleanField(default=True)
    rol = models.ForeignKey('Rol', on_delete=models.DO_NOTHING)
    is_staff = models.BooleanField(default=False)  # Para admin
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(default=timezone.now)
    
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='usuarios_set',
        blank=True,
        help_text='Los grupos a los que pertenece este usuario.',
        verbose_name='grupos'
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
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
    
class Rol(models.Model):
    idROL = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=45)
    def __str__(self):
        return self.nombre

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

class Categoria(models.Model):
    idCategoria = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=45)
    estado = models.BooleanField()
    def __str__(self):
        return self.nombre

class Producto(models.Model):
    idProducto = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=45)
    descripcion = models.CharField(max_length=200)
    precio = models.DecimalField(max_digits=30, decimal_places=2)
    stock = models.PositiveIntegerField(default=0)
    imagen = models.ImageField(upload_to='productos/')
    categoria = models.ForeignKey(Categoria, on_delete=models.DO_NOTHING)
    def __str__(self):
        return self.nombre

    def save(self, *args, **kwargs):
        if self.stock < 0:
            raise ValueError("El stock no puede ser negativo")
        if self.precio <= 0:
            raise ValueError("El precio debe ser mayor a 0")
        super().save(*args, **kwargs)

class Inventario(models.Model):
    idInventario = models.AutoField(primary_key=True)
    cantidad = models.IntegerField()
    fechaRegistro = models.DateField()
    stockMinimo = models.IntegerField()
    producto = models.ForeignKey(Producto, on_delete=models.DO_NOTHING)
    def __str__(self):
        return f"Inventario {self.idInventario} de {self.producto.nombre}"

class Movimiento(models.Model):
    idmovimiento = models.AutoField(primary_key=True)
    tipo = models.CharField(max_length=45)
    cantidad = models.CharField(max_length=45)
    fecha = models.DateField()
    inventario = models.ForeignKey(Inventario, on_delete=models.DO_NOTHING)
    def __str__(self):
        return f"Movimiento {self.idmovimiento} ({self.tipo})"

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

class Subcategoria(models.Model):
    idSubcategoria = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=45)
    estado = models.BooleanField()
    categoria = models.ForeignKey(Categoria, on_delete=models.CASCADE, related_name='subcategorias')

    def __str__(self):
        return f"{self.nombre} (de {self.categoria.nombre})"


class Carrito(models.Model):
    idCarrito = models.AutoField(primary_key=True)
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, null=True, blank=True)  # Hacemos el usuario opcional
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
        # Actualizar el precio unitario al guardar
        self.precio_unitario = self.producto.precio
        # Calcular el subtotal
        self.subtotal = self.precio_unitario * self.cantidad
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = "Item del Carrito"
        verbose_name_plural = "Items del Carrito"
        unique_together = ('carrito', 'producto')  # Evita duplicados del mismo producto en el carrito

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
        ordering = ['-fechaCambio']  # Ordenar por fecha de cambio descendente
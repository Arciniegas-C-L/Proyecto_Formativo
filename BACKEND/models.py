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
        related_name='usuarios_set',  # cambia este related_name para evitar choque
        blank=True,
        help_text='Los grupos a los que pertenece este usuario.',
        verbose_name='grupos'
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='usuarios_set_perm',  # cambia este también
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
    idProveedor = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=45)
    contacto = models.IntegerField()
    estado = models.BooleanField()
    usuario = models.ForeignKey(Usuario, on_delete=models.DO_NOTHING)
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
    descripcion = models.CharField(max_length=45)
    precio = models.DecimalField(max_digits=30, decimal_places=2)
    imagen = models.BinaryField()
    categoria = models.ForeignKey(Categoria, on_delete=models.DO_NOTHING)
    def __str__(self):
        return self.nombre

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

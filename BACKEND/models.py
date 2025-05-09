from django.db import models

# Create your models here.
class Rol(models.Model):
    idROL = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=45)
    def __str__(self):
        return self.nombre
    
class Usuario(models.Model):
    idUsuario = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=45)
    apellido = models.CharField(max_length=45)
    correo = models.EmailField(max_length=45)
    contrasena = models.CharField(max_length=45)
    telefono = models.IntegerField()
    rol = models.ForeignKey(Rol, on_delete=models.DO_NOTHING)
    def __str__(self):
        return f"{self.nombre} {self.apellido}"

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
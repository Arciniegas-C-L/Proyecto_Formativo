from rest_framework.decorators import api_view, permission_classes, action
from django.contrib.auth.hashers import make_password, check_password
from rest_framework.permissions import AllowAny
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.core.mail import send_mail
from django.conf import settings
import random
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from rest_framework import viewsets
from .serializer import RolSerializer, UsuarioSerializer, ProveedorSerializer, CategoriaSerializer, ProductoSerializer, InventarioSerializer, MovimientoSerializer, PedidoSerializer, PedidoProductoSerializer, PagoSerializer, TipoPagoSerializer
from .models import Rol, Usuario, Proveedor, Categoria, Producto, Inventario, Movimiento, Pedido, PedidoProducto, Pago, TipoPago, CodigoRecuperacion
from django.contrib.auth.models import User
from rest_framework.permissions import IsAdminUser
from .serializer import UserSerializer

# Create your views here.

class Rolview(viewsets.ModelViewSet):
    serializer_class = RolSerializer
    queryset = Rol.objects.all()
    
class Usuarioview(viewsets.ModelViewSet):
    serializer_class = UsuarioSerializer
    queryset = Usuario.objects.all()

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def registro(self, request):
        data = request.data.copy()
        password = data.get('password')
        if not password:
            return Response({"error": "La contraseña es requerida"}, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response({"mensaje": "Usuario registrado correctamente."}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def login(self, request):
        correo = request.data.get('correo')
        password = request.data.get('password')
        try:
            usuario = Usuario.objects.get(correo=correo)
            if usuario.check_password(password):
                return Response({
                    "mensaje": "Login exitoso",
                    "usuario": {
                        "id": usuario.idUsuario,
                        "nombre": usuario.nombre,
                        "rol": usuario.rol.nombre
                    }
                }, status=status.HTTP_200_OK)
            else:
                return Response({"error": "Contraseña incorrecta"}, status=status.HTTP_400_BAD_REQUEST)
        except Usuario.DoesNotExist:
            return Response({"error": "Usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def recuperar_contrasena(self, request):
        correo = request.data.get('correo')
        if not correo:
            return Response({"error": "Debe proporcionar un correo electrónico."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            usuario = Usuario.objects.get(correo=correo)
            codigo = "{:06d}".format(random.randint(0, 999999))

            CodigoRecuperacion.objects.create(usuario=usuario, codigo=codigo)

            asunto = "Código de recuperación"
            mensaje = f"Tu código de recuperación es: {codigo}\nEste código expirará en 10 minutos."
            email_desde = settings.DEFAULT_FROM_EMAIL
            send_mail(asunto, mensaje, email_desde, [correo])

            return Response({"mensaje": "Código enviado al correo."})
        except Usuario.DoesNotExist:
            return Response({"error": "No existe un usuario con ese correo."}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def verificar_codigo(self, request):
        correo = request.data.get('correo')
        codigo = request.data.get('codigo')

        if not correo or not codigo:
            return Response({"error": "Correo y código son requeridos."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            usuario = Usuario.objects.get(correo=correo)
        except Usuario.DoesNotExist:
            return Response({"error": "Usuario no encontrado."}, status=status.HTTP_404_NOT_FOUND)

        try:
            codigo_obj = CodigoRecuperacion.objects.filter(usuario=usuario, codigo=codigo).latest('creado')
        except CodigoRecuperacion.DoesNotExist:
            return Response({"error": "Código inválido."}, status=status.HTTP_400_BAD_REQUEST)

        if codigo_obj.intentos >= 3:
            return Response({"error": "Has superado el número máximo de intentos."}, status=status.HTTP_403_FORBIDDEN)

        if codigo_obj.esta_expirado():
            return Response({"error": "El código ha expirado."}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"mensaje": "Código verificado correctamente."}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def reset_password(self, request):
        correo = request.data.get('correo')
        codigo = request.data.get('codigo')
        nueva_contrasena = request.data.get('contrasena')

        if not all([correo, codigo, nueva_contrasena]):
            return Response({"error": "Faltan datos para restablecer la contraseña."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            usuario = Usuario.objects.get(correo=correo)
        except Usuario.DoesNotExist:
            return Response({"error": "Usuario no encontrado."}, status=status.HTTP_404_NOT_FOUND)

        try:
            codigo_obj = CodigoRecuperacion.objects.filter(usuario=usuario).latest('creado')
        except CodigoRecuperacion.DoesNotExist:
            return Response({"error": "Código inválido."}, status=status.HTTP_400_BAD_REQUEST)

        if codigo_obj.intentos >= 3:
            return Response({"error": "Has superado el número máximo de intentos. Solicita un nuevo código."}, status=status.HTTP_403_FORBIDDEN)

        if codigo_obj.esta_expirado():
            return Response({"error": "El código ha expirado."}, status=status.HTTP_400_BAD_REQUEST)

        if codigo_obj.codigo != codigo:
            codigo_obj.intentos += 1
            codigo_obj.save()
            return Response({"error": f"Código incorrecto. Intentos restantes: {3 - codigo_obj.intentos}"}, status=status.HTTP_400_BAD_REQUEST)

        usuario.set_password(nueva_contrasena)
        usuario.save()
        CodigoRecuperacion.objects.filter(usuario=usuario).delete()

        return Response({"mensaje": "Contraseña restablecida correctamente."}, status=status.HTTP_200_OK)
    
class ProveedorView(viewsets.ModelViewSet):
    serializer_class = ProveedorSerializer
    queryset = Proveedor.objects.all()
    
class CategoriaView(viewsets.ModelViewSet):
    serializer_class = CategoriaSerializer
    queryset = Categoria.objects.all()
    
class ProductoView(viewsets.ModelViewSet):
    serializer_class = ProductoSerializer
    queryset = Producto.objects.all()
    
class InventarioView(viewsets.ModelViewSet):
    serializer_class = InventarioSerializer
    queryset = Inventario.objects.all()
    
class MovimientoView(viewsets.ModelViewSet):
    serializer_class = MovimientoSerializer
    queryset = Movimiento.objects.all()
    
class PedidoView(viewsets.ModelViewSet):
    serializer_class = PedidoSerializer
    queryset = Pedido.objects.all()
    
class PedidoProductoView(viewsets.ModelViewSet):
    serializer_class = PedidoProductoSerializer
    queryset = PedidoProducto.objects.all()
    
class PagoView(viewsets.ModelViewSet):
    serializer_class = PagoSerializer
    queryset = Pago.objects.all()
    
class TipoPagoView(viewsets.ModelViewSet):
    serializer_class = TipoPagoSerializer
    queryset = TipoPago.objects.all()
    
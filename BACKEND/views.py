from rest_framework.decorators import api_view, permission_classes, action
from django.contrib.auth.hashers import make_password, check_password
from rest_framework.permissions import AllowAny, IsAuthenticated
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
from .serializer import (
    RolSerializer, UsuarioSerializer, ProveedorSerializer, CategoriaSerializer,
    ProductoSerializer, InventarioSerializer, MovimientoSerializer, PedidoSerializer,
    PedidoProductoSerializer, PagoSerializer, TipoPagoSerializer,
    CarritoSerializer, CarritoItemSerializer, CarritoCreateSerializer,
    CarritoItemCreateSerializer, CarritoUpdateSerializer, EstadoCarritoSerializer, SubcategoriaSerializer
)
from .models import (
    Rol, Usuario, Proveedor, Categoria, Producto, Inventario, Movimiento,
    Pedido, PedidoProducto, Pago, TipoPago, CodigoRecuperacion,
    Carrito, CarritoItem, EstadoCarrito, Subcategoria
)

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

    def update(self, request):
        print("Datos recibidos en update:", request.data)  # Log de los datos recibidos
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance, data=request.data, partial=True)
            if serializer.is_valid():
                print("Datos validados:", serializer.validated_data)  # Log de los datos validados
                self.perform_update(serializer)
                return Response(serializer.data)
            print("Errores de validación:", serializer.errors)  # Log de los errores
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print("Error en update:", str(e))  # Log de cualquier error
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
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
    
class CarritoView(viewsets.ModelViewSet):
    serializer_class = CarritoSerializer
    permission_classes = [AllowAny]  # Permitimos acceso sin autenticación

    def get_queryset(self):
        if self.request.user.is_authenticated:
            # Si el usuario está autenticado, mostrar sus carritos
            return Carrito.objects.filter(usuario=self.request.user)
        # Si no está autenticado, mostrar todos los carritos sin usuario
        return Carrito.objects.filter(usuario__isnull=True)

    def get_serializer_class(self):
        if self.action == 'create':
            return CarritoCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return CarritoUpdateSerializer
        return CarritoSerializer

    @action(detail=True, methods=['post'])
    def agregar_producto(self, request, pk=None):
        try:
            carrito = self.get_object()
            print("Datos recibidos:", request.data)  # Log para debug
            
            # Validar que los datos requeridos estén presentes
            if 'producto' not in request.data:
                return Response(
                    {"error": "El campo 'producto' es requerido"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if 'cantidad' not in request.data:
                return Response(
                    {"error": "El campo 'cantidad' es requerido"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Crear el serializer con los datos
            serializer = CarritoItemCreateSerializer(data={
                'carrito': carrito.idCarrito,
                'producto': request.data.get('producto'),
                'cantidad': int(request.data.get('cantidad', 1))
            })
            
            if serializer.is_valid():
                serializer.save()
                return Response(CarritoSerializer(carrito).data, status=status.HTTP_200_OK)
            
            print("Errores de validación:", serializer.errors)  # Log para debug
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            print("Error al agregar producto:", str(e))  # Log para debug
            return Response(
                {"error": f"Error al agregar el producto: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def actualizar_cantidad(self, request, pk=None):
        try:
            # Obtener el carrito con sus items y productos precargados
            carrito = Carrito.objects.prefetch_related(
                'items__producto'
            ).get(pk=pk)
            
            item_id = request.data.get('item_id')
            nueva_cantidad = request.data.get('cantidad')

            # Obtener el item con su producto relacionado
            item = carrito.items.select_related('producto').get(idCarritoItem=item_id)
            
            if nueva_cantidad <= 0:
                item.delete()
            else:
                item.cantidad = nueva_cantidad
                item.save()
            
            # Serializar el carrito con sus items actualizados
            serializer = CarritoSerializer(carrito)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except CarritoItem.DoesNotExist:
            return Response(
                {"error": "Item no encontrado en el carrito"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"Error al actualizar cantidad: {str(e)}")  # Log para debug
            return Response(
                {"error": f"Error al actualizar la cantidad: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def eliminar_producto(self, request, pk=None):
        carrito = self.get_object()
        item_id = request.data.get('item_id')

        try:
            item = CarritoItem.objects.get(idCarritoItem=item_id, carrito=carrito)
            item.delete()
            return Response(CarritoSerializer(carrito).data, status=status.HTTP_200_OK)
        except CarritoItem.DoesNotExist:
            return Response(
                {"error": "Item no encontrado en el carrito"},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['post'])
    def limpiar_carrito(self, request, pk=None):
        carrito = self.get_object()
        carrito.items.all().delete()
        return Response(CarritoSerializer(carrito).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def finalizar_compra(self, request, pk=None):
        carrito = self.get_object()
        
        if carrito.items.count() == 0:
            return Response(
                {"error": "El carrito está vacío"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Crear el pedido
        pedido = Pedido.objects.create(
            usuario=carrito.usuario,
            total=carrito.calcular_total(),
            estado=True  # True = activo
        )

        # Crear los items del pedido
        for item in carrito.items.all():
            PedidoProducto.objects.create(
                pedido=pedido,
                producto=item.producto
            )

        # Actualizar el estado del carrito
        carrito.estado = False  # False = convertido en pedido
        carrito.save()
        
        # Crear el estado final del carrito
        EstadoCarrito.objects.create(
            carrito=carrito,
            estado='entregado',
            observacion='Carrito convertido en pedido'
        )

        return Response({
            "mensaje": "Compra finalizada exitosamente",
            "pedido_id": pedido.idPedido
        }, status=status.HTTP_200_OK)

class CarritoItemView(viewsets.ModelViewSet):
    serializer_class = CarritoItemSerializer
    permission_classes = [AllowAny]  # Permitimos acceso sin autenticación

    def get_queryset(self):
        if self.request.user.is_authenticated:
            # Si el usuario está autenticado, mostrar items de sus carritos
            return CarritoItem.objects.filter(carrito__usuario=self.request.user)
        # Si no está autenticado, mostrar items de carritos sin usuario
        return CarritoItem.objects.filter(carrito__usuario__isnull=True)

class EstadoCarritoView(viewsets.ModelViewSet):
    serializer_class = EstadoCarritoSerializer
    permission_classes = [AllowAny]  # Permitimos acceso sin autenticación

    def get_queryset(self):
        if self.request.user.is_authenticated:
            # Si el usuario está autenticado, mostrar estados de sus carritos
            return EstadoCarrito.objects.filter(carrito__usuario=self.request.user)
        # Si no está autenticado, mostrar estados de carritos sin usuario
        return EstadoCarrito.objects.filter(carrito__usuario__isnull=True)

class SubcategoriaView(viewsets.ModelViewSet):
    queryset = Subcategoria.objects.all()
    serializer_class = SubcategoriaSerializer 
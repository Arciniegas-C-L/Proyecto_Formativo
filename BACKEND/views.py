# --- Python stdlib
import json
import random
import string
import time
from datetime import timedelta
from decimal import Decimal
import io
from django.db.models import Prefetch

from django.http import FileResponse, HttpResponse
from rest_framework.decorators import action
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.conf import settings

# --- Django
from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.db import models, transaction
from django.db.models import Q
from django.http import HttpResponse
from django.utils import timezone

# --- DRF
from rest_framework import status, viewsets, serializers
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

# --- JWT
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

# --- Terceros
import requests
import mercadopago

# --- Permisos del proyecto
from BACKEND.permissions import (
    IsAdmin,
    IsCliente,
    IsAdminWriteClienteRead,
    AdminandCliente,
    AllowGuestReadOnly,
    NotGuest,
)

# --- MODELOS del proyecto (import explícito)
from .models import (
    # básicos
    Rol,
    Usuario,
    Direccion,
    Proveedor,
    Categoria,
    Subcategoria,
    GrupoTalla,
    Talla,

    # catálogo / stock / pedidos
    Producto,
    Inventario,
    Movimiento,
    Pedido,
    PedidoProducto,

    # pagos / carrito
    Pago,
    TipoPago,
    CodigoRecuperacion,
    Carrito,
    CarritoItem,
    EstadoCarrito,

    # facturación
    Factura,
    FacturaItem,
    Comentario,
    PedidoItem,
)

# --- SERIALIZERS del proyecto (import explícito)
from .serializer import (
    # auth / usuario
    LoginSerializer,
    UsuarioSerializer,
    UsuarioRegistroSerializer,
    UserSerializer,
    DireccionSerializer,
    RolSerializer,

    # catálogo / stock / pedidos
    ProveedorSerializer,
    CategoriaSerializer,
    SubcategoriaSerializer,
    GrupoTallaSerializer,
    TallaSerializer,
    ProductoSerializer,
    InventarioSerializer,
    InventarioAgrupadoSerializer,
    MovimientoSerializer,
    PedidoSerializer,
    PedidoProductoSerializer,

    # pagos / carrito
    PagoSerializer,
    TipoPagoSerializer,
    CarritoSerializer,
    CarritoCreateSerializer,
    CarritoUpdateSerializer,
    CarritoItemSerializer,
    CarritoItemCreateSerializer,
    EstadoCarritoSerializer,

    # facturación
    FacturaSerializer,
    FacturaItemSerializer,
    FacturaCreateSerializer,
    ComentarioSerializer,
)

# --- SDK Mercado Pago (usa tu token de settings)
sdk = mercadopago.SDK(settings.MP_ACCESS_TOKEN)


class ComentarioViewSet(viewsets.ModelViewSet):
    queryset = Comentario.objects.select_related('usuario').all().order_by('-fecha')
    serializer_class = ComentarioSerializer
    permission_classes = [IsAuthenticated, NotGuest, AdminandCliente]

    def perform_create(self, serializer):
        # Asigna el usuario autenticado y guarda snapshot de datos
        user = self.request.user
        if user.is_authenticated:
            serializer.save(
                usuario=user,
                usuario_nombre=user.nombre,
                usuario_apellido=user.apellido,
                usuario_avatar_seed=user.avatar_seed,
                usuario_avatar_options=user.avatar_options
            )
        else:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'usuario': 'Debes iniciar sesión para comentar.'})

# CRUD de direcciones de usuario
class DireccionViewSet(viewsets.ModelViewSet):
    queryset = Direccion.objects.all()
    serializer_class = DireccionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Solo mostrar direcciones del usuario autenticado
        return Direccion.objects.filter(usuario=self.request.user)

    def perform_create(self, serializer):
        # Asignar el usuario autenticado a la dirección
        serializer.save(usuario=self.request.user)

# Create your views here.

class Rolview(viewsets.ModelViewSet):

    serializer_class = RolSerializer
    queryset = Rol.objects.all()
    permission_classes = [IsAdminWriteClienteRead, AllowGuestReadOnly]

class UsuarioViewSet(viewsets.ModelViewSet):
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated], url_path='me')
    def me(self, request):
        """
        Devuelve los datos del usuario autenticado.
        """
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    permission_classes = [AllowAny]

    def update(self, request, *args, **kwargs):
        # Permitir actualizar avatar_seed y avatar_options por id
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)
    @action(detail=False, methods=['post'], permission_classes=[AllowAny], url_path='guest')
    def guest(self, request):
        """
        Emite un JWT para un usuario técnico con rol 'Invitado'.
        - NO crea el rol (debe existir en la tabla Rol).
        - Devuelve la misma estructura que 'login' para reutilizar el frontend.
        """
        # 1) Buscar rol 'Invitado' existente (no lo crea) – acepta mayúsc/minúsc
        try:
            rol_invitado = Rol.objects.get(nombre__iexact='Invitado')
        except Rol.DoesNotExist:
            return Response(
                {"error": "El rol 'Invitado' no existe. Créalo previamente en la tabla de roles."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 2) Obtener o crear (una sola vez) un usuario técnico para invitados
        #    Ajusta estos campos a tu modelo real. Si 'correo' es único, úsalo.
        guest, created = Usuario.objects.get_or_create(
            correo='guest@local',  # si en tu modelo el único es username, usa username='guest_user'
            defaults={
                'nombre': 'Invitado',
                'is_active': True,
                'rol': rol_invitado,
            }
        )

        # Asegura que el usuario técnico tenga siempre el rol 'Invitado'
        # Usa .pk para no depender del nombre de la PK de Rol
        if getattr(guest, 'rol_id', None) != rol_invitado.pk:
            guest.rol = rol_invitado
            guest.save(update_fields=['rol'])

        # Evita login por password en el usuario técnico (si tu modelo lo soporta)
        if created and hasattr(guest, 'set_unusable_password'):
            guest.set_unusable_password()
            guest.save()

        # 3) Generar tokens (igual que en login)
        refresh = RefreshToken.for_user(guest)
        token = {
            'refresh': str(refresh),               # si NO quieres refresh para invitados, puedes omitirlo
            'access': str(refresh.access_token),
        }

        usuario_serializado = UsuarioSerializer(guest).data

        return Response({
            "mensaje": "Token de invitado generado",
            "usuario": usuario_serializado,
            "rol": rol_invitado.nombre,
            "token": token
        }, status=status.HTTP_200_OK)
    # ------------------ FIN INVITADO ------------------

    # --- REGISTRO ---
    @action(detail=False, methods=['post'], permission_classes=[AllowAny], url_path='register')
    def register(self, request):
        data = request.data.copy()

        # Si no envían rol, asignamos el rol "cliente" por defecto
        if not data.get('rol'):
            try:
                rol_cliente = Rol.objects.get(nombre='cliente')
                data['rol'] = rol_cliente.pk
            except Rol.DoesNotExist:
                return Response(
                    {"error": "Rol por defecto no encontrado"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        serializer = UsuarioRegistroSerializer(data=data)
        if serializer.is_valid():
            usuario = serializer.save()
            return Response({
                "mensaje": "Usuario registrado correctamente",
                "usuario": UsuarioSerializer(usuario).data
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # --- LOGIN ---
    @action(detail=False, methods=['get', 'post'], permission_classes=[AllowAny])
    def login(self, request):
        if request.method == 'GET':
            serializer = LoginSerializer()
            return Response(serializer.data)

        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        correo = serializer.validated_data['correo']
        password = serializer.validated_data['password']
        try:
            usuario = Usuario.objects.select_related('rol').get(correo=correo)

            if not usuario.is_active:
                return Response({"error": "Usuario inactivo"}, status=status.HTTP_403_FORBIDDEN)

            if not usuario.check_password(password):
                return Response({"error": "Contraseña incorrecta"}, status=status.HTTP_400_BAD_REQUEST)

            refresh = RefreshToken.for_user(usuario)
            token = {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }

            usuario_serializado = UsuarioSerializer(usuario).data

            return Response({
                "mensaje": "Login exitoso",
                "usuario": usuario_serializado,
                "rol": usuario.rol.nombre if usuario.rol else None,
                "token": token
            }, status=status.HTTP_200_OK)

        except Usuario.DoesNotExist:
            return Response({"error": "Usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND)

    # --- ENVIAR CÓDIGO RECUPERACIÓN ---
    @action(detail=False, methods=['post', 'get'], permission_classes=[AllowAny])
    def recuperar_password(self, request):
        correo = request.data.get('correo')

        try:
            usuario = Usuario.objects.get(correo=correo)

            # Verificar si ya hay un código activo en los últimos 30 segundos
            codigo_activo = CodigoRecuperacion.objects.filter(
                usuario=usuario, creado__gte=timezone.now() - timedelta(seconds=30)
            ).exists()

            if codigo_activo:
                return Response(
                    {"error": "Ya se envió un código recientemente. Espere antes de solicitar otro."},
                    status=status.HTTP_429_TOO_MANY_REQUESTS
                )

            # Generar código de 6 dígitos
            codigo = ''.join(random.choices(string.digits, k=6))
            CodigoRecuperacion.objects.create(usuario=usuario, codigo=codigo)

            # Enviar correo real
            send_mail(
                subject="Código de recuperación",
                message=f"Tu código de recuperación es: {codigo}",
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[correo],
                fail_silently=False,
            )

            return Response({"mensaje": "Código enviado al correo."}, status=status.HTTP_200_OK)

        except Usuario.DoesNotExist:
            return Response({"error": "Usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": f"Error enviando el correo: {str(e)}"},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # --- VERIFICAR CÓDIGO ---
    @action(detail=False, methods=['post', 'get'], permission_classes=[AllowAny])
    def verificar_codigo(self, request):
        correo = request.data.get('correo')
        codigo = request.data.get('codigo')

        try:
            usuario = Usuario.objects.get(correo=correo)
            codigo_obj = CodigoRecuperacion.objects.filter(usuario=usuario).latest('creado')

            if codigo_obj.intentos >= 3:
                return Response({"error": "Código bloqueado por demasiados intentos"}, status=status.HTTP_403_FORBIDDEN)

            if codigo_obj.codigo != codigo:
                codigo_obj.intentos += 1
                codigo_obj.save()
                return Response({"error": "Código incorrecto"}, status=status.HTTP_400_BAD_REQUEST)

            return Response({"mensaje": "Código válido"}, status=status.HTTP_200_OK)

        except (Usuario.DoesNotExist, CodigoRecuperacion.DoesNotExist):
            return Response({"error": "Datos inválidos"}, status=status.HTTP_404_NOT_FOUND)

    # --- RESET PASSWORD ---
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def reset_password(self, request):
        correo = request.data.get('correo')
        codigo = request.data.get('codigo')
        nueva_contrasena = request.data.get('nueva_contrasena')

        try:
            usuario = Usuario.objects.get(correo=correo)
            codigo_obj = CodigoRecuperacion.objects.filter(usuario=usuario).latest('creado')

            if codigo_obj.intentos >= 3:
                return Response({"error": "Código bloqueado por demasiados intentos"}, status=status.HTTP_403_FORBIDDEN)

            if codigo_obj.codigo != codigo:
                codigo_obj.intentos += 1
                codigo_obj.save()
                return Response({"error": "Código incorrecto"}, status=status.HTTP_400_BAD_REQUEST)

            usuario.set_password(nueva_contrasena)
            usuario.save()
            codigo_obj.delete()

            return Response({"mensaje": "Contraseña restablecida correctamente"}, status=status.HTTP_200_OK)

        except (Usuario.DoesNotExist, CodigoRecuperacion.DoesNotExist):
            return Response({"error": "Datos inválidos"}, status=status.HTTP_404_NOT_FOUND)

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Permite autenticación con 'correo' + 'password' y agrega 'rol' al JWT.
    - Usa 'correo' como campo de usuario (si tu modelo tiene USERNAME_FIELD='correo', mejor).
    - Devuelve payload alineado con tu 'login' action.
    """
    # Indica a SimpleJWT que el 'username' esperado es 'correo'
    username_field = 'correo'
    # Define el campo explícitamente para validación DRF
    correo = serializers.EmailField()

    @classmethod
    def get_token(cls, user):
        """
        Agrega claims al token (access/refresh).
        """
        token = super().get_token(user)
        # Reclamos útiles
        token['rol'] = getattr(getattr(user, 'rol', None), 'nombre', None)
        token['guest'] = False
        return token

    def validate(self, attrs):
        """
        Delega la autenticación a la implementación base (usa username_field='correo'),
        valida activo, y retorna el mismo shape que tu login.
        """
        # Esto hará la autenticación con correo/password si tu backend lo soporta
        data = super().validate(attrs)
        user = self.user

        if not user.is_active:
            raise AuthenticationFailed("Cuenta inactiva.")

        # Refresca tokens ya generados por la clase base
        refresh = self.get_token(user)

        data['refresh'] = str(refresh)
        data['access'] = str(refresh.access_token)
        data['usuario'] = {
            'id': getattr(user, 'idUsuario', getattr(user, 'id', None)),
            'nombre': getattr(user, 'nombre', None),
            'rol': getattr(getattr(user, 'rol', None), 'nombre', None),
        }
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    permission_classes = [AllowAny]
    serializer_class = CustomTokenObtainPairSerializer


#Preparacion para actualizar perfil con token de cliente
class MiPerfilView(viewsets.ViewSet):
    permission_classes = [IsAuthenticated, AdminandCliente]

    def list(self, request):
        serializer = UsuarioSerializer(request.user)
        return Response(serializer.data)

    def update(self, request, pk=None):
        serializer = UsuarioSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
class ProveedorView(viewsets.ModelViewSet):
    serializer_class = ProveedorSerializer
    queryset = Proveedor.objects.all()
    permission_classes = [IsAuthenticated, IsAdminWriteClienteRead, AllowGuestReadOnly]

class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    permission_classes = [IsAuthenticated, IsAdminWriteClienteRead, AllowGuestReadOnly]

class ProductoView(viewsets.ModelViewSet):
    serializer_class = ProductoSerializer
    queryset = Producto.objects.all()
    parser_classes = (MultiPartParser, FormParser)  # Soportar archivos en request
    def get_permissions(self):
        # Permitir acceso público a métodos de solo lectura (GET, HEAD, OPTIONS)
        if self.request.method in ['GET', 'HEAD', 'OPTIONS']:
            from rest_framework.permissions import AllowAny
            return [AllowAny()]
        # Solo administradores pueden modificar
        from BACKEND.permissions import IsAdminWriteClienteRead
        return [IsAdminWriteClienteRead()]

    def update(self, request, pk=None):
        print("Datos recibidos en update:", request.data)  # Log de datos recibidos
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance, data=request.data, partial=True)
            if serializer.is_valid():
                print("Datos validados:", serializer.validated_data)  # Log datos validados
                self.perform_update(serializer)
                return Response(serializer.data)
            print("Errores de validación:", serializer.errors)  # Log errores
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print("Error en update:", str(e))  # Log error
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def create(self, request, *args, **kwargs):
        print("Datos recibidos en create:", request.data)  # Log datos recibidos
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            self.perform_create(serializer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        print("Errores de validación en create:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    
class GrupoTallaViewSet(viewsets.ModelViewSet):
    serializer_class = GrupoTallaSerializer
    queryset = GrupoTalla.objects.all()
    permission_classes = [IsAuthenticated, IsAdminWriteClienteRead, AllowGuestReadOnly]

    def get_queryset(self):
        queryset = super().get_queryset()
        estado = self.request.query_params.get('estado', None)
        
        if estado is not None:
            estado = estado.lower() == 'true'
            queryset = queryset.filter(estado=estado)
        
        return queryset

    @action(detail=True, methods=['get'])
    def tallas_activas(self, request, pk=None):
        grupo = self.get_object()
        tallas = grupo.tallas.filter(estado=True)
        serializer = TallaSerializer(tallas, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def agregar_talla(self, request, pk=None):
        grupo = self.get_object()
        serializer = TallaSerializer(data={
            'nombre': request.data.get('nombre'),
            'grupo_id': grupo.idGrupoTalla,
            'estado': True
        })
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class TallaViewSet(viewsets.ModelViewSet):
    serializer_class = TallaSerializer
    queryset = Talla.objects.all()
    permission_classes = [IsAuthenticated, IsAdminWriteClienteRead, AllowGuestReadOnly]

    def get_queryset(self):
        queryset = super().get_queryset()
        grupo_id = self.request.query_params.get('grupo', None)
        estado = self.request.query_params.get('estado', None)
        
        if grupo_id:
            queryset = queryset.filter(grupo_id=grupo_id)
        if estado is not None:
            estado = estado.lower() == 'true'
            queryset = queryset.filter(estado=estado)
        
        return queryset

    @action(detail=True, methods=['post'])
    def cambiar_estado(self, request, pk=None):
        talla = self.get_object()
        nuevo_estado = request.data.get('estado')
        
        if nuevo_estado is None:
            return Response(
                {"error": "Se requiere el campo 'estado'"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        talla.estado = nuevo_estado
        talla.save()
        return Response(self.get_serializer(talla).data)

    @action(detail=False, methods=['post'])
    def agregar_talla_a_productos_existentes(self, request):
        """
        Agrega una nueva talla a todos los productos existentes que pertenecen 
        al mismo grupo de tallas de la talla especificada.
        """
        try:
            talla_id = request.data.get('talla_id')
            
            if not talla_id:
                return Response(
                    {"error": "Se requiere el ID de la talla"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Obtener la talla
            try:
                talla = Talla.objects.get(id=talla_id, estado=True)
            except Talla.DoesNotExist:
                return Response(
                    {"error": "Talla no encontrada o inactiva"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Obtener todas las subcategorías que usan el mismo grupo de tallas
            subcategorias = Subcategoria.objects.filter(
                grupoTalla=talla.grupo,
                estado=True
            )
            
            if not subcategorias.exists():
                return Response(
                    {"error": "No hay subcategorías que usen este grupo de tallas"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Obtener todos los productos de estas subcategorías
            productos = Producto.objects.filter(
                subcategoria__in=subcategorias
            )
            
            inventarios_creados = []
            inventarios_existentes = []
            
            for producto in productos:
                # Verificar si ya existe inventario para este producto y talla
                inventario_existente = Inventario.objects.filter(
                    producto=producto,
                    talla=talla
                ).first()
                
                if inventario_existente:
                    inventarios_existentes.append({
                        'producto': producto.nombre,
                        'talla': talla.nombre,
                        'inventario_id': inventario_existente.idInventario
                    })
                else:
                    # Crear nuevo inventario
                    nuevo_inventario = Inventario.objects.create(
                        producto=producto,
                        talla=talla,
                        cantidad=0,
                        stockMinimo=producto.subcategoria.stockMinimo,
                        stock_talla=0
                    )
                    inventarios_creados.append({
                        'producto': producto.nombre,
                        'talla': talla.nombre,
                        'inventario_id': nuevo_inventario.idInventario
                    })
            
            return Response({
                "mensaje": f"Proceso completado para la talla '{talla.nombre}'",
                "talla": {
                    "id": talla.id,
                    "nombre": talla.nombre,
                    "grupo": talla.grupo.nombre
                },
                "estadisticas": {
                    "productos_procesados": productos.count(),
                    "inventarios_creados": len(inventarios_creados),
                    "inventarios_existentes": len(inventarios_existentes)
                },
                "inventarios_creados": inventarios_creados,
                "inventarios_existentes": inventarios_existentes
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {"error": f"Error al procesar la solicitud: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class InventarioView(viewsets.ModelViewSet):
    serializer_class = InventarioSerializer
    queryset = Inventario.objects.all().select_related(
        'producto',
        'talla',
        'producto__subcategoria',
        'producto__subcategoria__categoria'
    ).order_by(
        'producto__subcategoria__categoria__nombre',
        'producto__subcategoria__nombre',
        'producto__nombre',
        'talla__nombre'
    )
    permission_classes = [IsAuthenticated, IsAdminWriteClienteRead, AllowGuestReadOnly]

    def get_serializer_class(self):
        if self.action == 'inventario_agrupado':
            return InventarioAgrupadoSerializer
        return super().get_serializer_class()

    def get_queryset(self):
        queryset = super().get_queryset()
        producto_id = self.request.query_params.get('producto', None)
        talla_id = self.request.query_params.get('talla', None)
        categoria_id = self.request.query_params.get('categoria', None)
        subcategoria_id = self.request.query_params.get('subcategoria', None)

        if producto_id:
            queryset = queryset.filter(producto_id=producto_id)
        if talla_id:
            queryset = queryset.filter(talla_id=talla_id)
        if categoria_id:
            queryset = queryset.filter(producto__subcategoria__categoria_id=categoria_id)
        if subcategoria_id:
            queryset = queryset.filter(producto__subcategoria_id=subcategoria_id)

        return queryset

    @action(detail=False, methods=['get'])
    def por_categoria(self, request):
        categoria_id = request.query_params.get('categoria_id')
        if not categoria_id:
            return Response(
                {"error": "Se requiere el ID de la categoría"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Verificar si la categoría existe
            categoria = Categoria.objects.filter(idCategoria=categoria_id).first()
            if not categoria:
                return Response(
                    {"error": f"No existe la categoría con ID {categoria_id}"},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Obtener subcategorías de la categoría
            subcategorias = Subcategoria.objects.filter(categoria_id=categoria_id)
            subcategorias_ids = list(subcategorias.values_list('idSubcategoria', flat=True))
            
            # Obtener productos de las subcategorías
            productos = Producto.objects.filter(subcategoria__in=subcategorias_ids)
            productos_ids = list(productos.values_list('id', flat=True))

            # Filtrar inventario y organizar por subcategorías
            inventario = self.queryset.filter(
                producto__in=productos_ids
            ).select_related(
                'producto',
                'producto__subcategoria',
                'producto__subcategoria__categoria',
                'talla'
            )

            # Organizar el inventario por subcategorías
            inventario_por_subcategoria = {}
            for inv in inventario:
                subcategoria_id = inv.producto.subcategoria.idSubcategoria
                if subcategoria_id not in inventario_por_subcategoria:
                    inventario_por_subcategoria[subcategoria_id] = []
                inventario_por_subcategoria[subcategoria_id].append(inv)

            # Preparar respuesta con información organizada
            response_data = {
                "categoria": {
                    "id": categoria.idCategoria,
                    "nombre": categoria.nombre
                },
                "subcategorias": [
                    {
                        "id": sub.idSubcategoria,
                        "nombre": sub.nombre,
                        "stockMinimo": sub.stockMinimo,
                        "inventario": self.get_serializer(
                            inventario_por_subcategoria.get(sub.idSubcategoria, []),
                            many=True
                        ).data
                    }
                    for sub in subcategorias
                ],
                "diagnostico": {
                    "subcategorias_count": len(subcategorias_ids),
                    "productos_count": len(productos_ids),
                    "inventario_count": inventario.count()
                }
            }
            
            return Response(response_data)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def por_subcategoria(self, request):
        subcategoria_id = request.query_params.get('subcategoria_id')
        if not subcategoria_id:
            return Response(
                {"error": "Se requiere el ID de la subcategoría"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Verificar si la subcategoría existe
            subcategoria = Subcategoria.objects.filter(idSubcategoria=subcategoria_id).first()
            if not subcategoria:
                return Response(
                    {"error": f"No existe la subcategoría con ID {subcategoria_id}"},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Filtrar inventario por productos que pertenecen a la subcategoría
            inventario = self.queryset.filter(
                producto__subcategoria_id=subcategoria_id
            ).select_related(
                'producto',
                'producto__subcategoria',
                'producto__subcategoria__categoria',
                'talla'
            )
            
            # Preparar respuesta con información organizada
            response_data = {
                "subcategoria": {
                    "id": subcategoria.idSubcategoria,
                    "nombre": subcategoria.nombre,
                    "stockMinimo": subcategoria.stockMinimo,
                    "categoria": {
                        "id": subcategoria.categoria.idCategoria,
                        "nombre": subcategoria.categoria.nombre
                    }
                },
                "inventario": self.get_serializer(inventario, many=True).data,
                "diagnostico": {
                    "productos_count": inventario.values('producto').distinct().count(),
                    "inventario_count": inventario.count()
                }
            }
            
            return Response(response_data)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def stock_producto(self, request):
        producto_id = request.query_params.get('producto', None)
        if not producto_id:
            return Response(
                {"error": "Se requiere el ID del producto"},
                status=status.HTTP_400_BAD_REQUEST
            )

        inventarios = self.queryset.filter(producto_id=producto_id)
        stock_por_talla = [{
            'talla': inv.talla.nombre,
            'stock': inv.stock_talla,
            'stock_minimo': inv.stockMinimo
        } for inv in inventarios]

        return Response(stock_por_talla)

    @action(detail=False, methods=['post'])
    def actualizar_stock(self, request):
        producto_id = request.data.get('producto_id')
        talla_id = request.data.get('talla_id')
        cantidad = request.data.get('cantidad')

        if not all([producto_id, talla_id, cantidad]):
            return Response(
                {"error": "Se requieren producto_id, talla_id y cantidad"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            inventario = self.queryset.get(producto_id=producto_id, talla_id=talla_id)
            inventario.stock_talla = cantidad
            inventario.save()
            return Response(self.get_serializer(inventario).data)
        except Inventario.DoesNotExist:
            return Response(
                {"error": "No se encontró el inventario para el producto y talla especificados"},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['get'])
    def inventario_agrupado(self, request):
        categorias = Inventario.objects.values(
            'producto__subcategoria__categoria__idCategoria',
            'producto__subcategoria__categoria__nombre',
            'producto__subcategoria__categoria__estado'
        ).distinct().order_by('producto__subcategoria__categoria__nombre')

        serializer = self.get_serializer(categorias, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def categorias(self, request):
        """
        Devuelve todas las categorías con sus subcategorías.
        """
        categorias = Categoria.objects.filter(estado=True).prefetch_related('subcategorias')
        response_data = []
        
        for categoria in categorias:
            subcategorias = categoria.subcategorias.filter(estado=True)
            categoria_data = {
                'id': categoria.idCategoria,
                'nombre': categoria.nombre,
                'estado': categoria.estado,
                'subcategorias': [{
                    'id': sub.idSubcategoria,
                    'nombre': sub.nombre,
                    'estado': sub.estado,
                    'stockMinimo': sub.stockMinimo
                } for sub in subcategorias]
            }
            response_data.append(categoria_data)
        
        return Response(response_data)

    @action(detail=False, methods=['get'])
    def productos_por_subcategoria(self, request):
        """
        Devuelve todos los productos de una subcategoría específica.
        """
        subcategoria_id = request.query_params.get('subcategoria_id')
        if not subcategoria_id:
            return Response(
                {"error": "Se requiere el ID de la subcategoría"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            subcategoria = Subcategoria.objects.select_related('categoria').get(
                idSubcategoria=subcategoria_id,
                estado=True
            )
            
            productos = Producto.objects.filter(
                subcategoria=subcategoria,
                subcategoria__estado=True
            ).prefetch_related(
                'inventarios__talla'
            )

            productos_data = []
            for producto in productos:
                inventarios = producto.inventarios.all()
                tallas_stock = [{
                    'talla': inv.talla.nombre,
                    'stock': inv.stock_talla,
                    'stock_minimo': inv.stockMinimo
                } for inv in inventarios]

                productos_data.append({
                    'id': producto.id,
                    'nombre': producto.nombre,
                    'descripcion': producto.descripcion,
                    'precio': producto.precio,
                    'stock': producto.stock,
                    'imagen': producto.imagen.url if producto.imagen else None,
                    'tallas_stock': tallas_stock,
                    'categoria': {
                        'id': subcategoria.categoria.idCategoria,
                        'nombre': subcategoria.categoria.nombre
                    },
                    'subcategoria': {
                        'id': subcategoria.idSubcategoria,
                        'nombre': subcategoria.nombre,
                        'stockMinimo': subcategoria.stockMinimo
                    }
                })

            response_data = {
                'subcategoria': {
                    'id': subcategoria.idSubcategoria,
                    'nombre': subcategoria.nombre,
                    'stockMinimo': subcategoria.stockMinimo,
                    'categoria': {
                        'id': subcategoria.categoria.idCategoria,
                        'nombre': subcategoria.categoria.nombre
                    }
                },
                'productos': productos_data
            }

            return Response(response_data)

        except Subcategoria.DoesNotExist:
            return Response(
                {"error": "Subcategoría no encontrada o inactiva"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def subcategorias_por_categoria(self, request):
        """
        Devuelve todas las subcategorías de una categoría específica.
        """
        categoria_id = request.query_params.get('categoria_id')
        if not categoria_id:
            return Response(
                {"error": "Se requiere el ID de la categoría"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            categoria = Categoria.objects.get(
                idCategoria=categoria_id,
                estado=True
            )
            
            subcategorias = Subcategoria.objects.filter(
                categoria=categoria,
                estado=True
            ).select_related('categoria')

            subcategorias_data = [{
                'id': sub.idSubcategoria,
                'nombre': sub.nombre,
                'estado': sub.estado,
                'stockMinimo': sub.stockMinimo,
                'categoria': {
                    'id': categoria.idCategoria,
                    'nombre': categoria.nombre
                }
            } for sub in subcategorias]

            response_data = {
                'categoria': {
                    'id': categoria.idCategoria,
                    'nombre': categoria.nombre,
                    'estado': categoria.estado
                },
                'subcategorias': subcategorias_data
            }

            return Response(response_data)

        except Categoria.DoesNotExist:
            return Response(
                {"error": "Categoría no encontrada o inactiva"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def tabla_categorias(self, request):
        """
        Devuelve las categorías en formato de tabla con información de navegación.
        """
        categorias = Categoria.objects.filter(estado=True).prefetch_related('subcategorias')
        
        # Obtener conteos para cada categoría
        categorias_data = []
        for categoria in categorias:
            subcategorias_count = categoria.subcategorias.filter(estado=True).count()
            productos_count = Producto.objects.filter(
                subcategoria__categoria=categoria,
                subcategoria__estado=True
            ).count()
            
            categorias_data.append({
                'id': categoria.idCategoria,
                'nombre': categoria.nombre,
                'estado': categoria.estado,
                'subcategorias_count': subcategorias_count,
                'productos_count': productos_count,
                'acciones': {
                    'ver_subcategorias': f'/inventario/tabla_subcategorias/?categoria_id={categoria.idCategoria}'
                }
            })
        
        return Response({
            'titulo': 'Categorías',
            'columnas': [
                {'campo': 'nombre', 'titulo': 'Nombre de la Categoría'},
                {'campo': 'subcategorias_count', 'titulo': 'Subcategorías'},
                {'campo': 'productos_count', 'titulo': 'Productos'},
                {'campo': 'estado', 'titulo': 'Estado'},
                {'campo': 'acciones', 'titulo': 'Acciones'}
            ],
            'datos': categorias_data,
            'breadcrumbs': [{'nombre': 'Inicio', 'url': '/'}]
        })

    @action(detail=False, methods=['get'])
    def tabla_subcategorias(self, request):
        """
        Devuelve las subcategorías de una categoría en formato de tabla.
        """
        categoria_id = request.query_params.get('categoria_id')
        if not categoria_id:
            return Response(
                {"error": "Se requiere el ID de la categoría"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            categoria = Categoria.objects.get(
                idCategoria=categoria_id,
                estado=True
            )
            
            subcategorias = Subcategoria.objects.filter(
                categoria=categoria,
                estado=True
            ).select_related('categoria', 'grupoTalla')

            subcategorias_data = []
            for subcategoria in subcategorias:
                productos_count = Producto.objects.filter(
                    subcategoria=subcategoria
                ).count()
                
                stock_total = Inventario.objects.filter(
                    producto__subcategoria=subcategoria
                ).aggregate(
                    total_stock=models.Sum('stock_talla')
                )['total_stock'] or 0

                subcategorias_data.append({
                    'id': subcategoria.idSubcategoria,
                    'nombre': subcategoria.nombre,
                    'estado': subcategoria.estado,
                    'stockMinimo': subcategoria.stockMinimo,
                    'productos_count': productos_count,
                    'stock_total': stock_total,
                    'grupoTalla': {
                        'idGrupoTalla': subcategoria.grupoTalla.idGrupoTalla if subcategoria.grupoTalla else None,
                        'nombre': subcategoria.grupoTalla.nombre if subcategoria.grupoTalla else None
                    },
                    'acciones': {
                        'ver_productos': f'/inventario/tabla_productos/?subcategoria_id={subcategoria.idSubcategoria}'
                    }
                })

            return Response({
                'titulo': f'Subcategorías de {categoria.nombre}',
                'columnas': [
                    {'campo': 'nombre', 'titulo': 'Nombre de la Subcategoría'},
                    {'campo': 'productos_count', 'titulo': 'Productos'},
                    {'campo': 'stock_total', 'titulo': 'Stock Total'},
                    {'campo': 'stockMinimo', 'titulo': 'Stock Mínimo'},
                    {'campo': 'estado', 'titulo': 'Estado'},
                    {'campo': 'acciones', 'titulo': 'Acciones'}
                ],
                'datos': subcategorias_data,
                'breadcrumbs': [
                    {'nombre': 'Inicio', 'url': '/'},
                    {'nombre': 'Categorías', 'url': '/inventario/tabla_categorias/'},
                    {'nombre': categoria.nombre, 'url': f'/inventario/tabla_subcategorias/?categoria_id={categoria.idCategoria}'}
                ]
            })

        except Categoria.DoesNotExist:
            return Response(
                {"error": "Categoría no encontrada o inactiva"},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['get'])
    def tabla_productos(self, request):
        """
        Devuelve los productos de una subcategoría en formato de tabla.
        """
        subcategoria_id = request.query_params.get('subcategoria_id')
        if not subcategoria_id:
            return Response(
                {"error": "Se requiere el ID de la subcategoría"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            subcategoria = Subcategoria.objects.select_related('categoria').get(
                idSubcategoria=subcategoria_id,
                estado=True
            )
            
            productos = Producto.objects.filter(
                subcategoria=subcategoria
            ).prefetch_related(
                'inventarios__talla'
            )

            productos_data = []
            for producto in productos:
                inventarios = producto.inventarios.all()
                stock_por_talla = {
                    inv.talla.nombre: {
                        'talla_id': inv.talla.id,
                        'stock': inv.stock_talla,
                        'stock_minimo': inv.stockMinimo,
                        'stock_inicial': inv.cantidad  # Agregamos el stock inicial
                    } for inv in inventarios
                }
                
                stock_total = sum(inv.stock_talla for inv in inventarios)
                stock_minimo_total = sum(inv.stockMinimo for inv in inventarios)
                stock_inicial_total = sum(inv.cantidad for inv in inventarios)  # Sumamos el stock inicial total

                productos_data.append({
                    'id': producto.id,
                    'nombre': producto.nombre,
                    'descripcion': producto.descripcion,
                    'precio': producto.precio,
                    'stock': producto.stock,  # Agregamos el stock del modelo producto
                    'stock_total': stock_total,
                    'stock_inicial_total': stock_inicial_total,
                    'stock_minimo_total': stock_minimo_total,
                    'imagen': producto.imagen.url if producto.imagen else None,
                    'stock_por_talla': stock_por_talla,
                    'estado_stock': 'Bajo' if stock_total <= stock_minimo_total else 'Normal',
                    'acciones': {
                        'editar': f'/productos/{producto.id}/',
                        'ver_detalle': f'/productos/{producto.id}/detalle/'
                    }
                })

            return Response({
                'titulo': f'Productos de {subcategoria.nombre}',
                'columnas': [
                    {'campo': 'nombre', 'titulo': 'Nombre del Producto'},
                    {'campo': 'precio', 'titulo': 'Precio'},
                    {'campo': 'stock_total', 'titulo': 'Stock Total'},
                    {'campo': 'stock_inicial_total', 'titulo': 'Stock Inicial'},
                    {'campo': 'stock_minimo_total', 'titulo': 'Stock Mínimo'},
                    {'campo': 'estado_stock', 'titulo': 'Estado del Stock'},
                    {'campo': 'acciones', 'titulo': 'Acciones'}
                ],
                'datos': productos_data,
                'breadcrumbs': [
                    {'nombre': 'Inicio', 'url': '/'},
                    {'nombre': 'Categorías', 'url': '/inventario/tabla_categorias/'},
                    {'nombre': subcategoria.categoria.nombre, 'url': f'/inventario/tabla_subcategorias/?categoria_id={subcategoria.categoria.idCategoria}'},
                    {'nombre': subcategoria.nombre, 'url': f'/inventario/tabla_productos/?subcategoria_id={subcategoria.idSubcategoria}'}
                ]
            })

        except Subcategoria.DoesNotExist:
            return Response(
                {"error": "Subcategoría no encontrada o inactiva"},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['post'])
    def actualizar_stock_tallas(self, request):
        producto_id = request.data.get('producto_id')
        tallas_data = request.data.get('tallas', [])

        if not producto_id or not tallas_data:
            return Response(
                {"error": "Se requieren producto_id y tallas"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            producto = Producto.objects.get(id=producto_id)
            inventarios_actualizados = []
            stock_total = 0

            for talla_info in tallas_data:
                talla_id = talla_info.get('talla_id')
                stock = talla_info.get('stock', 0)
                stock_minimo = talla_info.get('stock_minimo', 0)

                if stock < 0 or stock_minimo < 0:
                    return Response(
                        {"error": "El stock y stock mínimo no pueden ser negativos"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                try:
                    inventario = self.queryset.get(producto_id=producto_id, talla_id=talla_id)
                    inventario.stock_talla = stock
                    inventario.stockMinimo = stock_minimo
                    inventario.save()
                    inventarios_actualizados.append(inventario)
                    stock_total += stock
                except Inventario.DoesNotExist:
                    return Response(
                        {"error": f"No se encontró el inventario para la talla {talla_id}"},
                        status=status.HTTP_404_NOT_FOUND
                    )

            return Response({
                "mensaje": "Stock por tallas actualizado exitosamente",
                "inventarios": self.get_serializer(inventarios_actualizados, many=True).data,
                "stock_total": stock_total
            })

        except Producto.DoesNotExist:
            return Response(
                {"error": "Producto no encontrado"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class MovimientoView(viewsets.ModelViewSet):
    serializer_class = MovimientoSerializer
    queryset = Movimiento.objects.all()
    permission_classes = [IsAuthenticated, AdminandCliente, NotGuest] #Por definir

# views.py (solo si NO agregas campos al modelo)
class PedidoView(viewsets.ModelViewSet):
    serializer_class = PedidoSerializer
    permission_classes = [IsAuthenticated, AdminandCliente, NotGuest]

    def get_queryset(self):
        qs = (Pedido.objects
                .select_related("usuario")
                .prefetch_related(
                    Prefetch("items", queryset=PedidoItem.objects.select_related("producto","talla"), to_attr="_pref_items"),
                    Prefetch("pedidoproducto_set", queryset=PedidoProducto.objects.select_related("producto"), to_attr="_pref_pp"),
                ))

        user = self.request.user
        es_admin = getattr(getattr(user, "rol", None), "nombre", "").lower() == "admin" or user.is_staff
        if not es_admin:
            qs = qs.filter(usuario=user)

        return qs.order_by("-idPedido")

class PedidoProductoView(viewsets.ModelViewSet):
    """
    CRUD de ítems de pedido.
    - Admin: ve todos los registros.
    - Cliente: solo puede ver ítems de sus propios pedidos.
    - Filtro por querystring: ?pedido=<id>
    """
    serializer_class = PedidoProductoSerializer
    permission_classes = [IsAuthenticated, AdminandCliente, NotGuest]

    def get_queryset(self):
        qs = (
            PedidoProducto.objects
            .select_related(
                "pedido",
                "pedido__usuario",
                "producto",
                "producto__subcategoria",
                "producto__subcategoria__categoria",
            )
            .all()
            .order_by("-pedido__idPedido", "producto__nombre")
        )

        # Si NO es admin, limitar a los pedidos del usuario autenticado
        user = self.request.user
        es_admin = getattr(getattr(user, "rol", None), "nombre", "").lower() == "admin" or user.is_staff
        if not es_admin:
            qs = qs.filter(pedido__usuario=user)

        # Filtro opcional por pedido
        pedido_id = self.request.query_params.get("pedido")
        if pedido_id:
            qs = qs.filter(pedido_id=pedido_id)

        return qs

    # Si no quieres permitir crear/actualizar/borrar desde API pública comenta/borra estos métodos
    # y cambia el ViewSet por ReadOnlyModelViewSet. Por ahora dejamos ModelViewSet.

    @action(detail=False, methods=["get"])
    def por_pedido(self, request):
        """
        GET /BACKEND/api/pedidoproductos/por_pedido/?pedido=<id>
        Devuelve los ítems de un pedido específico (respetando visibilidad por usuario).
        """
        pedido_id = request.query_params.get("pedido")
        if not pedido_id:
            return Response({"detail": "Falta parámetro 'pedido'."}, status=status.HTTP_400_BAD_REQUEST)

        qs = self.get_queryset().filter(pedido_id=pedido_id)
        data = self.get_serializer(qs, many=True).data
        return Response(data, status=status.HTTP_200_OK)

class PagoView(viewsets.ModelViewSet):
    serializer_class = PagoSerializer
    queryset = Pago.objects.all()
    permission_classes = [IsAuthenticated, AdminandCliente, NotGuest] #Por definir

class TipoPagoView(viewsets.ModelViewSet):
    serializer_class = TipoPagoSerializer
    queryset = TipoPago.objects.all()
    permission_classes = [IsAuthenticated, AdminandCliente, NotGuest] #Por definir

class CarritoView(viewsets.ModelViewSet):
    serializer_class = CarritoSerializer
    permission_classes = [IsAuthenticated, AdminandCliente, NotGuest]

    def list(self, request, *args, **kwargs):
        rol = getattr(getattr(request.user, 'rol', None), 'nombre', '').lower()
        if rol == 'invitado':
            return Response({"results": [], "count": 0}, status=status.HTTP_200_OK)
        return super().list(request, *args, **kwargs)

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return Carrito.objects.filter(usuario=self.request.user)
        return Carrito.objects.filter(usuario__isnull=True)

    def get_serializer_class(self):
        if self.action == 'create':
            return CarritoCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return CarritoUpdateSerializer
        return CarritoSerializer

    @action(detail=True, methods=['post'])
    def agregar_producto(self, request, pk=None):
        """
        Agrega un producto al carrito. Solo VALIDA stock; NO descuenta.
        El descuento real se hace al facturar (FacturaCreateSerializer).
        """
        try:
            carrito = self.get_object()
            if 'producto' not in request.data:
                return Response({"error": "El campo 'producto' es requerido"}, status=400)
            if 'cantidad' not in request.data:
                return Response({"error": "El campo 'cantidad' es requerido"}, status=400)

            producto_id = request.data.get('producto')
            talla_id = request.data.get('talla')
            cantidad = int(request.data.get('cantidad', 1))

            from .models import Inventario, CarritoItem

            inventario = (
                Inventario.objects.filter(producto_id=producto_id, talla_id=talla_id).first()
                if talla_id else
                Inventario.objects.filter(producto_id=producto_id).first()
            )

            filtro_item = {'carrito': carrito, 'producto_id': producto_id}
            if talla_id:
                filtro_item['talla_id'] = talla_id
            item_existente = CarritoItem.objects.filter(**filtro_item).first()

            cantidad_total = cantidad + (item_existente.cantidad if item_existente else 0)

            # Validar stock (NO modificar inventario aquí)
            if inventario:
                stock_disponible = getattr(inventario, 'stock_talla', inventario.cantidad)
                if cantidad_total > stock_disponible:
                    return Response(
                        {"error": f"No hay suficiente stock disponible. "
                                f"Stock actual: {stock_disponible}, Cantidad solicitada: {cantidad_total}"},
                        status=400
                    )

            if item_existente:
                item_existente.cantidad += cantidad
                item_existente.save()
            else:
                serializer = CarritoItemCreateSerializer(data={
                    'carrito': carrito.idCarrito,
                    'producto': producto_id,
                    'cantidad': cantidad,
                    'talla': talla_id
                })
                if not serializer.is_valid():
                    return Response(serializer.errors, status=400)
                serializer.save()

            return Response(CarritoSerializer(carrito).data, status=200)

        except Exception as e:
            print("Error al agregar producto:", str(e))
            return Response({"error": f"Error al agregar el producto: {str(e)}"}, status=400)

    @action(detail=True, methods=['post'])
    def actualizar_cantidad(self, request, pk=None):
        """
        Actualiza la cantidad de un item. Solo VALIDA stock; NO descuenta.
        """
        try:
            carrito = Carrito.objects.prefetch_related('items__producto', 'items__talla').get(pk=pk)
            item_id = request.data.get('item_id')
            nueva_cantidad = int(request.data.get('cantidad'))

            item = carrito.items.select_related('producto', 'talla').get(idCarritoItem=item_id)

            from .models import Inventario
            inventario = (
                Inventario.objects.filter(producto=item.producto, talla=item.talla).first()
                if item.talla else
                Inventario.objects.filter(producto=item.producto).first()
            )

            # Validación de stock (NO tocar inventario)
            if inventario and nueva_cantidad > 0:
                stock_disponible = getattr(inventario, 'stock_talla', inventario.cantidad)
                if nueva_cantidad > stock_disponible:
                    return Response(
                        {"error": f"No hay suficiente stock para la talla seleccionada. "
                                f"Stock actual: {stock_disponible}, solicitado: {nueva_cantidad}"},
                        status=400
                    )

            if nueva_cantidad <= 0:
                item.delete()
            else:
                item.cantidad = nueva_cantidad
                item.save()

            return Response(CarritoSerializer(carrito).data, status=200)

        except CarritoItem.DoesNotExist:
            return Response({"error": "Item no encontrado en el carrito"}, status=404)
        except Exception as e:
            print("Error al actualizar cantidad:", str(e))
            return Response({"error": f"Error al actualizar la cantidad: {str(e)}"}, status=400)

    @action(detail=True, methods=['post'])
    def eliminar_producto(self, request, pk=None):
        """
        Elimina un item del carrito. NO devuelve stock aquí.
        """
        carrito = self.get_object()
        item_id = request.data.get('item_id')
        try:
            item = CarritoItem.objects.get(idCarritoItem=item_id, carrito=carrito)
            # NO modificar inventario aquí
            item.delete()
            return Response(CarritoSerializer(carrito).data, status=200)
        except CarritoItem.DoesNotExist:
            return Response({"error": "Item no encontrado en el carrito"}, status=404)

    @action(detail=True, methods=['post'])
    def limpiar_carrito(self, request, pk=None):
        """
        Limpia el carrito. NO modifica inventario aquí.
        """
        carrito = self.get_object()
        carrito.items.all().delete()
        return Response(CarritoSerializer(carrito).data, status=200)

    @action(detail=True, methods=['post'])
    def finalizar_compra(self, request, pk=None):
        """
        Convierte el carrito en pedido.
        NO descuenta stock aquí (eso se hace al facturar).
        """
        carrito = self.get_object()
        if carrito.items.count() == 0:
            return Response({"error": "El carrito está vacío"}, status=400)

        # Creamos el pedido (total lo recalculamos abajo)
        pedido = Pedido.objects.create(
            usuario=carrito.usuario,
            total=0,
            estado=True
        )

        from decimal import Decimal
        from .models import PedidoItem, PedidoProducto  # mantenemos ambos para compatibilidad

        total = Decimal('0.00')
        # Menos queries:
        items = carrito.items.select_related('producto', 'talla').all()

        for it in items:
            # precio unitario: usa el guardado en el carrito; si no, el del producto
            precio = getattr(it, 'precio_unitario', None)
            if precio is None:
                precio = getattr(it.producto, 'precio', 0)

            precio = Decimal(str(precio))
            cantidad = int(it.cantidad or 1)
            subtotal = precio * Decimal(cantidad)

            # 1) Línea "oficial" del pedido (esto es lo que lee tu serializer como items)
            PedidoItem.objects.create(
                pedido=pedido,
                producto=it.producto,
                talla=it.talla,
                cantidad=cantidad,
                precio=precio,
                subtotal=subtotal,
            )

            # 2) Mantén PedidoProducto si ya lo usas en otros lados (compatibilidad)
            PedidoProducto.objects.create(pedido=pedido, producto=it.producto)

            total += subtotal

        # Guardar total calculado
        pedido.total = total
        pedido.save(update_fields=['total'])

        # Cerrar carrito (sin tocar inventario)
        carrito.estado = False
        carrito.save(update_fields=['estado'])

        EstadoCarrito.objects.create(
            carrito=carrito,
            estado='entregado',
            observacion='Carrito convertido en pedido'
        )

        return Response(
            {"mensaje": "Compra finalizada exitosamente", "pedido_id": pedido.idPedido},
            status=200
        )

    @action(detail=True, methods=['post'])
    def crear_preferencia_pago(self, request, pk=None):
        """
        Crea una preferencia de pago en Mercado Pago para este carrito.
        Request opcional: { "email": "comprador@test.com" }
        """
        carrito = self.get_object()

        # 1) Validaciones básicas
        if carrito.items.count() == 0:
            return Response({"error": "El carrito está vacío"}, status=status.HTTP_400_BAD_REQUEST)

        # 2) Construir items para MP (solo lectura)
        items_mp = []
        total = 0.0
        for it in carrito.items.all():
            try:
                unit_price = float(it.precio_unitario)
                qty = int(it.cantidad)
            except Exception:
                return Response({"error": "Ítems con datos inválidos (precio/cantidad)"}, status=status.HTTP_400_BAD_REQUEST)

            if unit_price <= 0 or qty <= 0:
                return Response({"error": "Precio o cantidad inválidos en algún ítem"}, status=status.HTTP_400_BAD_REQUEST)

            items_mp.append({
                "id": str(it.producto.id),
                "title": it.producto.nombre,
                "quantity": qty,
                "unit_price": unit_price,
                "currency_id": "COP",
            })
            total += unit_price * qty

        if total <= 0:
            return Response({"error": "El total del carrito debe ser mayor a 0"}, status=status.HTTP_400_BAD_REQUEST)

        # 3) external_reference único y persistido
        external_ref = f"ORDER-{carrito.idCarrito}-{int(time.time())}"
        carrito.external_reference = external_ref
        carrito.mp_status = "pending"
        carrito.save(update_fields=["external_reference", "mp_status"])

        # 4) Payload para MP usando settings.py
        email = request.data.get("email") or "test_user@example.com"
        return_url = f"{settings.FRONTEND_URL}{settings.FRONTEND_RETURN_PATH}?carritoId={carrito.idCarrito}"

        preference_data = {
            "items": items_mp,
            "payer": {"email": email},
            "external_reference": external_ref,
            "back_urls": {
                "success": return_url,
                "failure": return_url,
                "pending": return_url,
            },
            "notification_url": settings.MP_NOTIFICATION_URL,
        }
        if getattr(settings, "MP_SEND_AUTO_RETURN", False):
            preference_data["auto_return"] = "approved"

        # 5) Llamada a Mercado Pago
        try:
            resp = requests.post(
                "https://api.mercadopago.com/checkout/preferences",
                headers={
                    "Authorization": f"Bearer {settings.MP_ACCESS_TOKEN}",
                    "Content-Type": "application/json",
                },
                json=preference_data,
                timeout=20
            )
        except Exception as e:
            return Response({"error": f"No se pudo contactar a Mercado Pago: {str(e)}"},
                            status=status.HTTP_502_BAD_GATEWAY)

        if resp.status_code != 201:
            try:
                mp_error = resp.json()
            except Exception:
                mp_error = resp.text
            return Response(
                {"error": "Mercado Pago rechazó la preferencia", "detalle": mp_error},
                status=resp.status_code
            )

        preference = resp.json()
        carrito.mp_init_point = preference.get("init_point")
        carrito.save(update_fields=["mp_init_point"])

        # ✅ IMPORTANTE: no hay código duplicado después de este return.
        return Response(
            {"id": preference.get("id"), "init_point": preference.get("init_point")},
            status=status.HTTP_201_CREATED
        )

class CarritoItemView(viewsets.ModelViewSet):
    serializer_class = CarritoItemSerializer
    permission_classes = [IsAuthenticated, AdminandCliente, NotGuest]  # Permite acceso a admin y cliente

    def get_queryset(self):
        if self.request.user.is_authenticated:
            # Si el usuario está autenticado, mostrar items de sus carritos
            return CarritoItem.objects.filter(carrito__usuario=self.request.user)
        # Si no está autenticado, mostrar items de carritos sin usuario
        return CarritoItem.objects.filter(carrito__usuario__isnull=True)


class EstadoCarritoView(viewsets.ModelViewSet):
    serializer_class = EstadoCarritoSerializer
    permission_classes = [IsAuthenticated, AdminandCliente, NotGuest]

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return EstadoCarrito.objects.filter(carrito__usuario=self.request.user)
        return EstadoCarrito.objects.filter(carrito__usuario__isnull=True)

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def webhook(self, request):
        """
        Webhook de Mercado Pago para notificaciones de pago
        """
        try:
            body = request.data if isinstance(request.data, dict) else json.loads(request.body)
            event_type = body.get("type")
            data = body.get("data", {})
            payment_id = str(data.get("id", ""))

            if event_type != "payment" or not payment_id:
                return Response({"ok": True})  # ignoramos otros eventos

            # Consultar pago en Mercado Pago
            url = f"https://api.mercadopago.com/v1/payments/{payment_id}"
            resp = requests.get(
                url,
                headers={"Authorization": f"Bearer {settings.MP_ACCESS_TOKEN}"},
                timeout=15
            )
            if resp.status_code != 200:
                return Response({"error": "No se pudo consultar el pago"}, status=502)

            pago = resp.json()
            external_ref = pago.get("external_reference")
            status_pago = pago.get("status")  # approved, pending, rejected

            try:
                carrito = Carrito.objects.get(external_reference=external_ref)
            except Carrito.DoesNotExist:
                return Response({"error": "Carrito no encontrado"}, status=404)

            # Actualizar carrito
            carrito.payment_id = payment_id
            carrito.mp_status = status_pago
            carrito.save()

            # Crear estado
            EstadoCarrito.objects.create(
                carrito=carrito,
                estado="pagado" if status_pago == "approved" else "pendiente",
                observacion=f"Webhook recibido. Estado: {status_pago}"
            )

            return Response({"ok": True})
        except Exception as e:
            return Response({"error": str(e)}, status=500)

    @action(detail=False, methods=['get'])
    def consultar_estado(self, request):
        """
        Consulta el estado actual de un carrito según external_reference o payment_id.
        Ejemplo:
        GET /api/estado-carrito/consultar_estado/?external_reference=ORDER-12345
        GET /api/estado-carrito/consultar_estado/?payment_id=987654321
        """
        external_ref = request.query_params.get("external_reference")
        payment_id = request.query_params.get("payment_id")

        if not external_ref and not payment_id:
            return Response({"error": "Debes enviar external_reference o payment_id"}, status=400)

        try:
            if external_ref:
                carrito = Carrito.objects.get(external_reference=external_ref)
            else:
                carrito = Carrito.objects.get(payment_id=payment_id)

            ultimo_estado = carrito.estadocarrito_set.first()  # por ordering en Meta
            return Response({
                "carrito_id": carrito.idCarrito,
                "external_reference": carrito.external_reference,
                "payment_id": carrito.payment_id,
                "status": carrito.mp_status,
                "estado": ultimo_estado.estado if ultimo_estado else None,
                "observacion": ultimo_estado.observacion if ultimo_estado else None,
            })
        except Carrito.DoesNotExist:
            return Response({"error": "Carrito no encontrado"}, status=404)
        
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def retorno(self, request):
        # Log para verificar que MP sí llamó esta URL
        print("RETORNO MP ->", request.GET.dict())

        status_mp   = request.GET.get("status", "")
        payment_id  = request.GET.get("payment_id", "")
        external_ref = request.GET.get("external_reference", "")
        carrito_id  = request.GET.get("carritoId", "")

        dest = (
            f"{settings.FRONTEND_URL}{settings.FRONTEND_RETURN_PATH}"
            f"?status={status_mp}&payment_id={payment_id}"
            f"&external_reference={external_ref}"
            f"{f'&carritoId={carrito_id}' if carrito_id else ''}"
        )

        html = f"""<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Confirmando pago…</title>
  <meta http-equiv="refresh" content="5;url={dest}">
  <style>
    body {{ font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; padding: 32px; }}
    .card {{ max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #eee; border-radius: 12px; }}
  </style>
</head>
<body>
  <div class="card">
    <h2>Pago procesado</h2>
    <p>Te llevaremos a tu factura en unos segundos…</p>
    <p>Si no ocurre nada, <a href="{dest}">haz clic aquí para continuar</a>.</p>
  </div>
  <script>setTimeout(function(){{ location.replace("{dest}"); }}, 5000);</script>
</body>
</html>"""
        return HttpResponse(html)

class FacturaView(viewsets.ModelViewSet):
    queryset = Factura.objects.all().select_related("usuario", "pedido")
    serializer_class = FacturaSerializer  # <- para GET/response
    permission_classes = [IsAuthenticated]  # + AdminandCliente, NotGuest si aplica

    @action(detail=False, methods=["post"])
    @transaction.atomic
    def crear_desde_pago(self, request):
        """
        Crea una factura (idempotente) a partir de un pago de MP.
        Body:
        {
        "payment_id": "125178556047",
        "external_reference": "ORDER-2-1757556908",
        "carrito_id": 2
        }
        """
        payment_id = str(request.data.get("payment_id") or "").strip()
        external_ref = str(request.data.get("external_reference") or "").strip()
        carrito_id = request.data.get("carrito_id")

        if not external_ref and not carrito_id and not payment_id:
            return Response(
                {"detail": "Debes enviar external_reference o carrito_id o payment_id"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 1) Resolver carrito
        try:
            if external_ref:
                carrito = Carrito.objects.select_related("usuario").prefetch_related("items").get(
                    external_reference=external_ref
                )
            elif carrito_id:
                carrito = Carrito.objects.select_related("usuario").prefetch_related("items").get(
                    pk=carrito_id  # <-- AJUSTA si tu PK es idCarrito
                )
                external_ref = carrito.external_reference or external_ref
            else:
                carrito = Carrito.objects.select_related("usuario").prefetch_related("items").get(
                    payment_id=payment_id
                )
                external_ref = carrito.external_reference or external_ref
        except Carrito.DoesNotExist:
            return Response({"detail": "Carrito no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        if carrito.items.count() == 0:
            return Response({"detail": "El carrito está vacío"}, status=status.HTTP_400_BAD_REQUEST)

        # 2) Consultar estado de MP (opcional pero recomendado)
        status_mp = None
        if payment_id:
            url = f"https://api.mercadopago.com/v1/payments/{payment_id}"
            resp = requests.get(url, headers={"Authorization": f"Bearer {settings.MP_ACCESS_TOKEN}"}, timeout=15)
            if resp.status_code != 200:
                return Response({"detail": "No se pudo consultar el pago en MP"}, status=status.HTTP_502_BAD_GATEWAY)
            data_mp = resp.json()
            status_mp = data_mp.get("status")  # approved | pending | rejected

            carrito.payment_id = payment_id
            carrito.mp_status = status_mp or carrito.mp_status
            carrito.save(update_fields=["payment_id", "mp_status"])

        # 3) Idempotencia
        if payment_id:
            f_exist = Factura.objects.filter(mp_payment_id=payment_id).first()
            if f_exist:
                return Response(FacturaSerializer(f_exist).data, status=status.HTTP_200_OK)
        if external_ref:
            f_exist = Factura.objects.filter(numero=external_ref).first()
            if f_exist:
                return Response(FacturaSerializer(f_exist).data, status=status.HTTP_200_OK)

        # 4) Preparar payload de creación (items desde el carrito)
        numero = external_ref or f"F-{getattr(carrito, 'id', carrito.pk)}-{int(time.time())}"

        # Pedido: crea si no existe
        pedido = getattr(carrito, "pedido", None)
        if not pedido:
            pedido = Pedido.objects.create(  # <-- AJUSTA campos
                usuario=carrito.usuario,
                total=carrito.calcular_total(),  # <-- AJUSTA
                estado=True
            )

        items = []
        for it in carrito.items.all():
            items.append({
                "producto_id": it.producto_id,
                "talla_id": getattr(it.talla, "id", None),
                "cantidad": int(it.cantidad),
                "precio": str(Decimal(it.precio_unitario)),  # o toma del producto
            })

        payload = {
            "numero": numero,
            "pedido_id": getattr(pedido, 'id', getattr(pedido, 'pk', None)),       # <-- AJUSTA a idPedido si aplica
            "usuario_id": getattr(carrito.usuario, 'id', getattr(carrito.usuario, 'pk', None)),  # <-- AJUSTA
            "moneda": "COP",
            "metodo_pago": "mercadopago",
            "mp_payment_id": payment_id or "",
            "items": items
        }

        ser = FacturaCreateSerializer(data=payload)
        ser.is_valid(raise_exception=True)
        factura = ser.save()

        # 5) Cerrar carrito
        carrito.estado = False  # <-- AJUSTA campo
        carrito.save(update_fields=["estado"])

        return Response(FacturaSerializer(factura).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get"], url_path="pdf", url_name="pdf")
    def pdf(self, request, pk=None):
        """
        Devuelve el PDF de la factura como application/pdf.
        Implementa UNA de estas variantes:
        A) si guardas el archivo en un FileField (ej: factura.archivo_pdf)
        B) si lo generas al vuelo (servicio/generador)
        """

        factura = get_object_or_404(Factura, pk=pk)

        # === Variante A: archivo guardado en modelo ===
        if hasattr(factura, "archivo_pdf") and factura.archivo_pdf:
            # archivo_pdf es un FileField
            return FileResponse(
                factura.archivo_pdf.open("rb"),
                content_type="application/pdf",
                as_attachment=False,  # true si prefieres descarga automática
                filename=f"Factura_{factura.numero or factura.pk}.pdf",
            )

        # === Variante B: generar al vuelo (ejemplo genérico) ===
        # pdf_bytes = tu_servicio_generar_pdf(factura)  # <-- implementa tu lógica
        # return HttpResponse(pdf_bytes, content_type="application/pdf")

        # Si no hay PDF disponible:
        return Response(
            {"detail": "PDF no disponible para esta factura."},
            status=status.HTTP_404_NOT_FOUND,
        )
    
    def get_queryset(self):
        qs = (
            Factura.objects
            .select_related("usuario", "pedido")
            .all()
        )

        user = self.request.user
        if not user.is_superuser and not user.is_staff:
            qs = qs.filter(usuario=user)  # ✅ solo mis facturas

        # Filtros opcionales
        numero = self.request.query_params.get("numero")
        if numero:
            qs = qs.filter(numero__icontains=numero)

        f_desde = self.request.query_params.get("fecha_desde")
        f_hasta = self.request.query_params.get("fecha_hasta")
        estado = self.request.query_params.get("estado")

        # Usa emitida_en si existe, si no, quita filtro de fecha
        fecha_field = "emitida_en" if hasattr(Factura, "emitida_en") else None
        if fecha_field:
            if f_desde:
                qs = qs.filter(**{f"{fecha_field}__date__gte": f_desde})
            if f_hasta:
                qs = qs.filter(**{f"{fecha_field}__date__lte": f_hasta})

        if estado:
            qs = qs.filter(estado=estado)

        # Ordena por fecha si existe, si no, solo por PK
        if fecha_field:
            return qs.order_by(f"-{fecha_field}", "-pk")
        return qs.order_by("-pk")


class SubcategoriaViewSet(viewsets.ModelViewSet):
    queryset = Subcategoria.objects.all()
    serializer_class = SubcategoriaSerializer
    permission_classes = [IsAuthenticated, IsAdminWriteClienteRead, AllowGuestReadOnly]  # Por definir

    def perform_create(self, serializer):
        try:
            # Obtener el primer grupo de tallas activo como grupo por defecto
            grupo_talla_default = GrupoTalla.objects.filter(estado=True).first()
            
            # Si no hay grupos de tallas disponibles, crear la subcategoría sin grupo
            if not grupo_talla_default:
                print("Advertencia: No hay grupos de talla disponibles, creando subcategoría sin grupo")
                serializer.save()
            else:
                # Guardar la subcategoría con el grupo de tallas por defecto
                serializer.save(grupoTalla=grupo_talla_default)
        except Exception as e:
            print(f"Error en perform_create: {str(e)}")
            raise serializers.ValidationError(f"Error al crear la subcategoría: {str(e)}")

    @action(detail=False, methods=['post'])
    def asignar_grupo_talla_default(self, request):
        """
        Asigna el grupo de tallas por defecto a todas las subcategorías que no tienen grupo asignado.
        """
        try:
            # Obtener el primer grupo de tallas activo como grupo por defecto
            grupo_talla_default = GrupoTalla.objects.filter(estado=True).first()
            if not grupo_talla_default:
                return Response(
                    {'error': 'No hay grupos de talla disponibles para asignar por defecto'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Obtener todas las subcategorías sin grupo de tallas
            subcategorias_sin_grupo = Subcategoria.objects.filter(
                estado=True,
                grupoTalla__isnull=True
            )

            # Contador de subcategorías actualizadas
            actualizadas = 0

            # Asignar el grupo por defecto a cada subcategoría
            for subcategoria in subcategorias_sin_grupo:
                subcategoria.grupoTalla = grupo_talla_default
                subcategoria.save()
                actualizadas += 1

            return Response({
                'mensaje': f'Se asignó el grupo de tallas por defecto a {actualizadas} subcategorías',
                'grupo_talla_default': {
                    'id': grupo_talla_default.idGrupoTalla,
                    'nombre': grupo_talla_default.nombre
                }
            })

        except Exception as e:
            print("Error al asignar grupo de tallas por defecto:", str(e))
            import traceback
            print("Traceback:", traceback.format_exc())
            return Response(
                {'error': 'Error al asignar el grupo de tallas por defecto'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['put'])
    def actualizar_stock_minimo(self, request, pk=None):
        try:
            subcategoria = self.get_object()
            stock_minimo = request.data.get('stockMinimo')
            
            if stock_minimo is None:
                return Response(
                    {'error': 'El stock mínimo es requerido'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                stock_minimo = int(stock_minimo)
            except ValueError:
                return Response(
                    {'error': 'El stock mínimo debe ser un número entero'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if stock_minimo < 0:
                return Response(
                    {'error': 'El stock mínimo no puede ser negativo'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            subcategoria.stockMinimo = stock_minimo
            subcategoria.save()
            
            serializer = self.get_serializer(subcategoria)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['put'])
    def actualizar_grupo_talla(self, request, pk=None):
        try:
            print("Datos recibidos:", request.data)  # Debug
            print("Tipo de datos:", type(request.data))  # Debug
            
            subcategoria = self.get_object()
            grupo_talla_id = request.data.get('grupoTalla')
            
            print("ID de grupo de talla recibido:", grupo_talla_id)  # Debug
            
            # Validar que se proporcionó un ID de grupo de talla
            if grupo_talla_id is None or grupo_talla_id == '':
                return Response(
                    {'error': 'Se requiere un ID de grupo de talla'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validar que no se está intentando establecer a null
            if grupo_talla_id == 'null' or grupo_talla_id == 'None':
                return Response(
                    {'error': 'No se permite quitar el grupo de talla'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                # Convertir a entero si es string
                if isinstance(grupo_talla_id, str):
                    grupo_talla_id = int(grupo_talla_id)
            except (ValueError, TypeError):
                return Response(
                    {'error': 'El ID del grupo de talla debe ser un número válido'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                grupo_talla = GrupoTalla.objects.get(idGrupoTalla=grupo_talla_id)
                
                # Validar que no es el mismo grupo
                if subcategoria.grupoTalla and subcategoria.grupoTalla.idGrupoTalla == grupo_talla_id:
                    return Response(
                        {'error': 'La subcategoría ya tiene asignado este grupo de talla'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                subcategoria.grupoTalla = grupo_talla
                subcategoria.save()
                
                serializer = self.get_serializer(subcategoria)
                return Response(serializer.data)
                
            except GrupoTalla.DoesNotExist:
                return Response(
                    {'error': f'No existe el grupo de talla con ID {grupo_talla_id}'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
        except Exception as e:
            print("Error inesperado:", str(e))  # Debug
            import traceback
            print("Traceback:", traceback.format_exc())  # Debug
            return Response(
                {'error': 'Error al actualizar el grupo de tallas'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def por_categoria(self, request):
        categoria_id = request.query_params.get('categoria')
        if not categoria_id:
            return Response(
                {'error': 'El ID de la categoría es requerido'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            subcategorias = self.queryset.filter(categoria_id=categoria_id)
            serializer = self.get_serializer(subcategorias, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


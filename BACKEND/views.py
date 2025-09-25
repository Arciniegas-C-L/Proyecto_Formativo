# --- Python stdlib
import json
import random
import string
import time
from datetime import timedelta, datetime
from decimal import Decimal
import io
from django.db.models import Prefetch
from django.core.mail import EmailMessage


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
from rest_framework.pagination import PageNumberPagination

# --- DRF
from rest_framework import status, viewsets, serializers, mixins
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
    IsAdminWriteClienteRead,
    AdminandCliente,
    ComentarioPermission,
    IsAdmin,
    IsCliente,
    AdminandCliente,
    OpenReadOnly,
    CarritoAnonimoMenosPago,
    IsAdminWriteClienteRead,
    ComentarioPermission,
    IsAdminOrReadOnly,

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
    Direccion,
    SalesRangeReport,
    SalesRangeReportItem,
)
from django.db.models import Min

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
    CrearPreferenciaPagoSerializer,
    SalesRangeReportSerializer,
    SalesRangeReportItemSerializer,
    GenerarSalesRangeReportSerializer,
)
from .reportes_rango import build_range_report
from rest_framework import mixins

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import mm

# --- Utilidades adicionales
from io import BytesIO
from django.db.models import Sum
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_RIGHT, TA_CENTER, TA_LEFT
from reportlab.lib import colors
from django.core.mail import EmailMultiAlternatives


# --- SDK Mercado Pago (usa tu token de settings)
sdk = mercadopago.SDK(settings.MP_ACCESS_TOKEN)


class ComentarioViewSet(viewsets.ModelViewSet):
    queryset = Comentario.objects.select_related('usuario').all().order_by('-fecha')
    serializer_class = ComentarioSerializer
    permission_classes = [ComentarioPermission]

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
    permission_classes = [IsAdminWriteClienteRead]

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

    # >>> Eliminado el action 'guest' que emitía tokens para el rol 'Invitado'.
    #     No se modificó nada más en el ViewSet.

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

            # Verificar si ya hay un código activo en los últimos 3 minutos
            codigo_activo = CodigoRecuperacion.objects.filter(
                usuario=usuario, creado__gte=timezone.now() - timedelta(minutes=3)
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
    permission_classes = [IsAuthenticated, IsAdminWriteClienteRead]

class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    permission_classes = [IsAuthenticated, IsAdminWriteClienteRead]

class ProductoView(viewsets.ModelViewSet):
    serializer_class = ProductoSerializer
    permission_classes = [CarritoAnonimoMenosPago]
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
    permission_classes = [IsAuthenticated, IsAdminWriteClienteRead]

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
    permission_classes = [IsAuthenticated, IsAdminWriteClienteRead]

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

from django.db import models, transaction
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

# Asumo que ya tienes estos modelos/serializers/permissions importados en tu archivo:
# from .models import Categoria, Subcategoria, Producto, Inventario, GrupoTalla
# from .serializers import InventarioSerializer, InventarioAgrupadoSerializer
# from .permissions import IsAuthenticated, IsAdminWriteClienteRead, AllowGuestReadOnly


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
    permission_classes = [IsAuthenticated, IsAdminWriteClienteRead]

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

    # ==============================
    # Consultas por agrupación
    # ==============================
    @action(detail=False, methods=['get'])
    def por_categoria(self, request):
        categoria_id = request.query_params.get('categoria_id')
        if not categoria_id:
            return Response({"error": "Se requiere el ID de la categoría"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            categoria = Categoria.objects.filter(idCategoria=categoria_id).first()
            if not categoria:
                return Response({"error": f"No existe la categoría con ID {categoria_id}"}, status=status.HTTP_404_NOT_FOUND)

            subcategorias = Subcategoria.objects.filter(categoria_id=categoria_id)
            subcategorias_ids = list(subcategorias.values_list('idSubcategoria', flat=True))

            productos = Producto.objects.filter(subcategoria__in=subcategorias_ids)
            productos_ids = list(productos.values_list('id', flat=True))

            # Traer inventario solo de tallas que pertenecen al grupo actual de cada subcategoría
            inventario = self.queryset.filter(
                producto__in=productos_ids,
                talla__grupo=models.F('producto__subcategoria__grupoTalla')
            ).select_related(
                'producto',
                'producto__subcategoria',
                'producto__subcategoria__categoria',
                'talla'
            )

            inventario_por_subcategoria = {}
            for inv in inventario:
                sid = inv.producto.subcategoria.idSubcategoria
                inventario_por_subcategoria.setdefault(sid, []).append(inv)

            response_data = {
                "categoria": {"id": categoria.idCategoria, "nombre": categoria.nombre},
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
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def por_subcategoria(self, request):
        subcategoria_id = request.query_params.get('subcategoria_id')
        if not subcategoria_id:
            return Response({"error": "Se requiere el ID de la subcategoría"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            subcategoria = Subcategoria.objects.filter(idSubcategoria=subcategoria_id).first()
            if not subcategoria:
                return Response({"error": f"No existe la subcategoría con ID {subcategoria_id}"},
                                status=status.HTTP_404_NOT_FOUND)

            inventario = self.queryset.filter(
                producto__subcategoria_id=subcategoria_id,
                talla__grupo=subcategoria.grupoTalla  # clave: solo tallas del grupo actual
            ).select_related(
                'producto',
                'producto__subcategoria',
                'producto__subcategoria__categoria',
                'talla'
            )

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
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    # ==============================
    # Utilitarios
    # ==============================
    @action(detail=False, methods=['get'])
    def stock_producto(self, request):
        producto_id = request.query_params.get('producto', None)
        if not producto_id:
            return Response({"error": "Se requiere el ID del producto"}, status=status.HTTP_400_BAD_REQUEST)

        # Asegura coherencia con grupo de la subcategoría del producto
        producto = get_object_or_404(Producto.objects.select_related('subcategoria'), pk=producto_id)
        inventarios = self.queryset.filter(
            producto_id=producto_id,
            talla__grupo=producto.subcategoria.grupoTalla
        )
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

        if not all([producto_id, talla_id, cantidad is not None]):
            return Response({"error": "Se requieren producto_id, talla_id y cantidad"},
                            status=status.HTTP_400_BAD_REQUEST)
        try:
            inventario = self.queryset.get(producto_id=producto_id, talla_id=talla_id)
            inventario.stock_talla = cantidad
            inventario.save(update_fields=['stock_talla'])
            return Response(self.get_serializer(inventario).data)
        except Inventario.DoesNotExist:
            return Response({"error": "No se encontró el inventario para el producto y talla especificados"},
                            status=status.HTTP_404_NOT_FOUND)

    # ==============================
    # Agregados / Tablas
    # ==============================
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
        categorias = Categoria.objects.filter(estado=True).prefetch_related('subcategorias')
        response_data = []
        for categoria in categorias:
            subcategorias = categoria.subcategorias.filter(estado=True)
            response_data.append({
                'id': categoria.idCategoria,
                'nombre': categoria.nombre,
                'estado': categoria.estado,
                'subcategorias': [{
                    'id': sub.idSubcategoria,
                    'nombre': sub.nombre,
                    'estado': sub.estado,
                    'stockMinimo': sub.stockMinimo
                } for sub in subcategorias]
            })
        return Response(response_data)

    @action(detail=False, methods=['get'])
    def productos_por_subcategoria(self, request):
        subcategoria_id = request.query_params.get('subcategoria_id')
        if not subcategoria_id:
            return Response({"error": "Se requiere el ID de la subcategoría"},
                            status=status.HTTP_400_BAD_REQUEST)
        try:
            subcategoria = Subcategoria.objects.select_related('categoria').get(
                idSubcategoria=subcategoria_id,
                estado=True
            )
            productos = Producto.objects.filter(
                subcategoria=subcategoria,
                subcategoria__estado=True
            ).prefetch_related('inventarios__talla')

            productos_data = []
            for producto in productos:
                inventarios = producto.inventarios.filter(talla__grupo=subcategoria.grupoTalla)
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
            return Response({"error": "Subcategoría no encontrada o inactiva"},
                            status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def subcategorias_por_categoria(self, request):
        categoria_id = request.query_params.get('categoria_id')
        if not categoria_id:
            return Response({"error": "Se requiere el ID de la categoría"},
                            status=status.HTTP_400_BAD_REQUEST)
        try:
            categoria = Categoria.objects.get(idCategoria=categoria_id, estado=True)
            subcategorias = Subcategoria.objects.filter(
                categoria=categoria, estado=True
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
            return Response({"error": "Categoría no encontrada o inactiva"},
                            status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def tabla_categorias(self, request):
        categorias = Categoria.objects.filter(estado=True).prefetch_related('subcategorias')
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
        categoria_id = request.query_params.get('categoria_id')
        if not categoria_id:
            return Response({"error": "Se requiere el ID de la categoría"},
                            status=status.HTTP_400_BAD_REQUEST)
        try:
            categoria = Categoria.objects.get(idCategoria=categoria_id, estado=True)
            subcategorias = Subcategoria.objects.filter(
                categoria=categoria, estado=True
            ).select_related('categoria', 'grupoTalla')

            subcategorias_data = []
            for subcategoria in subcategorias:
                productos_count = Producto.objects.filter(subcategoria=subcategoria).count()
                # clave: contar solo stock de tallas del grupo actual
                stock_total = Inventario.objects.filter(
                    producto__subcategoria=subcategoria,
                    talla__grupo=subcategoria.grupoTalla
                ).aggregate(total_stock=models.Sum('stock_talla'))['total_stock'] or 0

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
            return Response({"error": "Categoría no encontrada o inactiva"},
                            status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'])
    def tabla_productos(self, request):
        subcategoria_id = request.query_params.get('subcategoria_id')
        if not subcategoria_id:
            return Response({"error": "Se requiere el ID de la subcategoría"},
                            status=status.HTTP_400_BAD_REQUEST)
        try:
            subcategoria = Subcategoria.objects.select_related('categoria').get(
                idSubcategoria=subcategoria_id,
                estado=True
            )
            productos = Producto.objects.filter(
                subcategoria=subcategoria
            ).prefetch_related('inventarios__talla')

            productos_data = []
            for producto in productos:
                # Solo inventarios cuyas tallas pertenezcan al grupo actual
                inventarios = producto.inventarios.filter(talla__grupo=subcategoria.grupoTalla)

                stock_por_talla = {
                    inv.talla.nombre: {
                        'talla_id': inv.talla.id,
                        'stock': inv.stock_talla,
                        'stock_minimo': inv.stockMinimo,
                        'stock_inicial': inv.cantidad
                    } for inv in inventarios
                }

                stock_total = sum(inv.stock_talla for inv in inventarios)
                stock_minimo_total = sum(inv.stockMinimo for inv in inventarios)
                stock_inicial_total = sum(inv.cantidad for inv in inventarios)

                productos_data.append({
                    'id': producto.id,
                    'nombre': producto.nombre,
                    'descripcion': producto.descripcion,
                    'precio': producto.precio,
                    'stock': producto.stock,
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
            return Response({"error": "Subcategoría no encontrada o inactiva"},
                            status=status.HTTP_404_NOT_FOUND)

    # ==============================
    # Actualización de stock por tallas (modal)
    # ==============================
    @action(detail=False, methods=['post'])
    def actualizar_stock_tallas(self, request):
        producto_id = request.data.get('producto_id')
        tallas_data = request.data.get('tallas', [])

        if not producto_id or not tallas_data:
            return Response({"error": "Se requieren producto_id y tallas"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            producto = Producto.objects.get(id=producto_id)
            inventarios_actualizados = []
            stock_total = 0

            for talla_info in tallas_data:
                talla_id = talla_info.get('talla_id')
                stock = talla_info.get('stock', 0)
                stock_minimo = talla_info.get('stock_minimo', 0)

                if stock < 0 or stock_minimo < 0:
                    return Response({"error": "El stock y stock mínimo no pueden ser negativos"},
                                    status=status.HTTP_400_BAD_REQUEST)

                inv = self.queryset.get(producto_id=producto_id, talla_id=talla_id)
                inv.stock_talla = stock
                inv.stockMinimo = stock_minimo
                inv.save(update_fields=['stock_talla', 'stockMinimo'])

                inventarios_actualizados.append(inv)
                stock_total += stock

            return Response({
                "mensaje": "Stock por tallas actualizado exitosamente",
                "inventarios": self.get_serializer(inventarios_actualizados, many=True).data,
                "stock_total": stock_total
            })

        except Inventario.DoesNotExist:
            return Response({"error": "No se encontró el inventario para una talla especificada"},
                            status=status.HTTP_404_NOT_FOUND)
        except Producto.DoesNotExist:
            return Response({"error": "Producto no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    # ==============================
    # Cambiar grupo de talla y sincronizar inventario
    # ==============================
    @action(detail=False, methods=['post'])
    def set_grupo_talla_subcategoria(self, request):
        """
        Cambia el grupo de tallas de la subcategoría y sincroniza inventarios de todos sus productos:
        - Crea inventarios faltantes para tallas del nuevo grupo.
        - No borra inventarios viejos; las vistas ya filtran por el grupo vigente.
        """
        subcategoria_id = request.data.get('subcategoria_id')
        grupo_talla_id = request.data.get('grupo_talla_id')

        if not subcategoria_id or not grupo_talla_id:
            return Response({"error": "Se requieren subcategoria_id y grupo_talla_id"},
                            status=status.HTTP_400_BAD_REQUEST)

        sub = get_object_or_404(Subcategoria, idSubcategoria=subcategoria_id, estado=True)
        nuevo = get_object_or_404(GrupoTalla, idGrupoTalla=grupo_talla_id, estado=True)

        with transaction.atomic():
            # Actualizar el grupo en la subcategoría
            sub.grupoTalla = nuevo
            sub.save(update_fields=['grupoTalla'])

            # Tallas válidas del nuevo grupo
            tallas_validas_ids = list(nuevo.tallas.filter(estado=True).values_list('id', flat=True))

            # Crear inventarios que falten para cada producto de la subcategoría
            productos = Producto.objects.filter(subcategoria=sub)
            to_create = []
            for p in productos:
                existentes = set(
                    Inventario.objects.filter(producto=p).values_list('talla_id', flat=True)
                )
                for tid in tallas_validas_ids:
                    if tid not in existentes:
                        to_create.append(Inventario(
                            producto=p,
                            talla_id=tid,
                            cantidad=0,
                            stockMinimo=sub.stockMinimo,
                            stock_talla=0
                        ))
            if to_create:
                Inventario.objects.bulk_create(to_create, ignore_conflicts=True)

        return Response({
            "mensaje": "Grupo de talla actualizado y inventario sincronizado.",
            "subcategoria": {"id": sub.idSubcategoria, "nombre": sub.nombre},
            "grupo_talla": {"id": nuevo.idGrupoTalla, "nombre": nuevo.nombre},
            "creados": len(to_create)
        }, status=status.HTTP_200_OK)

class MovimientoView(viewsets.ModelViewSet):
    serializer_class = MovimientoSerializer
    queryset = Movimiento.objects.all()
    permission_classes = [IsAuthenticated, AdminandCliente] #Por definir

# views.py (solo si NO agregas campos al modelo)
class PedidoView(viewsets.ModelViewSet):
    serializer_class = PedidoSerializer
    permission_classes = [IsAuthenticated, AdminandCliente]

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
    permission_classes = [IsAuthenticated, AdminandCliente]

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
    permission_classes = [IsAuthenticated, AdminandCliente] #Por definir

class TipoPagoView(viewsets.ModelViewSet):
    serializer_class = TipoPagoSerializer
    queryset = TipoPago.objects.all()
    permission_classes = [IsAuthenticated, AdminandCliente] #Por definir

class CarritoView(viewsets.ModelViewSet):
    permission_classes = [CarritoAnonimoMenosPago]
    serializer_class = CarritoSerializer
    # dentro de CarritoView
    def _ensure_pedido_from_carrito(self, carrito):
        """
        Garantiza que exista un Pedido asociado al carrito.
        Si ya existe, lo retorna; si no, lo crea con el total del carrito.
        """
        # Si ya tienes relación Carrito->Pedido:
        pedido = getattr(carrito, "pedido", None)
        if pedido:
            return pedido

        # Calcula total del carrito sin romper por campos faltantes
        total = Decimal("0")
        try:
            # si tu modelo Carrito ya tiene método calcular_total():
            t = carrito.calcular_total()
            total = Decimal(str(t))
        except Exception:
            # fallback: sumar item a item
            for it in carrito.items.all():
                precio = Decimal(str(getattr(it, "precio_unitario", 0) or 0))
                cantidad = Decimal(str(getattr(it, "cantidad", 0) or 0))
                sub = getattr(it, "subtotal", None)
                sub = Decimal(str(sub)) if sub is not None else (precio * cantidad)
                total += sub

        from .models import Pedido
        pedido = Pedido.objects.create(
            usuario=carrito.usuario,
            total=total,
            estado=True
        )

        # Si Carrito tiene campo para enlazarlo, persiste el vínculo:
        if hasattr(carrito, "pedido"):
            carrito.pedido = pedido
            carrito.save(update_fields=["pedido"])

        return pedido

    def list(self, request, *args, **kwargs):
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
        Acepta flags del front: skip_stock / reserve
        """
        skip_stock = bool(request.data.get('skip_stock', False))
        reserve    = bool(request.data.get('reserve', False))

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
            return Response({"error": f"Error al actualizar la cantidad: {str(e)}"}, status=400)

    @action(detail=True, methods=['post'])
    def eliminar_producto(self, request, pk=None):
        """
        Elimina un item del carrito. NO devuelve stock aquí.
        Acepta flags del front: skip_stock / reserve
        """
        skip_stock = bool(request.data.get('skip_stock', False))
        reserve    = bool(request.data.get('reserve', False))

        carrito = self.get_object()
        item_id = request.data.get('item_id')
        try:
            item = CarritoItem.objects.get(idCarritoItem=item_id, carrito=carrito)
            item.delete()
            return Response(CarritoSerializer(carrito).data, status=200)
        except CarritoItem.DoesNotExist:
            return Response({"error": "Item no encontrado en el carrito"}, status=404)

    @action(detail=True, methods=['post'])
    def limpiar_carrito(self, request, pk=None):
        """
        Limpia el carrito. NO modifica inventario aquí.
        Acepta flags del front: skip_stock / reserve
        """
        skip_stock = bool(request.data.get('skip_stock', False))
        reserve    = bool(request.data.get('reserve', False))

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
        carrito = self.get_object()

        # ---- 0) Sanitizar entrada ----
        data = request.data or {}
        email = data.get("email") or getattr(carrito.usuario, "email", None) or "test_user@example.com"
        address = data.get("address")  # opcional; puede venir del front

        # Guardar dirección (solo 'direccion' string) si llegó address
        if address:
            # arma una sola línea con lo que tengas
            linea = ", ".join([
                str(address.get("linea1", "")).strip(),
                str(address.get("linea2", "")).strip(),
                str(address.get("referencia", "")).strip()
            ]).strip(", ").strip()
            if linea:
                try:
                    Direccion.objects.create(
                        usuario=carrito.usuario,
                        direccion=linea[:255]  # tu CharField max_length=255
                    )
                except ValidationError as ve:
                    # tu modelo puede lanzar ValidationError si hay reglas de negocio
                    return Response({"error": ve.detail if hasattr(ve, "detail") else str(ve)},
                                    status=status.HTTP_400_BAD_REQUEST)

        if carrito.items.count() == 0:
            return Response({"error": "El carrito está vacío"}, status=status.HTTP_400_BAD_REQUEST)

        # ---- 1) Asegurar Pedido (usa tu helper) ----
        try:
            pedido = self._ensure_pedido_from_carrito(carrito)
        except Exception as e:
            return Response({"error": f"No se pudo preparar el pedido: {str(e)}"}, status=500)

        # ---- 2) Construir ítems para MP ----
        items_mp, total = [], 0.0
        for it in carrito.items.select_related("producto").all():
            unit_price = float(getattr(it, "precio_unitario", None) or getattr(it.producto, "precio", 0) or 0)
            qty = int(it.cantidad or 0)
            if unit_price <= 0 or qty <= 0:
                return Response({"error": "Precio o cantidad inválidos en algún ítem"}, status=400)

            items_mp.append({
                "id": str(getattr(it.producto, "id", getattr(it.producto, "pk", ""))),
                "title": getattr(it.producto, "nombre", "Producto"),
                "quantity": qty,
                "unit_price": unit_price,
                "currency_id": "COP",
            })
            total += unit_price * qty

        if total <= 0:
            return Response({"error": "El total del carrito debe ser mayor a 0"}, status=400)

        # ---- 3) Snapshot opcional y refs ----
        if address and hasattr(carrito, "shipping_snapshot"):
            try:
                carrito.shipping_snapshot = address
                carrito.save(update_fields=["shipping_snapshot"])
            except Exception:
                pass

        external_ref = f"ORDER-{carrito.idCarrito}-{int(time.time())}"
        carrito.external_reference = external_ref
        carrito.mp_status = "pending"
        carrito.save(update_fields=["external_reference", "mp_status"])

        # Valores por defecto si no están en settings
        frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
        frontend_return_path = getattr(settings, "FRONTEND_RETURN_PATH", "/pagos/retorno")
        return_url = f"{frontend_url}{frontend_return_path}?carritoId={carrito.idCarrito}"

        preference_data = {
            "items": items_mp,
            "payer": {"email": email},
            "external_reference": external_ref,
            "back_urls": {"success": return_url, "failure": return_url, "pending": return_url},
            "notification_url": getattr(settings, "MP_NOTIFICATION_URL", f"{frontend_url}/mp/webhook"),
        }
        if address:
            preference_data["metadata"] = {"address": address}
        if getattr(settings, "MP_SEND_AUTO_RETURN", False):
            preference_data["auto_return"] = "approved"

        # ---- 4) Llamada a MP con manejo de errores ----
        try:
            resp = requests.post(
                "https://api.mercadopago.com/checkout/preferences",
                headers={
                    "Authorization": f"Bearer {getattr(settings, 'MP_ACCESS_TOKEN', '')}",
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

        return Response(
            {"id": preference.get("id"), "init_point": preference.get("init_point")},
            status=status.HTTP_201_CREATED
        )

class CarritoItemView(viewsets.ModelViewSet):
    serializer_class = CarritoItemSerializer
    permission_classes = [CarritoAnonimoMenosPago]  # Permite acceso a admin y cliente

    def get_queryset(self):
        if self.request.user.is_authenticated:
            # Si el usuario está autenticado, mostrar items de sus carritos
            return CarritoItem.objects.filter(carrito__usuario=self.request.user)
        # Si no está autenticado, mostrar items de carritos sin usuario
        return CarritoItem.objects.filter(carrito__usuario__isnull=True)


class EstadoCarritoView(viewsets.ModelViewSet):
    serializer_class = EstadoCarritoSerializer
    permission_classes = [IsAuthenticated, AdminandCliente]

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


# =========================
# HELPERS (money/fecha/estado) Desde 
# =========================
def fmt_money(value, currency="COP"):
    """
    12.345,67 COP — acepta Decimal/str/float/None
    """
    try:
        n = float(Decimal(str(value or 0)))
    except Exception:
        n = 0.0
    return f"{n:,.2f} {currency}".replace(",", "X").replace(".", ",").replace("X", ".")


def _parse_dt(val):
    """
    Convierte str ISO / datetime naive/aware a datetime aware en TZ local.
    Regla:
      - Si trae 'Z' u offset (+hh:mm / -hh:mm): respetar esa zona.
      - Si NO trae zona: asumir UTC (lo más seguro en APIs y BD).
    """
    if val in (None, ""):
        return None
    try:
        # 1) Parse
        if isinstance(val, str):
            s = val.strip()
            # Normaliza sufijo Z a +00:00 para fromisoformat
            if s.endswith("Z"):
                s = s[:-1] + "+00:00"
            try:
                dt = datetime.fromisoformat(s)
            except Exception:
                # corta a segundos para strings tipo 'YYYY-MM-DDTHH:MM:SS(.ms)?'
                base = s[:19]
                dt = datetime.strptime(base, "%Y-%m-%dT%H:%M:%S")
        else:
            dt = val

        # 2) Si no tiene tzinfo, ASUMIR UTC (no local)
        if timezone.is_naive(dt):
            dt = timezone.make_aware(dt, timezone.utc)

        # 3) Convertir a la tz local de Django
        return dt.astimezone(timezone.get_current_timezone())
    except Exception:
        return None

def fmt_date(value):
    dt = _parse_dt(value)
    return dt.strftime("%d/%m/%Y %H:%M") if dt else "—"


def estado_badge(estado):
    """
    Devuelve (texto, color_texto, color_fondo)
    Acepta estados internos o de MP.
    """
    est = (estado or "").lower()
    if est in ("pagada", "approved"):
        return ("PAGADA", colors.white, colors.green)
    if est in ("pendiente", "pending", "in_process", "authorized"):
        return ("PENDIENTE", colors.black, colors.yellow)
    if est in ("anulada", "rejected", "cancelled", "refunded", "charged_back"):
        return ("ANULADA", colors.white, colors.red)
    return ("SIN ESTADO", colors.white, colors.grey)


def map_mp_to_estado_factura(mp_status: str) -> str:
    mp = (mp_status or "").lower()
    if mp == "approved":
        return "pagada"
    if mp in ("in_process", "pending", "authorized"):
        return "pendiente"
    if mp in ("rejected", "cancelled", "refunded", "charged_back"):
        return "anulada"
    return "emitida"

def _addr_from_snapshot(snap: dict) -> str:
    if not isinstance(snap, dict):
        return ""
    partes = [
        str(snap.get("linea1", "")).strip(),
        str(snap.get("linea2", "")).strip(),
        str(snap.get("referencia", "")).strip(),
        " ".join([
            str(snap.get("ciudad", "")).strip(),
            str(snap.get("departamento", "")).strip()
        ]).strip()
    ]
    txt = ", ".join([p for p in partes if p])
    return txt[:255]


def _factura_pdf_bytes(factura):
    """
    Construye un PDF MUY breve de la factura y retorna (filename, bytes).
    Usa ReportLab para evitar tocar tu endpoint PDF largo.
    """
    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter, leftMargin=36, rightMargin=36, topMargin=36, bottomMargin=36)
    styles = getSampleStyleSheet()
    story = []

    titulo = f"Factura {getattr(factura, 'numero', None) or factura.pk}"
    story.append(Paragraph(titulo, styles["Heading1"]))
    story.append(Spacer(1, 6))

    # Encabezado
    cliente = (
        getattr(factura, "cliente_nombre", None)
        or getattr(getattr(factura, "usuario", None), "nombre", None)
        or getattr(getattr(factura, "usuario", None), "first_name", None)
        or getattr(getattr(factura, "usuario", None), "username", None)
        or "—"
    )
    fecha = getattr(factura, "emitida_en", None) or getattr(factura, "created_at", None)
    datos = [
        ["Cliente:", cliente],
        ["Fecha:", fmt_date(fecha)],
        ["Moneda:", getattr(factura, "moneda", None) or "COP"],
        ["Estado:", getattr(factura, "estado", "") or "emitida"],
    ]
    t_meta = Table(datos, colWidths=[80, 400])
    t_meta.setStyle(TableStyle([
        ("FONTNAME", (0,0), (-1,-1), "Helvetica"),
        ("FONTSIZE", (0,0), (-1,-1), 10),
        ("BOTTOMPADDING", (0,0), (-1,-1), 4),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 6))

    # Items
    rows = [["Descripción", "Cant.", "P. Unit", "Subtotal"]]
    items = list(factura.items.all())
    for it in items:
        desc = getattr(it, "descripcion", None) or (getattr(it, "producto", None) and getattr(it.producto, "nombre", None)) or "-"
        qty  = int(getattr(it, "cantidad", 0) or 0)
        unit = getattr(it, "precio", 0)
        sub  = getattr(it, "subtotal", None)
        if sub is None:
            try:
                sub = Decimal(str(unit)) * Decimal(str(qty))
            except Exception:
                sub = 0
        rows.append([desc, str(qty), fmt_money(unit, factura.moneda or "COP"), fmt_money(sub, factura.moneda or "COP")])

    t_items = Table(rows, colWidths=[300, 60, 90, 90])
    t_items.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#1fb2d2")),
        ("TEXTCOLOR", (0,0), (-1,0), colors.white),
        ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
        ("GRID", (0,0), (-1,-1), 0.5, colors.HexColor("#1fb2d2")),
        ("ALIGN", (1,1), (1,-1), "CENTER"),
        ("ALIGN", (2,1), (3,-1), "RIGHT"),
        ("FONTSIZE", (0,0), (-1,-1), 9),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, colors.whitesmoke]),
    ]))
    story.append(t_items)
    story.append(Spacer(1, 8))

    # Totales
    total = getattr(factura, "total", 0)
    tot_tbl = Table([["TOTAL:", fmt_money(total, factura.moneda or "COP")]], colWidths=[350, 100])
    tot_tbl.setStyle(TableStyle([
        ("FONTNAME", (0,0), (-1,-1), "Helvetica-Bold"),
        ("FONTSIZE", (0,0), (-1,-1), 12),
        ("ALIGN", (1,0), (1,0), TA_RIGHT),
    ]))
    story.append(tot_tbl)

    doc.build(story)
    buf.seek(0)
    filename = f"Factura_{getattr(factura, 'numero', None) or factura.pk}.pdf"
    return filename, buf.read()

def _get_email_destino_factura(factura):
    # 1) Campos denormalizados de factura
    for attr in ("cliente_email", "usuario_email", "email"):
        val = getattr(factura, attr, None)
        if val:
            return val
    # 2) Del usuario asociado
    u = getattr(factura, "usuario", None)
    if u:
        for attr in ("email", "correo", "correo_electronico"):
            val = getattr(u, attr, None)
            if val:
                return val
    return None

def _send_factura_email(request, factura):
    """
    Envía por correo la factura con PDF adjunto.
    Retorna True si al menos intenta enviar; False si no hay correo.
    """
    to_email = _get_email_destino_factura(factura)
    if not to_email:
        return False  # sin correo, no se envía

    subject = f"Tu factura {getattr(factura, 'numero', None) or factura.pk}"
    body = (
        "Hola,\n\n"
        "Adjuntamos tu factura de compra. Gracias por preferirnos.\n\n"
        "— Variedad y Estilos ZOE"
    )

    # Construir PDF adjunto
    filename, pdf_bytes = _factura_pdf_bytes(factura)

    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", None) or getattr(settings, "EMAIL_HOST_USER", None)
    email = EmailMessage(subject=subject, body=body, from_email=from_email, to=[to_email])
    email.attach(filename, pdf_bytes, "application/pdf")
    # Si tienes logo u otros adjuntos, puedes añadirlos aquí.
    email.send(fail_silently=True)
    return True

# =========================
# VISTA
# =========================
class FacturaView(viewsets.ModelViewSet):
    queryset = Factura.objects.select_related("usuario", "pedido").all()
    serializer_class = FacturaSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=["post"])
    def crear_desde_pago(self, request):
        """
        Crea una factura (idempotente) a partir de un pago de Mercado Pago.

        Body:
        {
          "payment_id": "125178556047",
          "external_reference": "ORDER-2-1757556908",
          "carrito_id": 2,
          "address": { nombre, telefono, departamento, ciudad, linea1, linea2, referencia }  # opcional
        }
        """
        from rest_framework.exceptions import ValidationError as DRFValidationError

        data         = request.data or {}
        payment_id   = str(data.get("payment_id") or "").strip()
        external_ref = str(data.get("external_reference") or "").strip()
        carrito_id   = data.get("carrito_id")
        address      = data.get("address") or {}

        if not external_ref and not carrito_id and not payment_id:
            return Response(
                {"detail": "Debes enviar external_reference o carrito_id o payment_id"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # -------------------------
        # 0) Resolver carrito (sin select_for_update para evitar lock en SQLite)
        # -------------------------
        try:
            qs = Carrito.objects.select_related("usuario").prefetch_related("items")
            if external_ref:
                carrito = qs.get(external_reference=external_ref)
            elif carrito_id:
                carrito = qs.get(pk=carrito_id)
                external_ref = carrito.external_reference or external_ref
            else:
                carrito = qs.get(payment_id=payment_id)
                external_ref = carrito.external_reference or external_ref
        except Carrito.DoesNotExist:
            return Response({"detail": "Carrito no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        if carrito.items.count() == 0:
            return Response({"detail": "El carrito está vacío"}, status=status.HTTP_400_BAD_REQUEST)

        # -------------------------
        # 1) Consultar estado en MP FUERA del atomic (menos tiempo con lock)
        # -------------------------
        status_mp = None
        if payment_id:
            try:
                url = f"https://api.mercadopago.com/v1/payments/{payment_id}"
                resp = requests.get(
                    url,
                    headers={"Authorization": f"Bearer {settings.MP_ACCESS_TOKEN}"},
                    timeout=15
                )
                if resp.status_code == 200:
                    data_mp = resp.json()
                    status_mp = data_mp.get("status")  # approved | pending | rejected
                # si falla, continuamos con None
            except Exception:
                pass

        # -------------------------
        # 2) Idempotencia (antes de crear nada)
        # -------------------------
        if payment_id:
            f_exist = Factura.objects.filter(mp_payment_id=payment_id).first()
            if f_exist:
                return Response(FacturaSerializer(f_exist).data, status=status.HTTP_200_OK)
        if external_ref:
            f_exist = Factura.objects.filter(numero=external_ref).first()
            if f_exist:
                return Response(FacturaSerializer(f_exist).data, status=status.HTTP_200_OK)

        # Helper local dirección
        def _addr_line(a: dict) -> str:
            if not isinstance(a, dict):
                return ""
            partes = [
                str(a.get("linea1", "")).strip(),
                str(a.get("linea2", "")).strip(),
                str(a.get("referencia", "")).strip(),
                " ".join([str(a.get("ciudad", "")).strip(), str(a.get("departamento", "")).strip()]).strip()
            ]
            txt = ", ".join([p for p in partes if p])
            return txt[:255]

        linea_dir = _addr_line(address) if address else ""
        if not linea_dir and hasattr(carrito, "shipping_snapshot"):
            linea_dir = _addr_line(getattr(carrito, "shipping_snapshot", {}) or {})

        # -------------------------
        # 3) Crear todo dentro de atomic (pero rápido)
        # -------------------------
        with transaction.atomic():
            # Asegurar external_reference en el carrito (si no tenía)
            if external_ref and carrito.external_reference != external_ref:
                carrito.external_reference = external_ref
                try:
                    carrito.save(update_fields=["external_reference"])
                except Exception:
                    pass

            # Persistir payment_id / mp_status rápidamente (si tenemos)
            if payment_id and (carrito.payment_id != payment_id or carrito.mp_status != status_mp):
                carrito.payment_id = payment_id
                carrito.mp_status  = status_mp or carrito.mp_status
                try:
                    carrito.save(update_fields=["payment_id", "mp_status"])
                except Exception:
                    # si hay lock, no abortamos la factura
                    pass

            # Asegurar Pedido
            pedido = getattr(carrito, "pedido", None)
            if not pedido:
                total = Decimal("0")
                for it in carrito.items.all():
                    pu  = Decimal(str(getattr(it, "precio_unitario", 0) or 0))
                    qty = Decimal(str(getattr(it, "cantidad", 0) or 0))
                    sub = getattr(it, "subtotal", None)
                    sub = Decimal(str(sub)) if sub is not None else (pu * qty)
                    total += sub
                pedido = Pedido.objects.create(usuario=carrito.usuario, total=total, estado=True)

            # Items para la factura
            items_payload = []
            for it in carrito.items.all():
                items_payload.append({
                    "producto_id": it.producto_id,
                    "talla_id": getattr(it.talla, "id", None),
                    "cantidad": int(it.cantidad),
                    "precio": str(Decimal(getattr(it, "precio_unitario", 0) or 0)),
                })

            numero = external_ref or f"F-{getattr(carrito, 'id', carrito.pk)}-{int(time.time())}"
            payload = {
                "numero": numero,
                "pedido_id": getattr(pedido, 'id', getattr(pedido, 'pk', None)),
                "usuario_id": getattr(carrito.usuario, 'id', getattr(carrito.usuario, 'pk', None)),
                "moneda": "COP",
                "metodo_pago": "mercadopago",
                "mp_payment_id": payment_id or "",
                "items": items_payload
            }

            ser = FacturaCreateSerializer(data=payload)
            ser.is_valid(raise_exception=True)
            factura = ser.save()

            # Denormalizar email/nombre
            update_fields = []
            if hasattr(factura, "cliente_email"):
                em = (getattr(carrito.usuario, "email", "") or getattr(carrito.usuario, "correo", "") or "").strip()
                if em and em != getattr(factura, "cliente_email", ""):
                    factura.cliente_email = em
                    update_fields.append("cliente_email")
            if hasattr(factura, "cliente_nombre"):
                nm = (
                    getattr(carrito.usuario, "nombre", None)
                    or getattr(carrito.usuario, "first_name", None)
                    or getattr(carrito.usuario, "username", None)
                    or ""
                ).strip()
                if nm and nm != getattr(factura, "cliente_nombre", ""):
                    factura.cliente_nombre = nm
                    update_fields.append("cliente_nombre")
            if linea_dir and hasattr(factura, "direccion"):
                if linea_dir != (getattr(factura, "direccion", "") or ""):
                    factura.direccion = linea_dir
                    update_fields.append("direccion")

            # Ajustar estado por MP si lo tenemos
            if status_mp:
                nuevo_estado = map_mp_to_estado_factura(status_mp)
                if nuevo_estado != getattr(factura, "estado", "emitida"):
                    factura.estado = nuevo_estado
                    if "estado" not in update_fields:
                        update_fields.append("estado")

            if update_fields:
                factura.save(update_fields=update_fields)

            # Registrar también en Direccion (sin romper el flujo si falla)
            if linea_dir:
                try:
                    from .models import Direccion
                    Direccion.objects.create(usuario=carrito.usuario, direccion=linea_dir)
                except DRFValidationError:
                    pass
                except Exception:
                    pass

            # Cerrar carrito
            try:
                carrito.estado = False
                carrito.save(update_fields=["estado"])
            except Exception:
                pass

        # -------------------------
        # 4) (Opcional) enviar email con comprobante/factura
        # -------------------------
        try:
            _send_factura_email(request, factura)
        except Exception:
            pass

        return Response(FacturaSerializer(factura).data, status=status.HTTP_201_CREATED)
    
    #Factura en PDF Camila

    @action(detail=True, methods=["get"], url_path="pdf", url_name="pdf")
    def pdf(self, request, pk=None):
        # ------- datos base -------
        factura = get_object_or_404(
            Factura.objects.select_related("usuario", "pedido").prefetch_related("items"),
            pk=pk
        )

        from io import BytesIO
        from reportlab.lib.pagesizes import letter
        from reportlab.lib.units import mm
        from reportlab.lib.enums import TA_RIGHT, TA_CENTER, TA_LEFT
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

        def money(v, cur=None):
            cur = cur or (getattr(factura, "moneda", None) or "COP")
            try:
                n = float(Decimal(str(v or 0)))
            except Exception:
                n = 0.0
            return f"{n:,.2f} {cur}".replace(",", "X").replace(".", ",").replace("X", ".")

        def dmy_hm(dt):
            if not dt:
                return "—"
            try:
                if isinstance(dt, str):
                    try:
                        dt = datetime.fromisoformat(dt.replace("Z", "+00:00"))
                    except Exception:
                        dt = datetime.strptime(dt[:19], "%Y-%m-%dT%H:%M:%S")
                if timezone.is_naive(dt):
                    dt = timezone.make_aware(dt, timezone.get_current_timezone())
                dt = dt.astimezone(timezone.get_current_timezone())
                return dt.strftime("%d/%m/%Y %H:%M")
            except Exception:
                return str(dt)

        # ------- colores del proyecto -------
        color_primary = colors.HexColor("#1fb2d2")  # Cyan principal
        color_secondary = colors.HexColor("#2c3e50")  # Azul oscuro
        color_accent = colors.HexColor("#16a085")  # Verde azulado
        color_bg_light = colors.HexColor("#f8f9fa")  # Fondo claro
        color_text_dark = colors.HexColor("#2c3e50")  # Texto oscuro
        color_text_light = colors.HexColor("#6c757d")  # Texto claro

        # ------- documento -------
        buf = BytesIO()
        doc = SimpleDocTemplate(
            buf, pagesize=letter,
            leftMargin=20*mm, rightMargin=20*mm,
            topMargin=18*mm, bottomMargin=18*mm,
            title=f"Factura {getattr(factura,'numero', factura.pk)}"
        )

        styles = getSampleStyleSheet()
        
        # Estilos personalizados con colores del proyecto
        styles.add(ParagraphStyle(
            name="h1center", 
            parent=styles["Heading1"], 
            alignment=TA_CENTER, 
            spaceAfter=12,
            textColor=color_primary,
            fontSize=24,
            fontName="Helvetica-Bold"
        ))
        
        styles.add(ParagraphStyle(
            name="label", 
            fontName="Helvetica", 
            fontSize=9, 
            textColor=color_text_light,
            spaceBefore=2,
            spaceAfter=1
        ))
        
        styles.add(ParagraphStyle(
            name="value", 
            fontName="Helvetica-Bold", 
            fontSize=11,
            textColor=color_text_dark,
            spaceAfter=3
        ))
        
        styles.add(ParagraphStyle(
            name="right", 
            parent=styles["Normal"], 
            alignment=TA_RIGHT,
            textColor=color_text_dark
        ))
        
        styles.add(ParagraphStyle(
            name="smallcenter", 
            fontName="Helvetica", 
            fontSize=8, 
            textColor=color_text_light, 
            alignment=TA_CENTER,
            spaceAfter=6
        ))

        story = []
        
        # Header con línea decorativa
        story.append(Paragraph("FACTURA DE VENTA", styles["h1center"]))
        # Línea decorativa debajo del título
        line_table = Table([["", ""]], colWidths=[180*mm, 0])
        line_table.setStyle(TableStyle([
            ("LINEBELOW", (0,0), (0,0), 2, color_primary),
            ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
        ]))
        story.append(line_table)
        story.append(Spacer(1, 4*mm))

        # ------- encabezado mejorado -------
        emisor_nombre = getattr(settings, "FACTURA_EMISOR_NOMBRE", "Variedad y Estilos ZOE")
        emisor_dir    = getattr(settings, "FACTURA_EMISOR_DIR", "")

        cliente_nombre = (
            getattr(factura, "cliente_nombre", None)
            or getattr(getattr(factura, "usuario", None), "nombre", None)
            or getattr(getattr(factura, "usuario", None), "first_name", None)
            or getattr(getattr(factura, "usuario", None), "username", None)
            or "—"
        )
        cliente_email = (
            getattr(factura, "cliente_email", None)
            or getattr(factura, "usuario_email", None)
            or getattr(factura, "email", None)
            or (getattr(factura, "usuario", None) and getattr(factura.usuario, "email", None))
            or (getattr(factura, "usuario", None) and getattr(factura.usuario, "correo", None))
            or "—"
        )

        # Dirección cliente: Factura.direccion -> Pedido.shipping_snapshot -> última Direccion
        cliente_dir = getattr(factura, "direccion", "") or ""
        pedido = getattr(factura, "pedido", None)
        if not cliente_dir and pedido and hasattr(pedido, "shipping_snapshot"):
            cliente_dir = _addr_from_snapshot(getattr(pedido, "shipping_snapshot", {}) or {})
        if not cliente_dir and getattr(factura, "usuario", None):
            try:
                from .models import Direccion
                ult = Direccion.objects.filter(usuario=factura.usuario).order_by("-pk").first()
                if ult and getattr(ult, "direccion", ""):
                    cliente_dir = ult.direccion
            except Exception:
                pass
        cliente_dir = cliente_dir or "—"

        fecha_fact = getattr(factura, "emitida_en", None) or getattr(factura, "created_at", None)

        # Sección de información con mejor diseño
        meta_left = [
            [Paragraph("EMISOR", styles["label"]), ""],
            [Paragraph(emisor_nombre, styles["value"]), ""],
            [Paragraph("Dirección:", styles["label"]), ""],
            [Paragraph(emisor_dir or "—", styles["value"]), ""],
        ]
        
        meta_mid = [
            [Paragraph("FACTURA", styles["label"]), ""],
            [Paragraph(getattr(factura, "numero", "") or str(factura.pk), styles["value"]), ""],
            [Paragraph("ID:", styles["label"]), ""],
            [Paragraph(str(factura.pk), styles["value"]), ""],
            [Paragraph("Fecha:", styles["label"]), ""],
            [Paragraph(dmy_hm(fecha_fact), styles["value"]), ""],
        ]
        
        meta_right = [
            [Paragraph("CLIENTE", styles["label"]), ""],
            [Paragraph(cliente_nombre, styles["value"]), ""],
            [Paragraph("Email:", styles["label"]), ""],
            [Paragraph(cliente_email, styles["value"]), ""],
            [Paragraph("Dirección:", styles["label"]), ""],
            [Paragraph(cliente_dir, styles["value"]), ""],
            [Paragraph("Moneda:", styles["label"]), ""],
            [Paragraph(factura.moneda or "COP", styles["value"]), ""],
        ]

        # Crear tabla con fondo para las secciones
        t_left = Table(meta_left, colWidths=[62*mm, 2*mm])
        t_mid = Table(meta_mid, colWidths=[38*mm, 2*mm])  
        t_right = Table(meta_right, colWidths=[54*mm, 2*mm])

        # Aplicar estilos a cada tabla
        for t in [t_left, t_mid, t_right]:
            t.setStyle(TableStyle([
                ("VALIGN", (0,0), (-1,-1), "TOP"),
                ("LEFTPADDING", (0,0), (-1,-1), 8),
                ("RIGHTPADDING", (0,0), (-1,-1), 8),
                ("TOPPADDING", (0,0), (-1,-1), 4),
                ("BOTTOMPADDING", (0,0), (-1,-1), 4),
                ("BACKGROUND", (0,0), (-1,-1), color_bg_light),
                ("BOX", (0,0), (-1,-1), 0.5, color_primary),
            ]))

        # Tabla contenedora
        main_table = Table([[t_left, t_mid, t_right]], colWidths=[64*mm, 40*mm, 56*mm], hAlign=TA_LEFT)
        main_table.setStyle(TableStyle([
            ("VALIGN", (0,0), (-1,-1), "TOP"),
            ("LEFTPADDING", (0,0), (-1,-1), 2),
            ("RIGHTPADDING", (0,0), (-1,-1), 2),
        ]))
        
        story.append(main_table)
        story.append(Spacer(1, 8*mm))

        # ------- items con mejor diseño -------
        story.append(Paragraph("DETALLE DE PRODUCTOS", ParagraphStyle(
            name="section_header",
            fontName="Helvetica-Bold",
            fontSize=12,
            textColor=color_secondary,
            spaceAfter=4
        )))

        rows = [["Descripción", "Cant.", "Precio Unitario", "Subtotal"]]
        items = list(factura.items.all())
        if items:
            for it in items:
                desc = getattr(it, "descripcion", None) or (getattr(it, "producto", None) and getattr(it.producto, "nombre", None)) or "-"
                qty  = int(getattr(it, "cantidad", 0) or 0)
                unit = getattr(it, "precio", 0)
                sub  = getattr(it, "subtotal", None)
                if sub is None:
                    try:
                        sub = Decimal(str(unit)) * Decimal(str(qty))
                    except Exception:
                        sub = 0
                rows.append([desc, str(qty), money(unit), money(sub)])
        else:
            rows.append(["— Sin ítems —", "", "", ""])

        t_items = Table(rows, colWidths=[90*mm, 20*mm, 35*mm, 35*mm], hAlign="LEFT")
        t_items.setStyle(TableStyle([
            # Header con color primario
            ("BACKGROUND", (0,0), (-1,0), color_primary),
            ("TEXTCOLOR", (0,0), (-1,0), colors.white),
            ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
            ("FONTSIZE", (0,0), (-1,0), 10),
            
            # Filas alternadas
            ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, color_bg_light]),
            
            # Bordes y grid
            ("GRID", (0,0), (-1,-1), 0.5, color_primary),
            ("BOX", (0,0), (-1,-1), 1, color_primary),
            
            # Alineación
            ("ALIGN", (1,1), (1,-1), "CENTER"),
            ("ALIGN", (2,1), (3,-1), "RIGHT"),
            ("FONTSIZE", (0,1), (-1,-1), 9),
            ("FONTNAME", (0,1), (-1,-1), "Helvetica"),
            ("TEXTCOLOR", (0,1), (-1,-1), color_text_dark),
            
            # Padding
            ("TOPPADDING", (0,0), (-1,-1), 6),
            ("BOTTOMPADDING", (0,0), (-1,-1), 6),
            ("LEFTPADDING", (0,0), (-1,-1), 8),
            ("RIGHTPADDING", (0,0), (-1,-1), 8),
        ]))
        story.append(t_items)
        story.append(Spacer(1, 8*mm))

        # ------- totales con mejor diseño -------
        subtotal  = getattr(factura, "subtotal", None)
        impuestos = getattr(factura, "impuestos", None)
        total     = getattr(factura, "total", 0)

        if subtotal is None:
            try:
                subtotal = sum([(it.subtotal if it.subtotal is not None else Decimal(str(it.precio))*it.cantidad) for it in items], Decimal("0"))
            except Exception:
                subtotal = total
        if impuestos is None:
            try:
                impuestos = Decimal(str(total)) - Decimal(str(subtotal))
            except Exception:
                impuestos = 0

        tot_rows = [
            ["Subtotal:",  money(subtotal)],
            ["Impuestos:", money(impuestos)],
            ["", ""],  # Línea separadora
            ["TOTAL:",     money(total)],
        ]
        
        t_tot = Table(tot_rows, colWidths=[45*mm, 45*mm], hAlign="RIGHT")
        t_tot.setStyle(TableStyle([
            ("ALIGN", (0,0), (-1,-1), "RIGHT"),
            ("FONTNAME", (0,0), (0,1), "Helvetica"),
            ("FONTNAME", (1,0), (1,1), "Helvetica-Bold"),
            ("FONTNAME", (0,3), (1,3), "Helvetica-Bold"),
            ("FONTSIZE", (0,0), (-1,1), 10),
            ("FONTSIZE", (0,3), (1,3), 12),
            ("TEXTCOLOR", (0,0), (-1,1), color_text_dark),
            ("TEXTCOLOR", (0,3), (1,3), color_primary),
            ("BACKGROUND", (0,3), (1,3), color_bg_light),
            ("BOX", (0,3), (1,3), 1, color_primary),
            ("LINEABOVE", (0,2), (1,2), 1, color_primary),
            ("TOPPADDING", (0,0), (-1,-1), 4),
            ("BOTTOMPADDING", (0,0), (-1,-1), 4),
            ("LEFTPADDING", (0,0), (-1,-1), 12),
            ("RIGHTPADDING", (0,0), (-1,-1), 12),
        ]))
        story.append(t_tot)
        story.append(Spacer(1, 12*mm))

        # Footer mejorado
        footer_style = ParagraphStyle(
            name="footer",
            fontName="Helvetica-Oblique",
            fontSize=9,
            textColor=color_text_light,
            alignment=TA_CENTER,
            spaceBefore=6
        )
        story.append(Paragraph("Gracias por su compra. Este documento constituye su factura de venta.", footer_style))
        
        # Línea decorativa final
        final_line = Table([["", ""]], colWidths=[180*mm, 0])
        final_line.setStyle(TableStyle([
            ("LINEABOVE", (0,0), (0,0), 1, color_primary),
        ]))
        story.append(Spacer(1, 3*mm))
        story.append(final_line)

        # ------- render -------
        doc.build(story)
        buf.seek(0)
        filename = f"Factura_{getattr(factura, 'numero', None) or factura.pk}.pdf"
        resp = HttpResponse(buf.read(), content_type="application/pdf")
        resp["Content-Disposition"] = f'attachment; filename="{filename}"'
        return resp
    
    #Comprobante de pago Camila 

    @action(detail=True, methods=["get"], url_path="comprobante/pdf", url_name="comprobante_pdf")
    def comprobante_pdf(self, request, pk=None):
        """
        Genera un comprobante de pago bonito (ReportLab/Platypus).
        Si no tienes tabla Pago, consulta MercadoPago por mp_payment_id.
        """
        factura = get_object_or_404(Factura.objects.select_related("usuario"), pk=pk)

        def _get_email_from_factura(f):
            # intenta campos que tu serializer pudo incluir
            for attr in ("cliente_email", "usuario_email", "email"):
                val = getattr(f, attr, None)
                if val:
                    return val
            # intenta en el usuario relacionado con varios nombres comunes
            u = getattr(f, "usuario", None)
            if u:
                for attr in ("email", "correo", "correo_electronico"):
                    val = getattr(u, attr, None)
                    if val:
                        return val
            return "—"

        # Datos de encabezado
        fecha_fact = getattr(factura, "emitida_en", None) or getattr(factura, "created_at", None) or ""
        cliente_nombre = (
            getattr(factura, "cliente_nombre", None)
            or (hasattr(factura, "usuario") and getattr(factura.usuario, "nombre", None))
            or (hasattr(factura, "usuario") and getattr(factura.usuario, "first_name", None))
            or (hasattr(factura, "usuario") and getattr(factura.usuario, "username", None))
            or "—"
        )
        cliente_email = _get_email_from_factura(factura)

        # Pagos (fallback a MP)
        pagos_list = []
        total_pagado = Decimal("0")
        mp_id = getattr(factura, "mp_payment_id", None)

        if mp_id:
            try:
                url = f"https://api.mercadopago.com/v1/payments/{mp_id}"
                r = requests.get(url, headers={"Authorization": f"Bearer {settings.MP_ACCESS_TOKEN}"}, timeout=12)
                if r.status_code == 200:
                    mp = r.json()
                    estado_mp = mp.get("status")
                    monto_mp = Decimal(str(mp.get("transaction_amount") or mp.get("amount") or 0))
                    moneda_mp = mp.get("currency_id") or (factura.moneda or "COP")
                    fecha_mp = mp.get("date_approved") or mp.get("date_created") or ""

                    pagos_list = [{
                        "created_at": fecha_mp,
                        "metodo": "mercadopago",
                        "payment_id": mp_id,
                        "moneda": moneda_mp,
                        "monto": monto_mp,
                        "estado": estado_mp,
                    }]
                    if (estado_mp or "").lower() == "approved":
                        total_pagado = monto_mp
            except Exception:
                pass

        saldo = (factura.total or Decimal("0")) - (total_pagado or Decimal("0"))

        # === PDF con estilos mejorados ===
        from io import BytesIO
        from reportlab.lib.pagesizes import letter
        from reportlab.lib.units import mm
        from reportlab.lib.enums import TA_RIGHT, TA_CENTER, TA_LEFT
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib import colors

        # Colores del proyecto
        color_primary = colors.HexColor("#1fb2d2")  # Cyan principal
        color_secondary = colors.HexColor("#2c3e50")  # Azul oscuro
        color_accent = colors.HexColor("#16a085")  # Verde azulado
        color_bg_light = colors.HexColor("#f8f9fa")  # Fondo claro
        color_text_dark = colors.HexColor("#2c3e50")  # Texto oscuro
        color_text_light = colors.HexColor("#6c757d")  # Texto claro

        buf = BytesIO()
        doc = SimpleDocTemplate(
            buf, pagesize=letter,
            leftMargin=20*mm, rightMargin=20*mm,
            topMargin=18*mm, bottomMargin=18*mm,
        )

        styles = getSampleStyleSheet()
        
        # Estilos personalizados
        styles.add(ParagraphStyle(
            name="h1center", 
            parent=styles["Heading1"], 
            alignment=TA_CENTER, 
            spaceAfter=12,
            textColor=color_primary,
            fontSize=24,
            fontName="Helvetica-Bold"
        ))
        
        styles.add(ParagraphStyle(
            name="label", 
            fontName="Helvetica", 
            fontSize=9, 
            textColor=color_text_light,
            spaceBefore=2,
            spaceAfter=1
        ))
        
        styles.add(ParagraphStyle(
            name="value", 
            fontName="Helvetica-Bold", 
            fontSize=11,
            textColor=color_text_dark,
            spaceAfter=3
        ))
        
        styles.add(ParagraphStyle(
            name="small", 
            fontName="Helvetica", 
            fontSize=8, 
            textColor=color_text_light, 
            alignment=TA_CENTER,
            spaceAfter=6
        ))

        story = []
        
        # Header con línea decorativa
        story.append(Paragraph("COMPROBANTE DE PAGO", styles["h1center"]))
        # Línea decorativa debajo del título
        line_table = Table([["", ""]], colWidths=[180*mm, 0])
        line_table.setStyle(TableStyle([
            ("LINEBELOW", (0,0), (0,0), 2, color_primary),
            ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
        ]))
        story.append(line_table)
        story.append(Spacer(1, 4*mm))

        # Información del comprobante
        meta_left = [
            [Paragraph("FACTURA", styles["label"]), ""],
            [Paragraph(f"{getattr(factura, 'numero', '') or factura.pk}", styles["value"]), ""],
            [Paragraph("ID:", styles["label"]), ""],
            [Paragraph(str(factura.pk), styles["value"]), ""],
            [Paragraph("Fecha factura:", styles["label"]), ""],
            [Paragraph(fmt_date(fecha_fact), styles["value"]), ""],
        ]
        
        meta_right = [
            [Paragraph("CLIENTE", styles["label"]), ""],
            [Paragraph(cliente_nombre, styles["value"]), ""],
            [Paragraph("Email:", styles["label"]), ""],
            [Paragraph(cliente_email, styles["value"]), ""],
            [Paragraph("Moneda:", styles["label"]), ""],
            [Paragraph(factura.moneda or "COP", styles["value"]), ""],
        ]

        # Crear tablas con fondo
        t_meta_left = Table(meta_left, colWidths=[60*mm, 2*mm])
        t_meta_right = Table(meta_right, colWidths=[60*mm, 2*mm])

        # Aplicar estilos
        for t in [t_meta_left, t_meta_right]:
            t.setStyle(TableStyle([
                ("VALIGN", (0,0), (-1,-1), "TOP"),
                ("LEFTPADDING", (0,0), (-1,-1), 8),
                ("RIGHTPADDING", (0,0), (-1,-1), 8),
                ("TOPPADDING", (0,0), (-1,-1), 4),
                ("BOTTOMPADDING", (0,0), (-1,-1), 4),
                ("BACKGROUND", (0,0), (-1,-1), color_bg_light),
                ("BOX", (0,0), (-1,-1), 0.5, color_primary),
            ]))

        t_meta = Table([[t_meta_left, t_meta_right]], colWidths=[90*mm, 90*mm])
        t_meta.setStyle(TableStyle([
            ("VALIGN", (0,0), (-1,-1), "TOP"),
            ("LEFTPADDING", (0,0), (-1,-1), 2),
            ("RIGHTPADDING", (0,0), (-1,-1), 2),
        ]))
        story.append(t_meta)
        story.append(Spacer(1, 6*mm))

        # --- Badge de estado con mejor diseño ---
        estado_para_badge = (getattr(factura, "estado", "") or "").lower()
        if estado_para_badge in ("", "emitida"):
            mp_estado = (pagos_list and pagos_list[0].get("estado")) or None
            if mp_estado:
                estado_para_badge = mp_estado

        badge_text, badge_fg, badge_bg = estado_badge(estado_para_badge)
        badge_style = ParagraphStyle(
            name="badge",
            textColor=badge_fg,
            alignment=TA_CENTER,
            fontName="Helvetica-Bold",
            fontSize=10
        )
        
        badge_tbl = Table(
            [[Paragraph(badge_text, badge_style)]],
            colWidths=[35*mm], rowHeights=[10*mm]
        )
        badge_tbl.setStyle(TableStyle([
            ("BACKGROUND", (0,0), (-1,-1), badge_bg),
            ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
            ("BOX", (0,0), (-1,-1), 1, badge_bg),
            ("ROUNDEDCORNERS", (0,0), (-1,-1), 2),
        ]))
        
        # Centrar el badge
        badge_container = Table([[badge_tbl]], colWidths=[180*mm])
        badge_container.setStyle(TableStyle([
            ("ALIGN", (0,0), (-1,-1), "CENTER"),
        ]))
        story.append(badge_container)
        story.append(Spacer(1, 8*mm))

        # Resumen financiero mejorado
        story.append(Paragraph("RESUMEN FINANCIERO", ParagraphStyle(
            name="section_header",
            fontName="Helvetica-Bold",
            fontSize=12,
            textColor=color_secondary,
            spaceAfter=4
        )))

        resumen = [
            ["Total factura:", fmt_money(factura.total, factura.moneda or "COP")],
            ["Total pagado:",  fmt_money(total_pagado, factura.moneda or "COP")],
            ["", ""],  # Línea separadora
            ["SALDO PENDIENTE:", fmt_money(saldo, factura.moneda or "COP")],
        ]
        
        t_resumen = Table(resumen, colWidths=[50*mm, 50*mm], hAlign="RIGHT")
        t_resumen.setStyle(TableStyle([
            ("ALIGN", (0,0), (-1,-1), "RIGHT"),
            ("FONTNAME", (0,0), (0,1), "Helvetica"),
            ("FONTNAME", (1,0), (1,1), "Helvetica-Bold"),
            ("FONTNAME", (0,3), (1,3), "Helvetica-Bold"),
            ("FONTSIZE", (0,0), (-1,1), 11),
            ("FONTSIZE", (0,3), (1,3), 12),
            ("TEXTCOLOR", (0,0), (-1,1), color_text_dark),
            ("TEXTCOLOR", (0,3), (1,3), color_primary if saldo > 0 else color_accent),
            ("BACKGROUND", (0,3), (1,3), color_bg_light),
            ("BOX", (0,3), (1,3), 1, color_primary if saldo > 0 else color_accent),
            ("LINEABOVE", (0,2), (1,2), 1, color_primary),
            ("TOPPADDING", (0,0), (-1,-1), 4),
            ("BOTTOMPADDING", (0,0), (-1,-1), 4),
            ("LEFTPADDING", (0,0), (-1,-1), 12),
            ("RIGHTPADDING", (0,0), (-1,-1), 12),
        ]))
        story.append(t_resumen)
        story.append(Spacer(1, 8*mm))

        # Tabla de pagos mejorada
        story.append(Paragraph("HISTORIAL DE PAGOS", ParagraphStyle(
            name="section_header",
            fontName="Helvetica-Bold",
            fontSize=12,
            textColor=color_secondary,
            spaceAfter=4
        )))
        
        pagos_rows = [["Fecha", "Método", "Monto", "Estado", "Referencia"]]
        if pagos_list:
            for pg in pagos_list:
                fecha_pg = pg.get("created_at") or pg.get("fecha") or ""
                pagos_rows.append([
                    fmt_date(fecha_pg),
                    (pg.get("metodo") or pg.get("gateway") or "—").upper(),
                    fmt_money(pg.get("monto") or 0, pg.get("moneda") or (factura.moneda or "COP")),
                    (pg.get("estado") or pg.get("estado_gateway") or "—").upper(),
                    (pg.get("payment_id") or "—"),
                ])
        else:
            pagos_rows.append(["—", "Sin pagos registrados", "—", "—", "—"])

        t_pagos = Table(pagos_rows, colWidths=[32*mm, 32*mm, 30*mm, 26*mm, 40*mm])
        t_pagos.setStyle(TableStyle([
            # Header
            ("BACKGROUND", (0,0), (-1,0), color_primary),
            ("TEXTCOLOR", (0,0), (-1,0), colors.white),
            ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
            ("FONTSIZE", (0,0), (-1,0), 10),
            
            # Filas alternadas
            ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, color_bg_light]),
            
            # Bordes
            ("GRID", (0,0), (-1,-1), 0.5, color_primary),
            ("BOX", (0,0), (-1,-1), 1, color_primary),
            
            # Contenido
            ("FONTNAME", (0,1), (-1,-1), "Helvetica"),
            ("FONTSIZE", (0,1), (-1,-1), 9),
            ("TEXTCOLOR", (0,1), (-1,-1), color_text_dark),
            ("ALIGN", (2,1), (2,-1), "RIGHT"),
            ("ALIGN", (3,1), (3,-1), "CENTER"),
            
            # Padding
            ("TOPPADDING", (0,0), (-1,-1), 6),
            ("BOTTOMPADDING", (0,0), (-1,-1), 6),
            ("LEFTPADDING", (0,0), (-1,-1), 6),
            ("RIGHTPADDING", (0,0), (-1,-1), 6),
        ]))
        story.append(t_pagos)
        story.append(Spacer(1, 12*mm))

        # Footer mejorado
        footer_style = ParagraphStyle(
            name="footer",
            fontName="Helvetica-Oblique",
            fontSize=9,
            textColor=color_text_light,
            alignment=TA_CENTER,
            spaceBefore=6
        )
        story.append(Paragraph("Este documento certifica los pagos recibidos para la factura indicada.", footer_style))
        story.append(Paragraph("Documento generado automáticamente - Variedad y Estilos ZOE", footer_style))
        
        # Línea decorativa final
        final_line = Table([["", ""]], colWidths=[180*mm, 0])
        final_line.setStyle(TableStyle([
            ("LINEABOVE", (0,0), (0,0), 1, color_primary),
        ]))
        story.append(Spacer(1, 3*mm))
        story.append(final_line)

        doc.build(story)
        buf.seek(0)
        filename = f"Comprobante_{getattr(factura, 'numero', None) or factura.pk}.pdf"
        resp = HttpResponse(buf.read(), content_type="application/pdf")
        resp["Content-Disposition"] = f'attachment; filename=\"{filename}\"'
        return resp

        # Listado con filtros
    def get_queryset(self):
        qs = super().get_queryset()

        user = self.request.user
        if not (getattr(user, "is_superuser", False) or getattr(user, "is_staff", False)):
            qs = qs.filter(usuario=user)

        numero = self.request.query_params.get("numero")
        if numero:
            qs = qs.filter(numero__icontains=numero)

        f_desde = self.request.query_params.get("fecha_desde")
        f_hasta = self.request.query_params.get("fecha_hasta")
        estado = self.request.query_params.get("estado")

        if hasattr(Factura, "emitida_en"):
            if f_desde:
                qs = qs.filter(emitida_en__date__gte=f_desde)
            if f_hasta:
                qs = qs.filter(emitida_en__date__lte=f_hasta)
            qs = qs.order_by("-emitida_en", "-pk")
        else:
            qs = qs.order_by("-pk")

        if estado:
            qs = qs.filter(estado=estado)

        return qs
    
#Hasta 

class SubcategoriaViewSet(viewsets.ModelViewSet):
    queryset = Subcategoria.objects.all()
    serializer_class = SubcategoriaSerializer
    permission_classes = [IsAuthenticated, IsAdminWriteClienteRead]  # Por definir

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

def _parse_date(s: str):
    try:
        return datetime.fromisoformat(s).date()
    except Exception:
        return None


class SmallPagePagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 200


class SalesRangeReportViewSet(mixins.ListModelMixin,
                              mixins.RetrieveModelMixin,
                              mixins.DestroyModelMixin,
                              viewsets.GenericViewSet):
    """
    ENDPOINTS:
    GET  /api/reportes/ventas/rango/                 -> lista cabeceras (KPIs) con filtros (?desde, ?hasta)
    GET  /api/reportes/ventas/rango/{pk}/            -> detalle cabecera
    POST /api/reportes/ventas/rango/generar/         -> genera/re-genera un reporte por rango (atomic)
    GET  /api/reportes/ventas/rango/{pk}/items/      -> detalle por producto del reporte (ordenable, paginado)
    """
    queryset = SalesRangeReport.objects.all().order_by("-generado_en", "-fecha_inicio")
    serializer_class = SalesRangeReportSerializer
    pagination_class = SmallPagePagination

    # Filtros básicos (?desde=YYYY-MM-DD&hasta=YYYY-MM-DD) sobre la lista
    def get_queryset(self):
        qs = super().get_queryset()
        desde = self.request.query_params.get("desde")
        hasta = self.request.query_params.get("hasta")

        if desde:
            d = _parse_date(desde)
            if d:
                qs = qs.filter(fecha_inicio__gte=d)
        if hasta:
            h = _parse_date(hasta)
            if h:
                qs = qs.filter(fecha_fin__lte=h)

        return qs

    @action(detail=False, methods=["post"], url_path="generar")
    def generar(self, request):
        """
        Genera (o re-genera) un reporte por rango en UNA transacción.
        Body JSON:
        {
          "desde": "YYYY-MM-DD",
          "hasta": "YYYY-MM-DD",
          "solo_aprobados": true
        }
        """
        s = GenerarSalesRangeReportSerializer(data=request.data or {})
        s.is_valid(raise_exception=True)
        desde = s.validated_data["desde"]
        hasta = s.validated_data["hasta"]
        solo_aprobados = s.validated_data.get("solo_aprobados", True)

        with transaction.atomic():
            rep = build_range_report(desde, hasta, incluir_aprobados=solo_aprobados)

        data = SalesRangeReportSerializer(rep).data
        return Response(data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get"], url_path="items")
    def items(self, request, pk=None):
        """
        Detalle por producto del reporte {pk}.
        Params:
          - ordering: -cantidad|cantidad|-ingresos|ingresos|-tickets|tickets (default: -cantidad)
          - page / page_size (paginación DRF)
        """
        try:
            rep = SalesRangeReport.objects.get(pk=pk)
        except SalesRangeReport.DoesNotExist:
            return Response({"detail": "Reporte no encontrado."}, status=status.HTTP_404_NOT_FOUND)

        ordering = request.query_params.get("ordering", "-cantidad")
        allowed = {"cantidad", "-cantidad", "ingresos", "-ingresos", "tickets", "-tickets"}
        if ordering not in allowed:
            ordering = "-cantidad"

        qs = (SalesRangeReportItem.objects
              .filter(reporte=rep)
              .select_related("producto")
              .order_by(ordering, "-ingresos", "producto_id"))

        page = self.paginate_queryset(qs)
        ser = SalesRangeReportItemSerializer(page or qs, many=True)
        if page is not None:
            return self.get_paginated_response(ser.data)
        return Response(ser.data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=["post"], url_path="generar")
    def generar(self, request):
        s = GenerarSalesRangeReportSerializer(data=request.data or {})
        s.is_valid(raise_exception=True)
        desde = s.validated_data["desde"]
        hasta = s.validated_data["hasta"]
        solo_aprobados = s.validated_data.get("solo_aprobados", True)

        # --- Normalizaciones de fechas ---
        # 1) rango inclusivo para el usuario -> lo convertimos a [desde, hasta)
        if desde > hasta:
            desde, hasta = hasta, desde
        if desde == hasta:
            hasta = hasta + timedelta(days=1)

        # 2) tope superior = hoy (exclusivo +1 día)
        today = timezone.localdate()
        if hasta > today + timedelta(days=1):
            hasta = today + timedelta(days=1)

        # 3) tope inferior = primera factura
        first = (Factura.objects
                .aggregate(min_fecha=Min(models.F('emitida_en__date')))  # usa __date para SQLite
                .get('min_fecha'))
        if first:
            if desde < first:
                desde = first

        # 4) ¿hay ventas en el rango ajustado?
        has_items = FacturaItem.objects.filter(
            factura__emitida_en__date__gte=desde,
            factura__emitida_en__date__lt=hasta,
        ).exists()

        if not has_items:
            return Response({
                "detail": "No hay ventas en el rango solicitado.",
                "rango_ajustado": {"desde": desde, "hasta": hasta - timedelta(days=1)},  # visible inclusivo
                "sugerencia": "Elige un rango entre la primera venta y hoy."
            }, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            rep = build_range_report(desde, hasta, incluir_aprobados=solo_aprobados)

        data = SalesRangeReportSerializer(rep).data
        return Response(data, status=status.HTTP_201_CREATED)

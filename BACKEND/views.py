from rest_framework.decorators import api_view, permission_classes, action
from django.contrib.auth.hashers import make_password, check_password
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.core.mail import send_mail
from django.conf import settings
import random
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from rest_framework import viewsets
from .serializer import (
    CustomTokenObtainPairSerializer, LoginSerializer, RolSerializer, UsuarioSerializer, ProveedorSerializer, CategoriaSerializer,
    ProductoSerializer, InventarioSerializer, MovimientoSerializer, PedidoSerializer,
    PedidoProductoSerializer, PagoSerializer, TipoPagoSerializer,
    CarritoSerializer, CarritoItemSerializer, CarritoCreateSerializer,
    CarritoItemCreateSerializer, CarritoUpdateSerializer, EstadoCarritoSerializer,
    SubcategoriaSerializer, TallaSerializer, GrupoTallaSerializer, InventarioAgrupadoSerializer, UsuarioRegistroSerializer,
)
from .models import (
    Rol, Usuario, Proveedor, Categoria, Producto, Inventario, Movimiento,
    Pedido, PedidoProducto, Pago, TipoPago, CodigoRecuperacion,
    Carrito, CarritoItem, EstadoCarrito, Subcategoria, Talla, GrupoTalla
)
from django.contrib.auth.models import User
from rest_framework.permissions import IsAdminUser
from .serializer import UserSerializer
from django.db import models
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from BACKEND.permissions import IsAdmin,IsCliente,IsAdminWriteClienteRead, AdminandCliente, Invitado
import random
import string
from django.utils import timezone
from datetime import timedelta
from rest_framework import status
from rest_framework_simplejwt.views import TokenObtainPairView

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from rest_framework import serializers
from .models import Usuario

# Create your views here.

class Rolview(viewsets.ModelViewSet):

    serializer_class = RolSerializer
    queryset = Rol.objects.all()
    permission_classes = [IsAdmin]
    
    # --- REGISTRO ---    
class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    permission_classes = [AllowAny]

    #Registro
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
                fail_silently=False,  # Si hay error, lanza excepción
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
    correo = serializers.EmailField()
    permission_classes = [AllowAny]

    def validate(self, attrs):
        correo = attrs.get("correo")
        password = attrs.get("password")

        try:
            user = Usuario.objects.get(correo=correo)
        except Usuario.DoesNotExist:
            raise AuthenticationFailed("Usuario no encontrado.")

        if not user.check_password(password):
            raise AuthenticationFailed("Contraseña incorrecta.")

        if not user.is_active:
            raise AuthenticationFailed("Cuenta inactiva.")

        refresh = RefreshToken.for_user(user)

        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'usuario': {
                'id': user.idUsuario,
                'nombre': user.nombre,
                'rol': user.rol.nombre,
            }
        }

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
    permission_classes = [IsAuthenticated, IsAdminWriteClienteRead, Invitado]

class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    permission_classes = [IsAuthenticated, IsAdminWriteClienteRead, Invitado]

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
    permission_classes = [IsAuthenticated, IsAdminWriteClienteRead, Invitado]

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
    permission_classes = [IsAuthenticated, IsAdminWriteClienteRead, Invitado]

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
    permission_classes = [IsAuthenticated, IsAdminWriteClienteRead, Invitado]

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
    permission_classes = [IsAuthenticated, AdminandCliente] #Por definir

class PedidoView(viewsets.ModelViewSet):
    serializer_class = PedidoSerializer
    queryset = Pedido.objects.all()
    permission_classes = [IsAuthenticated, AdminandCliente] #Por definir

class PedidoProductoView(viewsets.ModelViewSet):
    serializer_class = PedidoProductoSerializer
    queryset = PedidoProducto.objects.all()
    permission_classes = [IsAuthenticated, AdminandCliente] #Por definir

class PagoView(viewsets.ModelViewSet):
    serializer_class = PagoSerializer
    queryset = Pago.objects.all()
    permission_classes = [IsAuthenticated, AdminandCliente] #Por definir

class TipoPagoView(viewsets.ModelViewSet):
    serializer_class = TipoPagoSerializer
    queryset = TipoPago.objects.all()
    permission_classes = [IsAuthenticated, AdminandCliente] #Por definir

class CarritoView(viewsets.ModelViewSet):
    serializer_class = CarritoSerializer
    permission_classes = [IsAuthenticated, AdminandCliente]  # Permite acceso a admin y cliente

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

            producto_id = request.data.get('producto')
            talla_id = request.data.get('talla')
            cantidad = int(request.data.get('cantidad', 1))

            from .models import Inventario, CarritoItem
            # Buscar inventario correspondiente
            inventario = None
            if talla_id:
                inventario = Inventario.objects.filter(producto_id=producto_id, talla_id=talla_id).first()
            else:
                inventario = Inventario.objects.filter(producto_id=producto_id).first()

            # Buscar si ya existe el item en el carrito
            filtro_item = {'carrito': carrito, 'producto_id': producto_id}
            if talla_id:
                filtro_item['talla_id'] = talla_id
            item_existente = CarritoItem.objects.filter(**filtro_item).first()

            cantidad_total = cantidad
            if item_existente:
                cantidad_total = item_existente.cantidad + cantidad

            if inventario:
                stock_disponible = inventario.stock_talla if hasattr(inventario, 'stock_talla') else inventario.cantidad
                if cantidad_total > stock_disponible:
                    return Response(
                        {"error": f"No hay suficiente stock disponible. Stock actual: {stock_disponible}, Cantidad solicitada: {cantidad_total}"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                # Descontar solo la cantidad nueva
                inventario.stock_talla = stock_disponible - cantidad
                inventario.save()

            # Crear o actualizar el item en el carrito
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
                if serializer.is_valid():
                    serializer.save()
                else:
                    print("Errores de validación:", serializer.errors)  # Log para debug
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            return Response(CarritoSerializer(carrito).data, status=status.HTTP_200_OK)

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
            # Devolver stock al inventario correspondiente
            from .models import Inventario
            inventario = None
            if item.talla:
                inventario = Inventario.objects.filter(producto=item.producto, talla=item.talla).first()
            else:
                inventario = Inventario.objects.filter(producto=item.producto).first()
            if inventario:
                inventario.stock_talla += item.cantidad
                inventario.save()
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
    permission_classes = [IsAuthenticated, AdminandCliente]  # Permite acceso a admin y cliente

    def get_queryset(self):
        if self.request.user.is_authenticated:
            # Si el usuario está autenticado, mostrar items de sus carritos
            return CarritoItem.objects.filter(carrito__usuario=self.request.user)
        # Si no está autenticado, mostrar items de carritos sin usuario
        return CarritoItem.objects.filter(carrito__usuario__isnull=True)

class EstadoCarritoView(viewsets.ModelViewSet):
    serializer_class = EstadoCarritoSerializer
    permission_classes = [IsAuthenticated, AdminandCliente]  # Permite acceso a admin y cliente

    def get_queryset(self):
        if self.request.user.is_authenticated:
            # Si el usuario está autenticado, mostrar estados de sus carritos
            return EstadoCarrito.objects.filter(carrito__usuario=self.request.user)
        # Si no está autenticado, mostrar estados de carritos sin usuario
        return EstadoCarrito.objects.filter(carrito__usuario__isnull=True)


class SubcategoriaViewSet(viewsets.ModelViewSet):
    queryset = Subcategoria.objects.all()
    serializer_class = SubcategoriaSerializer
    permission_classes = [IsAuthenticated, IsAdminWriteClienteRead, Invitado]  # Por definir

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

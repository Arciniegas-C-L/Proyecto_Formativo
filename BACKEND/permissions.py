from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsAdmin(BasePermission):
    """
    Permiso para verificar si el usuario tiene el rol de administrador.
    """
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            getattr(request.user.rol, 'nombre', '').strip().lower() == 'administrador'
        )

class IsCliente(BasePermission):
    """
    Permiso para verificar si el usuario tiene el rol de cliente.
    """
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            getattr(request.user.rol, 'nombre', '').strip().lower() == 'cliente'
        )
    
class IsAdminWriteClienteRead(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        rol = getattr(request.user.rol, 'nombre', '').strip().lower()

        # Permitir GET, HEAD, OPTIONS y POST para administrador y cliente
        if request.method in SAFE_METHODS or request.method == 'POST':
            return rol in ['administrador', 'cliente']
        # Otros métodos (PUT, PATCH, DELETE) solo para administrador
        return rol == 'administrador'
class AdminandCliente(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            getattr(request.user.rol, 'nombre', '').strip().lower() in ['administrador', 'cliente']
        )

class AllowGuestReadOnly(BasePermission):
    """
    Permite GET/HEAD/OPTIONS a cualquiera que llegue con token (usuario real o invitado).
    Para métodos de escritura, requiere usuario autenticado con rol != 'Invitado'.
    """
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True

        user = getattr(request, 'user', None)
        role_name = getattr(getattr(user, 'rol', None), 'nombre', None)
        return bool(user and user.is_authenticated and str(role_name).lower() != 'invitado')
    

# permissions.py
from rest_framework.permissions import BasePermission

class NotGuest(BasePermission):
    """Permite solo a usuarios autenticados cuyo rol != 'Invitado'."""
    def has_permission(self, request, view):
        user = getattr(request, 'user', None)
        role = getattr(getattr(user, 'rol', None), 'nombre', '') or ''
        return bool(user and user.is_authenticated and role.lower() != 'invitado')
    
class CarritoPermiteInvitadoMenosPago(BasePermission):
    """
    - administrador/cliente: acceso total
    - invitado: TODO excepto acciones de pago (crear_preferencia_pago / rutas de pago)
    Requiere usuario autenticado (incluye token de invitado).
    """

    def has_permission(self, request, view):
        user = getattr(request, 'user', None)
        if not (user and getattr(user, 'is_authenticated', False)):
            return False

        rol = (getattr(getattr(user, 'rol', None), 'nombre', '') or '').strip().lower()

        # Admin y Cliente: todo permitido
        if rol in ('administrador', 'cliente'):
            return True

        # Invitado: todo excepto PAGO
        if rol == 'invitado':
            action = (getattr(view, 'action', '') or '').lower()
            path = (getattr(request, 'path', '') or '').lower()

            # Bloquea explícitamente la acción de pago
            if action in {'crear_preferencia_pago'}:
                return False

            # Fallback defensivo por URL (por si invocan por otra ruta)
            # Evita endpoints que contengan "pago/mercado/checkout/preferencia"
            if any(k in path for k in ('pago', 'mercado', 'checkout', 'preferencia')):
                return False

            # Todo lo demás permitido (listar, agregar, actualizar, eliminar, limpiar, finalizar_compra)
            return True

        # Otro rol desconocido
        return False

class ComentarioPermission(BasePermission):
    """
    Lectura libre.
    - POST: solo 'cliente' o 'administrador'
    - PUT/PATCH/DELETE: autor del comentario o 'administrador'
    - 'invitado': solo lectura
    """

    def _role(self, user):
        return (getattr(getattr(user, 'rol', None), 'nombre', '') or '').strip().lower()

    def has_permission(self, request, view):
        # GET/HEAD/OPTIONS -> permitido para todos (incluye invitado/no autenticado)
        if request.method in SAFE_METHODS:
            return True

        user = getattr(request, 'user', None)
        if not (user and user.is_authenticated):
            return False

        role = self._role(user)

        # Crear comentario: solo cliente o admin
        if request.method == 'POST':
            return role in ('cliente', 'administrador')

        # Para UPDATE/DELETE dejamos el chequeo fino al object-level (autor o admin),
        # pero exigimos que esté autenticado.
        return True

    def has_object_permission(self, request, view, obj):
        # Lectura del objeto -> libre
        if request.method in SAFE_METHODS:
            return True

        user = getattr(request, 'user', None)
        if not (user and user.is_authenticated):
            return False

        role = self._role(user)
        if role == 'administrador':
            return True

        # Autor del comentario puede editar/eliminar
        try:
            user_id = getattr(user, 'idUsuario', getattr(user, 'id', None))
            obj_user_id = getattr(getattr(obj, 'usuario', None), 'idUsuario',
                                  getattr(getattr(obj, 'usuario', None), 'id', None))
        except Exception:
            user_id = None
            obj_user_id = None

        return user_id is not None and obj_user_id is not None and user_id == obj_user_id


class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        # permite GET a autenticados; y restringe escrituras a admin
        if request.method in SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return request.user and request.user.is_staff


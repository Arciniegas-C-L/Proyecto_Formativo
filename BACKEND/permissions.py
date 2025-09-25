# permissions.py
from rest_framework.permissions import BasePermission, SAFE_METHODS

# ─────────────────────────────────────────────────────────────
# Roles básicos (por si los sigues usando en otros módulos)
# ─────────────────────────────────────────────────────────────
class IsAdmin(BasePermission):
    """Permite solo a usuarios autenticados con rol 'administrador'."""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            getattr(getattr(request.user, 'rol', None), 'nombre', '').strip().lower() == 'administrador'
        )

class IsCliente(BasePermission):
    """Permite solo a usuarios autenticados con rol 'cliente'."""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            getattr(getattr(request.user, 'rol', None), 'nombre', '').strip().lower() == 'cliente'
        )

class AdminandCliente(BasePermission):
    """Permite solo a usuarios autenticados con rol 'administrador' o 'cliente'."""
    def has_permission(self, request, view):
        rol = (getattr(getattr(request.user, 'rol', None), 'nombre', '') or '').strip().lower()
        return bool(request.user.is_authenticated and rol in ['administrador', 'cliente'])


# ─────────────────────────────────────────────────────────────
# Aperturas sin autenticación
# ─────────────────────────────────────────────────────────────
class OpenReadOnly(BasePermission):
    """
    Permite acceso de lectura (GET/HEAD/OPTIONS) a *cualquiera* (sin token).
    Útil para Catálogo público.
    """
    def has_permission(self, request, view):
        return request.method in SAFE_METHODS


class CarritoAnonimoMenosPago(BasePermission):
    """
    Carrito abierto SIN token para todo excepto flujos de pago.
    - Cualquiera (autenticado o no) puede: crear carrito, listar, agregar/actualizar/eliminar items, vaciar, etc.
    - Para endpoints/acciones de PAGO se exige usuario autenticado con rol 'cliente' o 'administrador'.
    
    Para detectar pagos:
      - Define en el ViewSet la acción `crear_preferencia_pago` (o similar) y/o
      - Usa coincidencia defensiva por path con palabras clave ('pago', 'checkout', 'mercado', 'preferencia').
    """
    PAGO_ACTIONS = {'crear_preferencia_pago', 'iniciar_pago', 'confirmar_pago'}

    def has_permission(self, request, view):
        # 1) Detecta si la acción/URL es de pago
        action = (getattr(view, 'action', '') or '').lower()
        path = (getattr(request, 'path', '') or '').lower()
        is_pago = (action in self.PAGO_ACTIONS) or any(k in path for k in ('pago', 'checkout', 'mercado', 'preferencia'))

        if not is_pago:
            # Cualquier método/usuario permitido para operaciones NO-PAGO (incluye POST/PUT/PATCH/DELETE)
            return True

        # 2) Para PAGO: requiere autenticación y rol válido
        if not request.user or not request.user.is_authenticated:
            return False
        rol = (getattr(getattr(request.user, 'rol', None), 'nombre', '') or '').strip().lower()
        return rol in ('cliente', 'administrador')


# ─────────────────────────────────────────────────────────────
# Permisos mixtos comunes
# ─────────────────────────────────────────────────────────────
class IsAdminWriteClienteRead(BasePermission):
    """
    - Lecturas: admin o cliente
    - POST: admin o cliente
    - Escrituras fuertes (PUT/PATCH/DELETE): solo admin
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        rol = (getattr(getattr(request.user, 'rol', None), 'nombre', '') or '').strip().lower()

        if request.method in SAFE_METHODS or request.method == 'POST':
            return rol in ['administrador', 'cliente']
        return rol == 'administrador'


class ComentarioPermission(BasePermission):
    """
    Comentarios:
    - Lectura: libre (sin token)
    - POST: solo 'cliente' o 'administrador'
    - PUT/PATCH/DELETE: autor del comentario o 'administrador'
    """
    def _role(self, user):
        return (getattr(getattr(user, 'rol', None), 'nombre', '') or '').strip().lower()

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True

        user = getattr(request, 'user', None)
        if not (user and user.is_authenticated):
            return False

        if request.method == 'POST':
            return self._role(user) in ('cliente', 'administrador')

        # Para UPDATE/DELETE: se valida a nivel de objeto
        return True

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True

        user = getattr(request, 'user', None)
        if not (user and user.is_authenticated):
            return False

        if self._role(user) == 'administrador':
            return True

        # Autor del comentario
        try:
            user_id = getattr(user, 'idUsuario', getattr(user, 'id', None))
            obj_user_id = getattr(getattr(obj, 'usuario', None), 'idUsuario',
                                  getattr(getattr(obj, 'usuario', None), 'id', None))
        except Exception:
            user_id = None
            obj_user_id = None

        return user_id is not None and obj_user_id is not None and user_id == obj_user_id


class IsAdminOrReadOnly(BasePermission):
    """
    Lectura libre para todos; escrituras solo para admin (por 'rol' o 'is_staff').
    """
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        # Acepta cualquiera de las dos convenciones de "admin"
        if request.user and request.user.is_authenticated:
            rol = (getattr(getattr(request.user, 'rol', None), 'nombre', '') or '').strip().lower()
            return bool(rol == 'administrador' or getattr(request.user, 'is_staff', False))
        return False

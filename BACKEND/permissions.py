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

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

        if request.method in SAFE_METHODS:
            return rol in ['administrador', 'cliente']
        return rol == 'administrador'
class AdminandCliente(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            getattr(request.user.rol, 'nombre', '').strip().lower() in ['administrador', 'cliente']
        )

class Invitado(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            getattr(request.user.rol, 'nombre', '').strip().lower() == 'invitado'
        )
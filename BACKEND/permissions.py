from rest_framework.permissions import BasePermission

class IsAdmin(BasePermission):
    """
    Permiso para verificar si el usuario tiene el rol de administrador.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and getattr(request.user.rol, 'nombre', '').lower() == 'admin'


class IsCliente(BasePermission):
    """
    Permiso para verificar si el usuario tiene el rol de cliente.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and getattr(request.user.rol, 'nombre', '').lower() == 'cliente'
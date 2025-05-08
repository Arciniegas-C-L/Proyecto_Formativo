from rest_framework import viewsets
from .serializer import RolSerializer
from .models import Rol

# Create your views here.

class Rolview(viewsets.ModelViewSet):
    serializer_class = RolSerializer
    queryset = Rol.objects.all()

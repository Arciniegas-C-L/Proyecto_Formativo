from BACKEND.models import Comentario, Usuario
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = 'Actualiza los comentarios antiguos para que tengan el avatar actual del usuario que los hizo.'

    def handle(self, *args, **options):
        actualizados = 0
        for comentario in Comentario.objects.all():
            user = comentario.usuario
            if user.avatar_seed:
                comentario.usuario_avatar_seed = user.avatar_seed
                comentario.usuario_avatar_options = user.avatar_options
                comentario.usuario_nombre = user.nombre
                comentario.usuario_apellido = user.apellido
                comentario.save()
                actualizados += 1
        self.stdout.write(self.style.SUCCESS(f'Comentarios actualizados: {actualizados}'))

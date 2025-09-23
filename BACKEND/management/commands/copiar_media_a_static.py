import os
import shutil
from django.conf import settings
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = 'Copia todos los archivos de la carpeta media a static/media para asegurar que las imágenes estén disponibles como archivos estáticos.'

    def handle(self, *args, **options):
        media_root = settings.MEDIA_ROOT
        static_media_root = os.path.join(settings.STATIC_ROOT or os.path.join(settings.BASE_DIR, 'static'), 'media')

        if not os.path.exists(media_root):
            self.stdout.write(self.style.ERROR(f'La carpeta media no existe: {media_root}'))
            return

        os.makedirs(static_media_root, exist_ok=True)

        archivos_copiados = 0
        for root, dirs, files in os.walk(media_root):
            for file in files:
                ruta_origen = os.path.join(root, file)
                ruta_relativa = os.path.relpath(ruta_origen, media_root)
                ruta_destino = os.path.join(static_media_root, ruta_relativa)
                os.makedirs(os.path.dirname(ruta_destino), exist_ok=True)
                shutil.copy2(ruta_origen, ruta_destino)
                archivos_copiados += 1

        self.stdout.write(self.style.SUCCESS(f'Se copiaron {archivos_copiados} archivos de media a static/media.'))

from django.apps import AppConfig
import logging
logger = logging.getLogger(__name__)

class BackendConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'BACKEND'
    def ready(self):
        import BACKEND.signals_inventario

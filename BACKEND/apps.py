from django.apps import AppConfig
import logging
logger = logging.getLogger(__name__)

class BackendConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'BACKEND'

    def ready(self):
        logger.warning(">>> BackendConfig.ready() cargado")  # DIAGNÓSTICO
        import BACKEND.signals_inventario
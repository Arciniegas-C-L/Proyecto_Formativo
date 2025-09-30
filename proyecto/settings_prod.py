from .settings import *

import os

# Configuración específica para producción
DEBUG = False
ALLOWED_HOSTS = [
    os.getenv("PUBLIC_HOST", "").strip() or "*",
]

# Email real (SMTP)
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"


import os
from urllib.parse import urlsplit
from .settings import *

FRONTEND_URL = (os.getenv("FRONTEND_URL") or "http://localhost:5173").rstrip("/")
BACKEND_URL  = (os.getenv("BACKEND_URL")  or "http://localhost:8000").rstrip("/")

# Configuración específica para desarrollo
DEBUG = True
ALLOWED_HOSTS = [
    "localhost", "127.0.0.1",
    (urlsplit(FRONTEND_URL).hostname or ""),
    (urlsplit(BACKEND_URL).hostname or ""),
    os.getenv("PUBLIC_HOST", "").strip() or "",
]

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

import os
from pathlib import Path
from urllib.parse import urlsplit
from datetime import timedelta

from dotenv import load_dotenv
from corsheaders.defaults import default_headers

load_dotenv()

# ========= Paths base =========
BASE_DIR = Path(__file__).resolve().parent.parent

# ========= URLs base (se cargan de .env) =========
# En tu .env pon, por ejemplo:
# FRONTEND_URL=https://10aca77b7309.ngrok-free.app
# BACKEND_URL=https://ed2d28ec0c25.ngrok-free.app
FRONTEND_URL = (os.getenv("FRONTEND_URL") or "http://localhost:5173").rstrip("/")
BACKEND_URL  = (os.getenv("BACKEND_URL")  or "http://localhost:8000").rstrip("/")

front = urlsplit(FRONTEND_URL)
back  = urlsplit(BACKEND_URL)

FRONT_IS_LOCAL = front.hostname in {"localhost", "127.0.0.1"}
FRONT_IS_HTTPS = front.scheme == "https"

# ========= Mercado Pago =========
MP_ACCESS_TOKEN   = os.getenv("MP_ACCESS_TOKEN", "")
MP_PUBLIC_KEY     = os.getenv("MP_PUBLIC_KEY", "")
MP_WEBHOOK_SECRET = os.getenv("MP_WEBHOOK_SECRET", "change-this")

# Ruta en React que mostrará el resultado
FRONTEND_RETURN_PATH = os.getenv("FRONTEND_RETURN_PATH", "/RetornoMP")

# Si tu API pública cuelga de /BACKEND (según tu enrutado)
BACKEND_PATH_PREFIX = os.getenv("BACKEND_PATH_PREFIX", "/BACKEND").rstrip("/")
API_BASE_URL = f"{BACKEND_URL}{BACKEND_PATH_PREFIX}/api"

# Webhook público (https)
MP_NOTIFICATION_URL = f"{API_BASE_URL}/estado-carrito/webhook/"

# Redirección de MP: por defecto FRONTEND (lo que quieres)
MP_RETURN_MODE = os.getenv("MP_RETURN_MODE", "frontend").strip().lower()  # "frontend" | "backend"
if MP_RETURN_MODE == "frontend":
    MP_BACK_URL_FOR_PREFERENCES = f"{FRONTEND_URL}{FRONTEND_RETURN_PATH}"
else:
    # Fallback por backend que luego redirige al front (si quisieras)
    MP_BACK_URL_FOR_PREFERENCES = f"{API_BASE_URL}/estado-carrito/retorno/"

# Auto redirect:
# - si pones MP_SEND_AUTO_RETURN=true en .env lo fuerzas
# - si pones "auto" lo activamos solo si el FRONT es https y no es localhost
_env_flag = os.getenv("MP_SEND_AUTO_RETURN", "auto").lower()
if _env_flag in {"true", "1", "yes"}:
    MP_SEND_AUTO_RETURN = True
elif _env_flag in {"false", "0", "no"}:
    MP_SEND_AUTO_RETURN = False
else:
    MP_SEND_AUTO_RETURN = FRONT_IS_HTTPS and not FRONT_IS_LOCAL

# ========= Seguridad / Debug =========
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "dev-only-change-me")
DEBUG = os.getenv("DEBUG", "true").lower() == "true"

# Hosts válidos (incluye ngrok)
ALLOWED_HOSTS = [
    "localhost", "127.0.0.1",
    (front.hostname or ""),
    (back.hostname or ""),
    os.getenv("PUBLIC_HOST", "").strip() or "",
]

# Confianza CSRF para tus dominios front/back
CSRF_TRUSTED_ORIGINS = [
    f"{front.scheme}://{front.hostname}" + (f":{front.port}" if front.port else ""),
    f"{back.scheme}://{back.hostname}" + (f":{back.port}" if back.port else ""),
]

# ========= Apps =========
INSTALLED_APPS = [
    "django.contrib.admin", "django.contrib.auth", "django.contrib.contenttypes",
    "django.contrib.sessions", "django.contrib.messages", "django.contrib.staticfiles",
    "BACKEND.apps.BackendConfig",  # tu app principal, donde está el modelo Usuario personalizado
    #"BACKEND",
    "rest_framework", "rest_framework.authtoken",
    "rest_framework_simplejwt", "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
]

# ========= Middleware =========
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",   # CORS antes de CommonMiddleware
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

# ========= URLs / Templates / WSGI =========
ROOT_URLCONF = "proyecto.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,     # carga templates de apps (incluye admin)
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "proyecto.wsgi.application"

# ========= DRF / JWT =========
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ("rest_framework_simplejwt.authentication.JWTAuthentication",),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DATETIME_FORMAT": "%Y-%m-%dT%H:%M:%S%z",  # agrega -0500
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=120),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
    "ROTATE_REFRESH_TOKENS": False,
    "BLACKLIST_AFTER_ROTATION": True,
    "USER_ID_FIELD": "idUsuario",
    "AUTH_HEADER_TYPES": ("Bearer",),
    "AUTH_TOKEN_CLASSES": ("rest_framework_simplejwt.tokens.AccessToken",),
}

# ========= DB (dev) =========
DATABASES = {
    "default": {"ENGINE": "django.db.backends.sqlite3", "NAME": BASE_DIR / "db.sqlite3"}
}

# ========= Usuario, i18n, estáticos =========
AUTH_USER_MODEL = "BACKEND.Usuario"

LANGUAGE_CODE = "en-us"
TIME_ZONE = "America/Bogota"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ========= CORS =========
CORS_ALLOWED_ORIGINS = [
    f"{front.scheme}://{front.hostname}" + (f":{front.port}" if front.port else "")
]
CORS_ALLOW_HEADERS = list(default_headers) + ["x-rol"]
# CORS_ALLOW_CREDENTIALS = True  # solo si usas cookies entre dominios

# ========= Email =========
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = "smtp.gmail.com"
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "")
DEFAULT_FROM_EMAIL = EMAIL_HOST_USER

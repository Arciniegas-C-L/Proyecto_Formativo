"""
Django settings for proyecto project.
"""
import os
from dotenv import load_dotenv
from pathlib import Path
from datetime import timedelta
from corsheaders.defaults import default_headers

# =========================
# Variables de entorno
# =========================
load_dotenv()

# Mercado Pago
MP_ACCESS_TOKEN   = os.getenv("MP_ACCESS_TOKEN", "")
MP_WEBHOOK_SECRET = os.getenv("MP_WEBHOOK_SECRET", "change-this")
# (opcional, por si lo quieres referenciar desde el backend)
MP_PUBLIC_KEY     = os.getenv("MP_PUBLIC_KEY", "")

# URLs base (frontend/back)
FRONTEND_URL = (os.getenv("FRONTEND_URL") or "http://localhost:5173").rstrip("/")
BACKEND_URL  = (os.getenv("BACKEND_URL")  or "http://localhost:8000").rstrip("/")

# Helper para saber si el front es local (localhost / 127.0.0.1)
FRONT_IS_LOCAL = FRONTEND_URL.startswith("http://localhost") or FRONTEND_URL.startswith("http://127.0.0.1")

# Back URLs listas para usar en la preferencia de MP
MP_SUCCESS_URL = f"{FRONTEND_URL}/checkout/result?status=success"
MP_FAILURE_URL = f"{FRONTEND_URL}/checkout/result?status=failure"
MP_PENDING_URL = f"{FRONTEND_URL}/checkout/result?status=pending"

# URL del webhook (notificación) totalmente calzada
MP_NOTIFICATION_URL = f"{BACKEND_URL}/BACKEND/api/estado-carrito/webhook/"

# Importante: Mercado Pago rechaza auto_return con back_urls hacia localhost.
# Con esta bandera decides si enviarlo en la preferencia.
MP_SEND_AUTO_RETURN = not FRONT_IS_LOCAL


# =========================
# Paths base
# =========================
BASE_DIR = Path(__file__).resolve().parent.parent

# =========================
# Seguridad / Debug
# =========================
# WARNING: cambia este secret en producción
SECRET_KEY = 'django-insecure-#3vqlez2a^!ef3s+x1%&v_m(_wz@v!s^q0+2=@&h2@^qjl$fs_'
DEBUG = True

# Acepta llamadas locales (agrega aquí tu dominio público cuando uses ngrok/producción)
ALLOWED_HOSTS = ["localhost", "127.0.0.1"]

# Para evitar problemas con CSRF cuando pruebes callbacks/webhooks o vistas navegables
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

# =========================
# Apps instaladas
# =========================
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'BACKEND',

    'rest_framework',
    'rest_framework.authtoken',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',

    'corsheaders',
]

# =========================
# Middleware
# =========================
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',

    # CORS SIEMPRE antes de CommonMiddleware
    'corsheaders.middleware.CorsMiddleware',

    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# =========================
# URLs / WSGI
# =========================
ROOT_URLCONF = 'proyecto.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'proyecto.wsgi.application'

# =========================
# DRF / JWT
# =========================
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=120),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': True,
    # usa tu campo PK personalizado del usuario
    'USER_ID_FIELD': 'idUsuario',
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
}

# =========================
# Base de datos (sqlite dev)
# =========================
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# =========================
# Validadores de password
# =========================
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',},
]

# Usuario custom
AUTH_USER_MODEL = 'BACKEND.Usuario'

# =========================
# i18n / TZ
# =========================
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# =========================
# Static / Media
# =========================
STATIC_URL = 'static/'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# =========================
# CORS
# =========================
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
CORS_ALLOW_HEADERS = list(default_headers) + [
    'x-rol',  # cabecera personalizada que usas en el front
]
# Si manejas credenciales (cookies) entre dominios:
# CORS_ALLOW_CREDENTIALS = True

# =========================
# Email (Gmail SMTP)
# =========================
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'variedadezyestiloszoe@gmail.com'
EMAIL_HOST_PASSWORD = 'jotr mqpe slno nrkv'
DEFAULT_FROM_EMAIL = EMAIL_HOST_USER

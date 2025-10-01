# BACKEND/utils_email.py

# Enviar correos usando Maileroo API (HTTP)
import os
import json
import requests
from django.conf import settings

MAILEROO_API_KEY = os.getenv("MAILEROO_API_KEY", getattr(settings, "MAILEROO_API_KEY", ""))
MAILEROO_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", getattr(settings, "DEFAULT_FROM_EMAIL", "Variedadesyestiloszoe@bb72b3c7eb447366.maileroo.org"))
MAILEROO_FROM_NAME = os.getenv("DEFAULT_FROM_NAME", getattr(settings, "DEFAULT_FROM_NAME", "Variedades Zoe"))

def send_email_raw(subject, to_emails, html_body, text_body=None, from_email=None):
    """
    Envía un correo usando la API HTTP de Maileroo.
    subject: asunto
    to_emails: lista o string de destinatarios
    html_body: cuerpo HTML
    text_body: cuerpo texto plano (opcional)
    from_email: remitente (opcional)
    """
    if isinstance(to_emails, str):
        to_emails = [to_emails]
    to_list = [
        {"address": addr} for addr in to_emails if addr and "@" in addr
    ]
    if not to_list:
        print(f"[WARN] Email NO enviado: sin destinatarios válidos. subject={subject!r}")
        return 0

    url = "https://smtp.maileroo.com/api/v2/emails"
    api_headers = {
        "X-API-Key": MAILEROO_API_KEY,
        "Content-Type": "application/json"
    }
    data = {
        "from": {
            "address": from_email or MAILEROO_FROM_EMAIL,
            "display_name": MAILEROO_FROM_NAME
        },
        "to": to_list,
        "subject": subject,
        "html": html_body,
    }
    if text_body:
        data["plain"] = text_body

    print("[Maileroo][REQUEST] URL:", url)
    print("[Maileroo][REQUEST] Headers:", api_headers)
    print("[Maileroo][REQUEST] Data:", json.dumps(data, ensure_ascii=False))
    try:
        response = requests.post(url, headers=api_headers, json=data)
        print(f"[Maileroo][RESPONSE] Status: {response.status_code}")
        print(f"[Maileroo][RESPONSE] Body: {response.text}")
        if response.status_code >= 400:
            import sys
            print(f"[Maileroo][ERROR] {response.status_code}: {response.text}", file=sys.stderr)
            return 0
    except Exception as e:
        import sys
        print(f"[Maileroo][EXCEPTION] {str(e)}", file=sys.stderr)
        return 0
    return 1

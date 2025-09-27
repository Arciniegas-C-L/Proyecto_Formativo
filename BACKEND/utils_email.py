# BACKEND/utils_email.py
import re
from django.conf import settings
from django.core.mail import EmailMultiAlternatives

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

def _clean_emails(to_emails):
    if isinstance(to_emails, str):
        emails = [to_emails]
    else:
        emails = list(to_emails or [])
    cleaned = []
    for e in emails:
        if not e:
            continue
        e = str(e).strip()
        if not e:
            continue
        if _EMAIL_RE.match(e):
            cleaned.append(e)
        else:
            print(f"[WARN] Email inválido descartado: {e!r}")
    return sorted(set(cleaned))

def send_email_raw(subject, to_emails, html_body, text_body=None, from_email=None):
    print(f"[DEBUG] send_email_raw() raw to_emails={to_emails!r}")
    cleaned = _clean_emails(to_emails)
    print(f"[DEBUG] send_email_raw() cleaned={cleaned!r}")

    # Fallback opcional (settings.ALERT_FALLBACK_EMAIL)
    fallback = getattr(settings, "ALERT_FALLBACK_EMAIL", "")
    fb_clean = _clean_emails(fallback) if fallback else []

    if not cleaned and fb_clean:
        print("[INFO] Usando ALERT_FALLBACK_EMAIL (lista vacía).")
        cleaned = fb_clean

    if not cleaned:
        print(f"[WARN] Email NO enviado: sin destinatarios válidos. subject={subject!r}")
        return 0

    msg = EmailMultiAlternatives(
        subject=subject,
        body=text_body or subject,
        from_email=from_email or getattr(settings, "DEFAULT_FROM_EMAIL", "no-reply@example.com"),
        to=cleaned,
    )
    msg.attach_alternative(html_body, "text/html")

    try:
        msg.send(fail_silently=False)
        return len(cleaned)
    except Exception as e:
        # No romper la API si falla SMTP
        print(f"[ERROR] Email no enviado: {e}")
        return 0

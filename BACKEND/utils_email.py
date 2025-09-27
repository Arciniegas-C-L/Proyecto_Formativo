# BACKEND/utils_email.py
from django.conf import settings
from django.core.mail import EmailMultiAlternatives

def send_email_raw(subject, to_emails, html_body, text_body=None, from_email=None):
    """
    Envía un email con cuerpo HTML (sin templates).
    """
    if not to_emails:
        return 0
    msg = EmailMultiAlternatives(
        subject=subject,
        body=text_body or subject,
        from_email=from_email or getattr(settings, "DEFAULT_FROM_EMAIL", None),
        to=to_emails,
    )
    msg.attach_alternative(html_body, "text/html")
    msg.send(fail_silently=False)
    return 1
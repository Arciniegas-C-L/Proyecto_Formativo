from django.db.models.signals import post_save
from django.dispatch import receiver
from BACKEND.models import Inventario
from BACKEND.services.stock_alerts_core import low_stock_event_check

@receiver(post_save, sender=Inventario)
def inventario_post_save(sender, instance, created, **kwargs):
    try:
        low_stock_event_check(instance, umbral=5)
    except Exception as e:
        # IMPORTANTE: nunca propagar a la vista
        print("[ERROR] Señal low_stock_event_check:", e)

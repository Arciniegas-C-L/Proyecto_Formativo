from django.db.models.signals import post_save
from django.dispatch import receiver
from BACKEND.models import Inventario
from BACKEND.views import low_stock_event_check  # usa tu función del views.py

@receiver(post_save, sender=Inventario)
def inventario_post_save(sender, instance, created, **kwargs):
    # Se ejecuta cada vez que se guarda un Inventario (create/update con .save())
    try:
        low_stock_event_check(instance, umbral=5)
    except Exception as e:
        print("Error alerta bajo stock:", e)
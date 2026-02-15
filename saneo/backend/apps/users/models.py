from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    """
    Modèle utilisateur personnalisé.
    Pour l'instant mono-utilisateur mais prêt pour multi-users.
    """
    email = models.EmailField(unique=True, verbose_name="Email")
    phone_number = models.CharField(max_length=20, blank=True, verbose_name="Téléphone")
    notification_email = models.BooleanField(default=True, verbose_name="Notifications par email")
    notification_expiry_days = models.IntegerField(
        default=7, 
        verbose_name="Jours avant expiration pour notification"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Utilisateur"
        verbose_name_plural = "Utilisateurs"
    
    def __str__(self):
        return self.username

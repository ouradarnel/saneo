from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta

class StockBatch(models.Model):
    """Lots de stock pour un produit"""
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='batches', verbose_name="Produit")
    quantity = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Quantité")
    location = models.ForeignKey(
        'products.Location', 
        on_delete=models.SET_NULL, 
        null=True,
        related_name='stock_batches',
        verbose_name="Emplacement"
    )
    expiry_date = models.DateField(null=True, blank=True, verbose_name="Date de péremption")
    purchase_date = models.DateField(default=timezone.now, verbose_name="Date d'achat")
    purchase_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True,
        verbose_name="Prix d'achat"
    )
    supplier = models.CharField(max_length=200, blank=True, verbose_name="Fournisseur/Magasin")
    notes = models.TextField(blank=True, verbose_name="Notes")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Lot de stock"
        verbose_name_plural = "Lots de stock"
        ordering = ['expiry_date', '-created_at']
    
    def __str__(self):
        return f"{self.product.name} - {self.quantity} {self.product.get_unit_display()}"
    
    @property
    def is_expired(self):
        """Vérifie si le lot est périmé"""
        if not self.expiry_date:
            return False
        return self.expiry_date < timezone.now().date()
    
    @property
    def days_until_expiry(self):
        """Nombre de jours avant expiration"""
        if not self.expiry_date:
            return None
        delta = self.expiry_date - timezone.now().date()
        return delta.days
    
    @property
    def is_expiring_soon(self, days=7):
        """Vérifie si le lot expire bientôt"""
        if not self.expiry_date:
            return False
        days_left = self.days_until_expiry
        return days_left is not None and 0 < days_left <= days

class StockMovement(models.Model):
    """Mouvements de stock (entrées/sorties)"""
    MOVEMENT_TYPES = [
        ('IN', 'Entrée'),
        ('OUT', 'Sortie'),
        ('ADJUST', 'Ajustement'),
    ]
    
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='movements', verbose_name="Produit")
    batch = models.ForeignKey(
        StockBatch, 
        on_delete=models.SET_NULL, 
        null=True,
        blank=True,
        related_name='movements',
        verbose_name="Lot"
    )
    type = models.CharField(max_length=10, choices=MOVEMENT_TYPES, verbose_name="Type")
    quantity = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Quantité")
    date = models.DateTimeField(default=timezone.now, verbose_name="Date")
    note = models.TextField(blank=True, verbose_name="Note")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='stock_movements')
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Mouvement de stock"
        verbose_name_plural = "Mouvements de stock"
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.get_type_display()} - {self.product.name} - {self.quantity}"
    
    def save(self, *args, **kwargs):
        """Mise à jour automatique du stock lors d'un mouvement"""
        is_new = self.pk is None
        super().save(*args, **kwargs)
        
        if is_new and self.batch:
            # Mise à jour de la quantité du lot
            if self.type == 'IN':
                self.batch.quantity += self.quantity
            elif self.type == 'OUT':
                self.batch.quantity -= self.quantity
            elif self.type == 'ADJUST':
                # L'ajustement remplace la quantité
                self.batch.quantity = self.quantity
            
            self.batch.save()

class ExpiryAlert(models.Model):
    """Alertes de péremption"""
    ALERT_TYPES = [
        ('EXPIRING_SOON', 'Expire bientôt'),
        ('EXPIRED', 'Expiré'),
    ]
    
    batch = models.ForeignKey(StockBatch, on_delete=models.CASCADE, related_name='alerts', verbose_name="Lot")
    alert_type = models.CharField(max_length=20, choices=ALERT_TYPES, verbose_name="Type d'alerte")
    alert_date = models.DateTimeField(auto_now_add=True, verbose_name="Date de l'alerte")
    is_read = models.BooleanField(default=False, verbose_name="Lu")
    email_sent = models.BooleanField(default=False, verbose_name="Email envoyé")
    
    class Meta:
        verbose_name = "Alerte de péremption"
        verbose_name_plural = "Alertes de péremption"
        ordering = ['-alert_date']
    
    def __str__(self):
        return f"{self.get_alert_type_display()} - {self.batch.product.name}"

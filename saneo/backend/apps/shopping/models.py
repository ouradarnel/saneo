from django.db import models
from django.conf import settings
from django.utils import timezone

class ShoppingList(models.Model):
    """Liste de courses"""
    STATUS_CHOICES = [
        ('draft', 'Brouillon'),
        ('active', 'Active'),
        ('completed', 'Terminée'),
        ('archived', 'Archivée'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='shopping_lists')
    title = models.CharField(max_length=200, default="Liste de courses", verbose_name="Titre")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft', verbose_name="Statut")
    is_auto_generated = models.BooleanField(default=False, verbose_name="Générée automatiquement")
    notes = models.TextField(blank=True, verbose_name="Notes")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name="Date de finalisation")
    
    class Meta:
        verbose_name = "Liste de courses"
        verbose_name_plural = "Listes de courses"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.user.username} ({self.get_status_display()})"
    
    @property
    def total_items(self):
        """Nombre total d'items dans la liste"""
        return self.items.count()
    
    @property
    def checked_items(self):
        """Nombre d'items cochés"""
        return self.items.filter(is_checked=True).count()
    
    @property
    def completion_percentage(self):
        """Pourcentage de complétion"""
        if self.total_items == 0:
            return 0
        return int((self.checked_items / self.total_items) * 100)
    
    @property
    def estimated_total_cost(self):
        """Coût total estimé"""
        from django.db.models import Sum
        return self.items.aggregate(
            total=Sum('estimated_cost')
        )['total'] or 0

class ShoppingListItem(models.Model):
    """Item d'une liste de courses"""
    PRIORITY_CHOICES = [
        ('low', 'Faible'),
        ('normal', 'Normale'),
        ('high', 'Haute'),
        ('urgent', 'Urgente'),
    ]
    
    REASON_CHOICES = [
        ('below_threshold', 'Sous le seuil'),
        ('out_of_stock', 'Rupture de stock'),
        ('expiring_soon', 'Expire bientôt'),
        ('manual', 'Ajout manuel'),
    ]
    
    shopping_list = models.ForeignKey(ShoppingList, on_delete=models.CASCADE, related_name='items', verbose_name="Liste")
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='shopping_items', verbose_name="Produit")
    
    suggested_quantity = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Quantité suggérée"
    )
    actual_quantity = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Quantité achetée"
    )
    
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='normal', verbose_name="Priorité")
    reason = models.CharField(max_length=30, choices=REASON_CHOICES, default='manual', verbose_name="Raison")
    
    estimated_cost = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Coût estimé"
    )
    actual_cost = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Coût réel"
    )
    
    is_checked = models.BooleanField(default=False, verbose_name="Coché")
    notes = models.TextField(blank=True, verbose_name="Notes")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Article de liste"
        verbose_name_plural = "Articles de liste"
        ordering = ['-priority', 'product__category', 'product__name']
        unique_together = ['shopping_list', 'product']
    
    def __str__(self):
        return f"{self.product.name} x{self.suggested_quantity} - {self.shopping_list.title}"

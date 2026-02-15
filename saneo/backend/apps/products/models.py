from django.db import models
from django.conf import settings

class Category(models.Model):
    """Catégories de produits"""
    CATEGORY_CHOICES = [
        ('nourriture', 'Nourriture'),
        ('boisson', 'Boisson'),
        ('epices', 'Épices'),
        ('menage', 'Ménage'),
        ('hygiene', 'Hygiène'),
        ('autre', 'Autre'),
    ]
    
    name = models.CharField(max_length=100, choices=CATEGORY_CHOICES, unique=True, verbose_name="Nom")
    icon = models.CharField(max_length=50, blank=True, verbose_name="Icône", help_text="Emoji ou classe d'icône")
    color = models.CharField(max_length=7, default="#6B7280", verbose_name="Couleur", help_text="Code hexadécimal")
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Catégorie"
        verbose_name_plural = "Catégories"
        ordering = ['name']
    
    def __str__(self):
        return self.get_name_display()

class Location(models.Model):
    """Emplacements de stockage"""
    LOCATION_CHOICES = [
        ('frigo', 'Réfrigérateur'),
        ('congelateur', 'Congélateur'),
        ('placard', 'Placard'),
        ('cave', 'Cave'),
        ('garage', 'Garage'),
        ('autre', 'Autre'),
    ]
    
    name = models.CharField(max_length=100, choices=LOCATION_CHOICES, verbose_name="Nom")
    description = models.TextField(blank=True, verbose_name="Description")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='locations')
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Emplacement"
        verbose_name_plural = "Emplacements"
        ordering = ['name']
        unique_together = ['user', 'name']
    
    def __str__(self):
        return f"{self.get_name_display()} - {self.user.username}"

class Product(models.Model):
    """Produits du catalogue"""
    UNIT_CHOICES = [
        ('piece', 'Pièce'),
        ('g', 'Gramme'),
        ('kg', 'Kilogramme'),
        ('ml', 'Millilitre'),
        ('l', 'Litre'),
        ('paquet', 'Paquet'),
    ]
    
    name = models.CharField(max_length=200, verbose_name="Nom")
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name='products', verbose_name="Catégorie")
    unit = models.CharField(max_length=20, choices=UNIT_CHOICES, default='piece', verbose_name="Unité")
    default_location = models.ForeignKey(
        Location, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='default_products',
        verbose_name="Emplacement par défaut"
    )
    threshold = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=1,
        verbose_name="Seuil minimal",
        help_text="Quantité minimale avant ajout à la liste de courses"
    )
    barcode = models.CharField(max_length=50, blank=True, verbose_name="Code-barres")
    brand = models.CharField(max_length=100, blank=True, verbose_name="Marque")
    notes = models.TextField(blank=True, verbose_name="Notes")
    auto_add_to_list = models.BooleanField(default=True, verbose_name="Ajout automatique à la liste")
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='products')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Produit"
        verbose_name_plural = "Produits"
        ordering = ['name']
        unique_together = ['user', 'name']
    
    def __str__(self):
        return self.name
    
    @property
    def total_stock(self):
        """Calcule le stock total de ce produit"""
        from apps.stocks.models import StockBatch
        return StockBatch.objects.filter(product=self).aggregate(
            total=models.Sum('quantity')
        )['total'] or 0
    
    @property
    def is_below_threshold(self):
        """Vérifie si le stock est en dessous du seuil"""
        return self.total_stock < self.threshold
    
    @property
    def needs_restock(self):
        """Vérifie si le produit doit être racheté"""
        return self.total_stock == 0 or self.is_below_threshold

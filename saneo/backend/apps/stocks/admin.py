from django.contrib import admin
from .models import StockBatch, StockMovement, ExpiryAlert

@admin.register(StockBatch)
class StockBatchAdmin(admin.ModelAdmin):
    list_display = [
        'product', 'quantity', 'location', 'expiry_date',
        'days_until_expiry', 'is_expired', 'purchase_date', 'supplier'
    ]
    list_filter = ['location', 'expiry_date', 'purchase_date']
    search_fields = ['product__name', 'supplier', 'notes']
    readonly_fields = ['created_at', 'updated_at', 'is_expired', 'days_until_expiry']
    date_hierarchy = 'expiry_date'
    
    fieldsets = [
        ('Produit', {
            'fields': ('product', 'quantity', 'location')
        }),
        ('Dates', {
            'fields': ('purchase_date', 'expiry_date', 'days_until_expiry', 'is_expired')
        }),
        ('Achat', {
            'fields': ('purchase_price', 'supplier')
        }),
        ('Autres', {
            'fields': ('notes', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    ]

@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ['product', 'type', 'quantity', 'batch', 'user', 'date', 'created_at']
    list_filter = ['type', 'date', 'user']
    search_fields = ['product__name', 'note', 'user__username']
    readonly_fields = ['created_at']
    date_hierarchy = 'date'

@admin.register(ExpiryAlert)
class ExpiryAlertAdmin(admin.ModelAdmin):
    list_display = ['batch', 'alert_type', 'alert_date', 'is_read', 'email_sent']
    list_filter = ['alert_type', 'is_read', 'email_sent', 'alert_date']
    search_fields = ['batch__product__name']
    readonly_fields = ['alert_date']
    
    actions = ['mark_as_read', 'mark_as_unread']
    
    def mark_as_read(self, request, queryset):
        queryset.update(is_read=True)
    mark_as_read.short_description = "Marquer comme lu"
    
    def mark_as_unread(self, request, queryset):
        queryset.update(is_read=False)
    mark_as_unread.short_description = "Marquer comme non lu"

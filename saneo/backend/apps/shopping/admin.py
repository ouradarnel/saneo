from django.contrib import admin
from .models import ShoppingList, ShoppingListItem

class ShoppingListItemInline(admin.TabularInline):
    model = ShoppingListItem
    extra = 0
    fields = ['product', 'suggested_quantity', 'actual_quantity', 'priority', 'is_checked']

@admin.register(ShoppingList)
class ShoppingListAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'user', 'status', 'is_auto_generated',
        'total_items', 'completion_percentage', 'created_at'
    ]
    list_filter = ['status', 'is_auto_generated', 'created_at']
    search_fields = ['title', 'notes', 'user__username']
    readonly_fields = ['total_items', 'checked_items', 'completion_percentage', 'created_at', 'updated_at']
    inlines = [ShoppingListItemInline]
    
    fieldsets = [
        ('Informations', {
            'fields': ('user', 'title', 'status', 'is_auto_generated')
        }),
        ('Statistiques', {
            'fields': ('total_items', 'checked_items', 'completion_percentage')
        }),
        ('Dates', {
            'fields': ('created_at', 'updated_at', 'completed_at')
        }),
        ('Notes', {
            'fields': ('notes',),
            'classes': ('collapse',)
        }),
    ]

@admin.register(ShoppingListItem)
class ShoppingListItemAdmin(admin.ModelAdmin):
    list_display = [
        'product', 'shopping_list', 'suggested_quantity', 'actual_quantity',
        'priority', 'reason', 'is_checked', 'created_at'
    ]
    list_filter = ['priority', 'reason', 'is_checked', 'shopping_list__status']
    search_fields = ['product__name', 'shopping_list__title', 'notes']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = [
        ('Produit', {
            'fields': ('shopping_list', 'product')
        }),
        ('Quantités', {
            'fields': ('suggested_quantity', 'actual_quantity')
        }),
        ('Priorité & Raison', {
            'fields': ('priority', 'reason', 'is_checked')
        }),
        ('Coûts', {
            'fields': ('estimated_cost', 'actual_cost')
        }),
        ('Notes', {
            'fields': ('notes', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    ]

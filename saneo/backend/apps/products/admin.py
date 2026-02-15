from django.contrib import admin
from .models import Category, Location, Product

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'icon', 'color', 'created_at']
    search_fields = ['name']

@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'description', 'created_at']
    list_filter = ['name', 'user']
    search_fields = ['name', 'description', 'user__username']

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'unit', 'threshold', 'brand', 'user', 'auto_add_to_list', 'created_at']
    list_filter = ['category', 'unit', 'auto_add_to_list', 'created_at']
    search_fields = ['name', 'brand', 'barcode', 'user__username']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = [
        ('Informations générales', {
            'fields': ('name', 'category', 'user', 'brand', 'barcode')
        }),
        ('Stock', {
            'fields': ('unit', 'threshold', 'default_location', 'auto_add_to_list')
        }),
        ('Notes', {
            'fields': ('notes',),
            'classes': ('collapse',)
        }),
        ('Dates', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    ]

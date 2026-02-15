from rest_framework import serializers
from .models import Category, Location, Product

class CategorySerializer(serializers.ModelSerializer):
    name_display = serializers.CharField(source='get_name_display', read_only=True)
    product_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'name_display', 'icon', 'color', 'product_count', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_product_count(self, obj):
        return obj.products.count()

class LocationSerializer(serializers.ModelSerializer):
    name_display = serializers.CharField(source='get_name_display', read_only=True)
    
    class Meta:
        model = Location
        fields = ['id', 'name', 'name_display', 'description', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class ProductListSerializer(serializers.ModelSerializer):
    """Serializer simplifié pour les listes de produits"""
    category_name = serializers.CharField(source='category.get_name_display', read_only=True)
    location_name = serializers.CharField(source='default_location.get_name_display', read_only=True)
    unit_display = serializers.CharField(source='get_unit_display', read_only=True)
    total_stock = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    is_below_threshold = serializers.BooleanField(read_only=True)
    needs_restock = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'category', 'category_name', 'unit', 'unit_display',
            'default_location', 'location_name', 'threshold', 'total_stock',
            'is_below_threshold', 'needs_restock', 'brand', 'auto_add_to_list'
        ]

class ProductDetailSerializer(serializers.ModelSerializer):
    """Serializer complet pour un produit"""
    category_name = serializers.CharField(source='category.get_name_display', read_only=True)
    location_name = serializers.CharField(source='default_location.get_name_display', read_only=True)
    unit_display = serializers.CharField(source='get_unit_display', read_only=True)
    total_stock = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    is_below_threshold = serializers.BooleanField(read_only=True)
    needs_restock = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'category', 'category_name', 'unit', 'unit_display',
            'default_location', 'location_name', 'threshold', 'barcode', 'brand',
            'notes', 'auto_add_to_list', 'total_stock', 'is_below_threshold',
            'needs_restock', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class ProductCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer pour création/modification de produits"""
    
    class Meta:
        model = Product
        fields = [
            'name', 'category', 'unit', 'default_location', 'threshold',
            'barcode', 'brand', 'notes', 'auto_add_to_list'
        ]

    def validate_unit(self, value):
        # L'application gère désormais tous les produits en "pièce".
        return 'piece'
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        validated_data['unit'] = 'piece'
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data['unit'] = 'piece'
        return super().update(instance, validated_data)

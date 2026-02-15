from rest_framework import serializers
from .models import ShoppingList, ShoppingListItem
from apps.products.serializers import ProductListSerializer

class ShoppingListItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_unit = serializers.CharField(source='product.get_unit_display', read_only=True)
    category_name = serializers.CharField(source='product.category.get_name_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    reason_display = serializers.CharField(source='get_reason_display', read_only=True)
    
    class Meta:
        model = ShoppingListItem
        fields = [
            'id', 'product', 'product_name', 'product_unit', 'category_name',
            'suggested_quantity', 'actual_quantity', 'priority', 'priority_display',
            'reason', 'reason_display', 'estimated_cost', 'actual_cost',
            'is_checked', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class ShoppingListItemCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShoppingListItem
        fields = [
            'product', 'suggested_quantity', 'priority', 'reason',
            'estimated_cost', 'notes'
        ]

class ShoppingListSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    total_items = serializers.IntegerField(read_only=True)
    checked_items = serializers.IntegerField(read_only=True)
    completion_percentage = serializers.IntegerField(read_only=True)
    estimated_total_cost = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    
    class Meta:
        model = ShoppingList
        fields = [
            'id', 'title', 'status', 'status_display', 'is_auto_generated',
            'notes', 'total_items', 'checked_items', 'completion_percentage',
            'estimated_total_cost', 'created_at', 'updated_at', 'completed_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class ShoppingListDetailSerializer(serializers.ModelSerializer):
    items = ShoppingListItemSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    total_items = serializers.IntegerField(read_only=True)
    checked_items = serializers.IntegerField(read_only=True)
    completion_percentage = serializers.IntegerField(read_only=True)
    estimated_total_cost = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    
    class Meta:
        model = ShoppingList
        fields = [
            'id', 'title', 'status', 'status_display', 'is_auto_generated',
            'notes', 'items', 'total_items', 'checked_items',
            'completion_percentage', 'estimated_total_cost',
            'created_at', 'updated_at', 'completed_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class ShoppingListCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShoppingList
        fields = ['title', 'notes']
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class ShoppingListItemsByCategorySerializer(serializers.Serializer):
    """Serializer pour items groupés par catégorie"""
    category = serializers.CharField()
    category_display = serializers.CharField()
    items = ShoppingListItemSerializer(many=True)

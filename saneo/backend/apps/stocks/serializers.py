from rest_framework import serializers
from .models import StockBatch, StockMovement, ExpiryAlert
from apps.products.serializers import ProductListSerializer

class StockBatchSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_unit = serializers.CharField(source='product.get_unit_display', read_only=True)
    location_name = serializers.CharField(source='location.get_name_display', read_only=True)
    is_expired = serializers.BooleanField(read_only=True)
    days_until_expiry = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = StockBatch
        fields = [
            'id', 'product', 'product_name', 'product_unit', 'quantity',
            'location', 'location_name', 'expiry_date', 'purchase_date',
            'purchase_price', 'supplier', 'notes', 'is_expired',
            'days_until_expiry', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class StockBatchCreateSerializer(serializers.ModelSerializer):
    """Serializer pour créer un lot et générer automatiquement un mouvement"""
    
    class Meta:
        model = StockBatch
        fields = [
            'product', 'quantity', 'location', 'expiry_date',
            'purchase_date', 'purchase_price', 'supplier', 'notes'
        ]
    
    def create(self, validated_data):
        initial_quantity = validated_data['quantity']
        validated_data['quantity'] = 0
        batch = super().create(validated_data)
        
        # Créer automatiquement un mouvement d'entrée
        StockMovement.objects.create(
            product=batch.product,
            batch=batch,
            type='IN',
            quantity=initial_quantity,
            user=self.context['request'].user,
            note=f"Création du lot #{batch.id}"
        )
        
        return batch

class StockMovementSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = StockMovement
        fields = [
            'id', 'product', 'product_name', 'batch', 'type', 'type_display',
            'quantity', 'date', 'note', 'user_name', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'user_name']

class StockMovementCreateSerializer(serializers.ModelSerializer):
    """Serializer pour créer un mouvement de stock"""
    
    class Meta:
        model = StockMovement
        fields = ['product', 'batch', 'type', 'quantity', 'note']
    
    def validate(self, attrs):
        """Validation personnalisée"""
        batch = attrs.get('batch')
        quantity = attrs.get('quantity')
        movement_type = attrs.get('type')
        
        # Vérifier que la quantité est positive
        if quantity <= 0:
            raise serializers.ValidationError("La quantité doit être positive.")
        
        # Vérifier qu'on ne sort pas plus que disponible
        if movement_type == 'OUT' and batch and batch.quantity < quantity:
            raise serializers.ValidationError(
                f"Quantité insuffisante. Disponible: {batch.quantity}"
            )
        
        return attrs
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class ExpiryAlertSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='batch.product.name', read_only=True)
    batch_quantity = serializers.DecimalField(
        source='batch.quantity',
        max_digits=10,
        decimal_places=2,
        read_only=True
    )
    expiry_date = serializers.DateField(source='batch.expiry_date', read_only=True)
    days_until_expiry = serializers.IntegerField(source='batch.days_until_expiry', read_only=True)
    alert_type_display = serializers.CharField(source='get_alert_type_display', read_only=True)
    
    class Meta:
        model = ExpiryAlert
        fields = [
            'id', 'batch', 'product_name', 'batch_quantity', 'expiry_date',
            'days_until_expiry', 'alert_type', 'alert_type_display',
            'alert_date', 'is_read', 'email_sent'
        ]
        read_only_fields = ['id', 'alert_date']

class StockSummarySerializer(serializers.Serializer):
    """Serializer pour le résumé du stock"""
    total_products = serializers.IntegerField()
    total_batches = serializers.IntegerField()
    products_below_threshold = serializers.IntegerField()
    products_out_of_stock = serializers.IntegerField()
    batches_expiring_soon = serializers.IntegerField()
    batches_expired = serializers.IntegerField()
    total_value = serializers.DecimalField(max_digits=15, decimal_places=2)

from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from decimal import Decimal, InvalidOperation
from django.db import transaction
from .models import Category, Location, Product
from .serializers import (
    CategorySerializer, LocationSerializer, 
    ProductListSerializer, ProductDetailSerializer,
    ProductCreateUpdateSerializer
)

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet pour les catégories (lecture seule)
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']

class LocationViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour les emplacements
    """
    serializer_class = LocationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    
    def get_queryset(self):
        return Location.objects.filter(user=self.request.user)

class ProductViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour les produits
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'default_location', 'unit']
    search_fields = ['name', 'brand', 'barcode']
    ordering_fields = ['name', 'created_at', 'threshold']
    ordering = ['name']
    
    def get_queryset(self):
        return Product.objects.filter(user=self.request.user).select_related(
            'category', 'default_location'
        )
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ProductListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ProductCreateUpdateSerializer
        return ProductDetailSerializer
    
    @action(detail=False, methods=['get'])
    def to_restock(self, request):
        """Liste des produits à racheter"""
        products = self.get_queryset().filter(
            auto_add_to_list=True
        )
        
        # Filtrer ceux qui sont en dessous du seuil
        to_restock = [p for p in products if p.needs_restock]
        
        serializer = ProductListSerializer(to_restock, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """Liste des produits en stock faible (mais pas à zéro)"""
        products = self.get_queryset()
        
        low_stock = [p for p in products if p.is_below_threshold and p.total_stock > 0]
        
        serializer = ProductListSerializer(low_stock, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def out_of_stock(self, request):
        """Liste des produits en rupture de stock"""
        products = self.get_queryset()
        
        out_of_stock = [p for p in products if p.total_stock == 0]
        
        serializer = ProductListSerializer(out_of_stock, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """Produits groupés par catégorie"""
        categories = Category.objects.all()
        result = []
        
        for category in categories:
            products = self.get_queryset().filter(category=category)
            if products.exists():
                result.append({
                    'category': CategorySerializer(category).data,
                    'products': ProductListSerializer(products, many=True).data
                })
        
        return Response(result)
    
    @action(detail=True, methods=['post'])
    def check_barcode(self, request, pk=None):
        """Vérifier si un code-barres existe déjà"""
        barcode = request.data.get('barcode')
        if not barcode:
            return Response(
                {'error': 'Code-barres requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        exists = Product.objects.filter(
            user=request.user,
            barcode=barcode
        ).exclude(pk=pk).exists()
        
        return Response({'exists': exists})

    @action(detail=True, methods=['post'])
    def consume_stock(self, request, pk=None):
        """
        Consommer le stock d'un produit sans choisir de lot manuellement.
        Priorité: lots avec péremption la plus proche puis lots sans péremption.
        """
        product = self.get_object()
        quantity_raw = request.data.get('quantity')

        if quantity_raw in (None, ''):
            return Response(
                {'error': 'Quantité requise'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            quantity_to_consume = Decimal(str(quantity_raw).replace(',', '.'))
        except (InvalidOperation, TypeError, ValueError):
            return Response(
                {'error': 'Quantité invalide'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if quantity_to_consume <= 0:
            return Response(
                {'error': 'La quantité doit être positive'},
                status=status.HTTP_400_BAD_REQUEST
            )

        from apps.stocks.models import StockBatch, StockMovement

        batches = StockBatch.objects.filter(
            product=product,
            quantity__gt=0
        )

        total_available = sum(batch.quantity for batch in batches)
        if quantity_to_consume > total_available:
            return Response(
                {'error': f'Quantité insuffisante. Disponible: {total_available}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        note = request.data.get('note', 'Consommation rapide depuis produits')
        remaining_to_consume = quantity_to_consume
        movements_created = 0

        expiring_batches = batches.filter(
            expiry_date__isnull=False
        ).order_by('expiry_date', 'purchase_date', 'id')
        non_expiring_batches = batches.filter(
            expiry_date__isnull=True
        ).order_by('purchase_date', 'id')

        with transaction.atomic():
            for batch in list(expiring_batches) + list(non_expiring_batches):
                if remaining_to_consume <= 0:
                    break

                consumed = min(batch.quantity, remaining_to_consume)
                StockMovement.objects.create(
                    product=product,
                    batch=batch,
                    type='OUT',
                    quantity=consumed,
                    user=request.user,
                    note=note
                )
                remaining_to_consume -= consumed
                movements_created += 1

        return Response({
            'message': 'Consommation enregistrée',
            'consumed': quantity_to_consume,
            'remaining_total_stock': product.total_stock,
            'movements_created': movements_created
        })

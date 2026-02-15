from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal, InvalidOperation
from .models import StockBatch, StockMovement, ExpiryAlert
from .serializers import (
    StockBatchSerializer, StockBatchCreateSerializer,
    StockMovementSerializer, StockMovementCreateSerializer,
    ExpiryAlertSerializer, StockSummarySerializer
)

class StockBatchViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour les lots de stock
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['product', 'location']
    search_fields = ['product__name', 'supplier', 'notes']
    ordering_fields = ['expiry_date', 'quantity', 'purchase_date', 'created_at']
    ordering = ['expiry_date']
    
    def get_queryset(self):
        return StockBatch.objects.filter(
            product__user=self.request.user
        ).select_related('product', 'location')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return StockBatchCreateSerializer
        return StockBatchSerializer
    
    @action(detail=False, methods=['get'])
    def expiring_soon(self, request):
        """Lots qui expirent bientôt"""
        days = int(request.query_params.get('days', 7))
        today = timezone.now().date()
        limit_date = today + timedelta(days=days)
        
        batches = self.get_queryset().filter(
            expiry_date__isnull=False,
            expiry_date__gt=today,
            expiry_date__lte=limit_date,
            quantity__gt=0
        )
        
        serializer = self.get_serializer(batches, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def expired(self, request):
        """Lots expirés"""
        today = timezone.now().date()
        
        batches = self.get_queryset().filter(
            expiry_date__isnull=False,
            expiry_date__lt=today,
            quantity__gt=0
        )
        
        serializer = self.get_serializer(batches, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def to_consume_first(self, request):
        """Lots à consommer en priorité (triés par date de péremption)"""
        batches = self.get_queryset().filter(
            expiry_date__isnull=False,
            quantity__gt=0
        ).order_by('expiry_date')[:20]
        
        serializer = self.get_serializer(batches, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def consume(self, request, pk=None):
        """Consommer une quantité d'un lot"""
        batch = self.get_object()
        quantity_raw = request.data.get('quantity')
        
        if quantity_raw in (None, ''):
            return Response(
                {'error': 'Quantité requise'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Accepte aussi le format avec virgule (ex: "0,5")
            quantity = Decimal(str(quantity_raw).replace(',', '.'))
        except (InvalidOperation, TypeError, ValueError):
            return Response(
                {'error': 'Quantité invalide'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if quantity <= 0:
            return Response(
                {'error': 'La quantité doit être positive'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if quantity > batch.quantity:
            return Response(
                {'error': f'Quantité insuffisante. Disponible: {batch.quantity}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Créer un mouvement de sortie
        movement = StockMovement.objects.create(
            product=batch.product,
            batch=batch,
            type='OUT',
            quantity=quantity,
            user=request.user,
            note=request.data.get('note', 'Consommation')
        )
        
        return Response({
            'message': 'Consommation enregistrée',
            'remaining': batch.quantity,
            'movement': StockMovementSerializer(movement).data
        })

class StockMovementViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour les mouvements de stock
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['product', 'type', 'batch']
    ordering_fields = ['date', 'created_at']
    ordering = ['-date']
    
    def get_queryset(self):
        return StockMovement.objects.filter(
            product__user=self.request.user
        ).select_related('product', 'batch', 'user')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return StockMovementCreateSerializer
        return StockMovementSerializer
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Mouvements récents (30 derniers jours)"""
        days = int(request.query_params.get('days', 30))
        since = timezone.now() - timedelta(days=days)
        
        movements = self.get_queryset().filter(date__gte=since)
        serializer = self.get_serializer(movements, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_product(self, request):
        """Mouvements groupés par produit"""
        product_id = request.query_params.get('product')
        if not product_id:
            return Response(
                {'error': 'ID produit requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        movements = self.get_queryset().filter(product_id=product_id)
        serializer = self.get_serializer(movements, many=True)
        return Response(serializer.data)

class ExpiryAlertViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet pour les alertes de péremption (lecture seule)
    """
    serializer_class = ExpiryAlertSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['alert_type', 'is_read']
    ordering = ['-alert_date']
    
    def get_queryset(self):
        return ExpiryAlert.objects.filter(
            batch__product__user=self.request.user
        ).select_related('batch__product')
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Marquer une alerte comme lue"""
        alert = self.get_object()
        alert.is_read = True
        alert.save()
        return Response({'status': 'marked as read'})
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Marquer toutes les alertes comme lues"""
        count = self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({'count': count})
    
    @action(detail=False, methods=['get'])
    def unread(self, request):
        """Alertes non lues"""
        alerts = self.get_queryset().filter(is_read=False)
        serializer = self.get_serializer(alerts, many=True)
        return Response(serializer.data)

class StockDashboardViewSet(viewsets.ViewSet):
    """
    ViewSet pour le tableau de bord des stocks
    """
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Résumé global du stock"""
        user = request.user
        
        from apps.products.models import Product
        
        products = Product.objects.filter(user=user)
        batches = StockBatch.objects.filter(product__user=user, quantity__gt=0)
        
        today = timezone.now().date()
        days = user.notification_expiry_days
        
        summary = {
            'total_products': products.count(),
            'total_batches': batches.count(),
            'products_below_threshold': sum(1 for p in products if p.is_below_threshold),
            'products_out_of_stock': sum(1 for p in products if p.total_stock == 0),
            'batches_expiring_soon': batches.filter(
                expiry_date__isnull=False,
                expiry_date__gt=today,
                expiry_date__lte=today + timedelta(days=days)
            ).count(),
            'batches_expired': batches.filter(
                expiry_date__isnull=False,
                expiry_date__lt=today
            ).count(),
            'total_value': batches.aggregate(
                total=Sum('purchase_price')
            )['total'] or 0
        }
        
        serializer = StockSummarySerializer(summary)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def consumption_stats(self, request):
        """Statistiques de consommation"""
        days = int(request.query_params.get('days', 30))
        since = timezone.now() - timedelta(days=days)
        
        movements = StockMovement.objects.filter(
            product__user=request.user,
            type='OUT',
            date__gte=since
        ).values('product__name', 'product__id').annotate(
            total_consumed=Sum('quantity'),
            count=Count('id')
        ).order_by('-total_consumed')[:10]
        
        return Response(list(movements))

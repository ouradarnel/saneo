from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Q
from decimal import Decimal
from .models import ShoppingList, ShoppingListItem
from .serializers import (
    ShoppingListSerializer, ShoppingListDetailSerializer,
    ShoppingListCreateSerializer, ShoppingListItemSerializer,
    ShoppingListItemCreateSerializer, ShoppingListItemsByCategorySerializer
)
from apps.products.models import Product, Category

class ShoppingListViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour les listes de courses
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'is_auto_generated']
    search_fields = ['title', 'notes']
    ordering_fields = ['created_at', 'updated_at', 'completed_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return ShoppingList.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ShoppingListCreateSerializer
        elif self.action == 'retrieve':
            return ShoppingListDetailSerializer
        return ShoppingListSerializer
    
    @action(detail=False, methods=['post'])
    def generate_auto(self, request):
        """
        Génère automatiquement une liste de courses basée sur :
        - Produits sous le seuil
        - Produits en rupture de stock
        - Produits qui expirent bientôt
        """
        user = request.user
        
        # Créer la liste
        shopping_list = ShoppingList.objects.create(
            user=user,
            title=f"Liste automatique - {timezone.now().strftime('%d/%m/%Y')}",
            status='active',
            is_auto_generated=True
        )
        
        products = Product.objects.filter(user=user, auto_add_to_list=True)
        items_created = []
        
        for product in products:
            current_stock = product.total_stock
            threshold = product.threshold
            
            # Produit en rupture de stock
            if current_stock == 0:
                item = ShoppingListItem.objects.create(
                    shopping_list=shopping_list,
                    product=product,
                    suggested_quantity=threshold,
                    priority='urgent',
                    reason='out_of_stock'
                )
                items_created.append(item)
            
            # Produit sous le seuil
            elif current_stock < threshold:
                quantity_needed = threshold - current_stock
                item = ShoppingListItem.objects.create(
                    shopping_list=shopping_list,
                    product=product,
                    suggested_quantity=quantity_needed,
                    priority='high' if current_stock < (threshold * Decimal('0.3')) else 'normal',
                    reason='below_threshold'
                )
                items_created.append(item)
        
        if not items_created:
            shopping_list.delete()
            return Response({
                'message': "Pas besoin de faire des courses",
                'list_created': False,
                'item_count': 0,
                'list': None,
            }, status=status.HTTP_200_OK)

        serializer = ShoppingListDetailSerializer(shopping_list)
        return Response({
            'message': f'Liste générée avec {len(items_created)} articles',
            'list_created': True,
            'item_count': len(items_created),
            'list': serializer.data
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activer une liste"""
        shopping_list = self.get_object()
        shopping_list.status = 'active'
        shopping_list.save()
        return Response({'status': 'activated'})
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Marquer une liste comme terminée"""
        shopping_list = self.get_object()
        shopping_list.status = 'completed'
        shopping_list.completed_at = timezone.now()
        shopping_list.save()
        
        # Optionnel : mettre à jour les stocks pour les items cochés
        auto_update_stock_raw = request.data.get('auto_update_stock', False)
        if isinstance(auto_update_stock_raw, str):
            auto_update_stock = auto_update_stock_raw.strip().lower() in ['1', 'true', 'yes', 'on']
        else:
            auto_update_stock = bool(auto_update_stock_raw)
        
        batches_created = 0
        
        if auto_update_stock:
            from apps.stocks.models import StockBatch, StockMovement
            
            for item in shopping_list.items.filter(is_checked=True):
                quantity_to_add = item.actual_quantity or item.suggested_quantity

                # Créer un nouveau lot
                batch = StockBatch.objects.create(
                    product=item.product,
                    quantity=0,
                    location=item.product.default_location,
                    purchase_date=timezone.now().date(),
                    purchase_price=item.actual_cost
                )
                
                # Créer un mouvement d'entrée
                StockMovement.objects.create(
                    product=item.product,
                    batch=batch,
                    type='IN',
                    quantity=quantity_to_add,
                    user=request.user,
                    note=f"Achat - Liste: {shopping_list.title}"
                )
                batches_created += 1
        
        return Response({
            'status': 'completed',
            'stock_updated': auto_update_stock,
            'batches_created': batches_created,
        })
    
    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        """Archiver une liste"""
        shopping_list = self.get_object()
        shopping_list.status = 'archived'
        shopping_list.save()
        return Response({'status': 'archived'})
    
    @action(detail=True, methods=['get'])
    def by_category(self, request, pk=None):
        """Items groupés par catégorie"""
        shopping_list = self.get_object()
        categories = Category.objects.all()
        
        result = []
        for category in categories:
            items = shopping_list.items.filter(product__category=category)
            if items.exists():
                result.append({
                    'category': category.name,
                    'category_display': category.get_name_display(),
                    'items': ShoppingListItemSerializer(items, many=True).data
                })
        
        serializer = ShoppingListItemsByCategorySerializer(result, many=True)
        return Response(serializer.data)

class ShoppingListItemViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour les items de liste de courses
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['shopping_list', 'product', 'priority', 'is_checked']
    ordering_fields = ['priority', 'created_at']
    ordering = ['-priority', 'product__name']
    
    def get_queryset(self):
        return ShoppingListItem.objects.filter(
            shopping_list__user=self.request.user
        ).select_related('product', 'shopping_list', 'product__category')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ShoppingListItemCreateSerializer
        return ShoppingListItemSerializer
    
    def create(self, request, *args, **kwargs):
        """Créer un item dans une liste"""
        shopping_list_id = request.data.get('shopping_list')
        
        # Vérifier que la liste appartient à l'utilisateur
        try:
            shopping_list = ShoppingList.objects.get(
                id=shopping_list_id,
                user=request.user
            )
        except ShoppingList.DoesNotExist:
            return Response(
                {'error': 'Liste de courses introuvable'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Vérifier que le produit n'est pas déjà dans la liste
        product_id = serializer.validated_data['product'].id
        if ShoppingListItem.objects.filter(
            shopping_list=shopping_list,
            product_id=product_id
        ).exists():
            return Response(
                {'error': 'Ce produit est déjà dans la liste'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        item = serializer.save(shopping_list=shopping_list)
        
        return Response(
            ShoppingListItemSerializer(item).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['post'])
    def toggle_check(self, request, pk=None):
        """Cocher/décocher un item"""
        item = self.get_object()
        item.is_checked = not item.is_checked
        item.save()
        
        serializer = self.get_serializer(item)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def set_actual(self, request, pk=None):
        """Définir la quantité/prix réellement achetés"""
        item = self.get_object()
        
        actual_quantity = request.data.get('actual_quantity')
        actual_cost = request.data.get('actual_cost')
        
        if actual_quantity is not None:
            item.actual_quantity = actual_quantity
            item.is_checked = True
        
        if actual_cost is not None:
            item.actual_cost = actual_cost
        
        item.save()
        
        serializer = self.get_serializer(item)
        return Response(serializer.data)

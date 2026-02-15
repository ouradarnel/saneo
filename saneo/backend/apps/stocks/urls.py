from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    StockBatchViewSet, StockMovementViewSet,
    ExpiryAlertViewSet, StockDashboardViewSet
)

router = DefaultRouter()
router.register(r'batches', StockBatchViewSet, basename='batch')
router.register(r'movements', StockMovementViewSet, basename='movement')
router.register(r'alerts', ExpiryAlertViewSet, basename='alert')
router.register(r'dashboard', StockDashboardViewSet, basename='dashboard')

urlpatterns = [
    path('', include(router.urls)),
]

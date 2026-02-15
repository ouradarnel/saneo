from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.products.models import Category, Location, Product
from apps.shopping.models import ShoppingList, ShoppingListItem
from apps.stocks.models import StockBatch, StockMovement


class ShoppingCompleteApiTests(TestCase):
    def setUp(self):
        user_model = get_user_model()
        self.user = user_model.objects.create_user(
            username='shopping_tester',
            email='shopping_tester@example.com',
            password='StrongPass123!'
        )

        self.client = APIClient()
        self.client.force_authenticate(self.user)

        self.category = Category.objects.create(name='boisson')
        self.location = Location.objects.create(user=self.user, name='frigo', description='Frigo test')
        self.product = Product.objects.create(
            user=self.user,
            name='Lait test',
            category=self.category,
            unit='l',
            default_location=self.location,
            threshold=Decimal('2.00'),
        )

        self.shopping_list = ShoppingList.objects.create(
            user=self.user,
            title='Liste test',
            status='active',
        )
        self.item = ShoppingListItem.objects.create(
            shopping_list=self.shopping_list,
            product=self.product,
            suggested_quantity=Decimal('2.00'),
            is_checked=True,
            priority='normal',
            reason='manual',
        )

    def test_complete_with_auto_update_adds_stock_from_suggested_quantity(self):
        response = self.client.post(
            f'/api/v1/shopping/lists/{self.shopping_list.id}/complete/',
            {'auto_update_stock': True},
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['stock_updated'])
        self.assertEqual(response.data['batches_created'], 1)

        created_batch = StockBatch.objects.get(product=self.product)
        self.assertEqual(created_batch.quantity, Decimal('2.00'))
        self.assertEqual(created_batch.location, self.location)

        movement = StockMovement.objects.get(batch=created_batch)
        self.assertEqual(movement.type, 'IN')
        self.assertEqual(movement.quantity, Decimal('2.00'))

    def test_complete_with_string_true_auto_update_is_supported(self):
        response = self.client.post(
            f'/api/v1/shopping/lists/{self.shopping_list.id}/complete/',
            {'auto_update_stock': 'true'},
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['stock_updated'])

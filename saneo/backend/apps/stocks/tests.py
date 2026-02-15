from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.products.models import Category, Location, Product
from apps.stocks.models import StockBatch


class StockConsumeApiTests(TestCase):
    def setUp(self):
        user_model = get_user_model()
        self.user = user_model.objects.create_user(
            username='stock_tester',
            email='stock_tester@example.com',
            password='StrongPass123!'
        )

        self.client = APIClient()
        self.client.force_authenticate(self.user)

        self.category = Category.objects.create(name='nourriture')
        self.location = Location.objects.create(user=self.user, name='placard', description='Placard test')
        self.product = Product.objects.create(
            user=self.user,
            name='Pates test',
            category=self.category,
            unit='kg',
            default_location=self.location,
            threshold=Decimal('1.00'),
        )
        self.batch = StockBatch.objects.create(
            product=self.product,
            quantity=Decimal('5.00'),
            location=self.location,
        )

    def test_consume_accepts_comma_decimal_quantity(self):
        response = self.client.post(
            f'/api/v1/stocks/batches/{self.batch.id}/consume/',
            {'quantity': '0,5', 'note': 'Test consume comma'},
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.batch.refresh_from_db()
        self.assertEqual(self.batch.quantity, Decimal('4.50'))

    def test_consume_rejects_quantity_greater_than_available(self):
        response = self.client.post(
            f'/api/v1/stocks/batches/{self.batch.id}/consume/',
            {'quantity': '9'},
            format='json',
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn('Quantité insuffisante', response.data['error'])

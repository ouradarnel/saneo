from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from apps.products.models import Product, Category, Location
from apps.stocks.models import StockBatch, StockMovement

User = get_user_model()

class Command(BaseCommand):
    help = 'Crée des données de test pour la démo'

    def handle(self, *args, **kwargs):
        # Créer un utilisateur de test
        user, created = User.objects.get_or_create(
            username='demo',
            defaults={
                'email': 'demo@saneo.local',
                'first_name': 'Utilisateur',
                'last_name': 'Démo'
            }
        )
        if created:
            user.set_password('demo123')
            user.save()
            self.stdout.write(self.style.SUCCESS('✓ Utilisateur demo créé (demo/demo123)'))

        # Charger les catégories
        self.stdout.write('Chargement des catégories...')
        from django.core.management import call_command
        call_command('load_initial_categories')

        # Créer des emplacements
        locations_data = [
            {'name': 'frigo', 'description': 'Réfrigérateur principal'},
            {'name': 'congelateur', 'description': 'Congélateur'},
            {'name': 'placard', 'description': 'Placard de la cuisine'},
            {'name': 'cave', 'description': 'Cave à provisions'},
        ]

        for loc_data in locations_data:
            loc, created = Location.objects.get_or_create(
                user=user,
                name=loc_data['name'],
                defaults={'description': loc_data['description']}
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'✓ Emplacement "{loc.get_name_display()}" créé'))

        # Créer des produits
        cat_nourriture = Category.objects.get(name='nourriture')
        cat_boisson = Category.objects.get(name='boisson')
        cat_menage = Category.objects.get(name='menage')

        loc_frigo = Location.objects.get(user=user, name='frigo')
        loc_placard = Location.objects.get(user=user, name='placard')

        products_data = [
            {
                'name': 'Lait demi-écrémé',
                'category': cat_boisson,
                'unit': 'piece',
                'location': loc_frigo,
                'threshold': Decimal('2'),
                'brand': 'Lactel'
            },
            {
                'name': 'Œufs',
                'category': cat_nourriture,
                'unit': 'piece',
                'location': loc_frigo,
                'threshold': Decimal('6'),
                'brand': 'Bio'
            },
            {
                'name': 'Pâtes',
                'category': cat_nourriture,
                'unit': 'piece',
                'location': loc_placard,
                'threshold': Decimal('1'),
                'brand': 'Barilla'
            },
            {
                'name': 'Riz',
                'category': cat_nourriture,
                'unit': 'piece',
                'location': loc_placard,
                'threshold': Decimal('2'),
                'brand': 'Taureau Ailé'
            },
            {
                'name': 'Liquide vaisselle',
                'category': cat_menage,
                'unit': 'piece',
                'location': loc_placard,
                'threshold': Decimal('500'),
                'brand': 'Paic'
            },
        ]

        for prod_data in products_data:
            product, created = Product.objects.get_or_create(
                user=user,
                name=prod_data['name'],
                defaults={
                    'category': prod_data['category'],
                    'unit': prod_data['unit'],
                    'default_location': prod_data['location'],
                    'threshold': prod_data['threshold'],
                    'brand': prod_data.get('brand', ''),
                }
            )
            if product.unit != 'piece':
                product.unit = 'piece'
                product.save(update_fields=['unit'])
            if created:
                self.stdout.write(self.style.SUCCESS(f'✓ Produit "{product.name}" créé'))

                # Créer un stock pour ce produit
                today = timezone.now().date()
                batch = StockBatch.objects.create(
                    product=product,
                    quantity=0,
                    location=prod_data['location'],
                    expiry_date=today + timedelta(days=30) if 'Lait' in product.name or 'Œuf' in product.name else None,
                    purchase_date=today
                )

                initial_quantity = prod_data['threshold'] + Decimal('2')
                StockMovement.objects.create(
                    product=product,
                    batch=batch,
                    type='IN',
                    quantity=initial_quantity,
                    user=user,
                    note='Stock initial de démo'
                )

        self.stdout.write(self.style.SUCCESS('\n✅ Données de test créées avec succès!'))
        self.stdout.write(self.style.SUCCESS('Connectez-vous avec: demo / demo123'))

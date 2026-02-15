from django.core.management.base import BaseCommand
from apps.products.models import Category

class Command(BaseCommand):
    help = 'Charge les catégories par défaut'

    def handle(self, *args, **kwargs):
        categories_data = [
            {'name': 'nourriture', 'icon': '🍞', 'color': '#F59E0B'},
            {'name': 'boisson', 'icon': '🥤', 'color': '#3B82F6'},
            {'name': 'epices', 'icon': '🌶️', 'color': '#EF4444'},
            {'name': 'menage', 'icon': '🧹', 'color': '#10B981'},
            {'name': 'hygiene', 'icon': '🧴', 'color': '#8B5CF6'},
            {'name': 'autre', 'icon': '📦', 'color': '#6B7280'},
        ]

        for data in categories_data:
            category, created = Category.objects.get_or_create(
                name=data['name'],
                defaults={'icon': data['icon'], 'color': data['color']}
            )
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Catégorie "{category.get_name_display()}" créée')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'- Catégorie "{category.get_name_display()}" existe déjà')
                )

        self.stdout.write(self.style.SUCCESS('\nCatégories initialisées avec succès!'))

from celery import shared_task
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from decimal import Decimal
from .models import ShoppingList, ShoppingListItem
from apps.products.models import Product
from apps.users.models import User

@shared_task
def generate_monthly_shopping_list():
    """
    Tâche mensuelle pour générer automatiquement une liste de courses
    pour tous les utilisateurs actifs
    """
    users = User.objects.filter(is_active=True)
    lists_created = 0
    
    for user in users:
        # Créer la liste
        shopping_list = ShoppingList.objects.create(
            user=user,
            title=f"Liste mensuelle - {timezone.now().strftime('%B %Y')}",
            status='active',
            is_auto_generated=True
        )
        
        products = Product.objects.filter(user=user, auto_add_to_list=True)
        items_created = 0
        
        for product in products:
            current_stock = product.total_stock
            threshold = product.threshold
            
            # Produit en rupture de stock
            if current_stock == 0:
                ShoppingListItem.objects.create(
                    shopping_list=shopping_list,
                    product=product,
                    suggested_quantity=threshold,
                    priority='urgent',
                    reason='out_of_stock'
                )
                items_created += 1
            
            # Produit sous le seuil
            elif current_stock < threshold:
                quantity_needed = threshold - current_stock
                ShoppingListItem.objects.create(
                    shopping_list=shopping_list,
                    product=product,
                    suggested_quantity=quantity_needed,
                    priority='high' if current_stock < (threshold * Decimal('0.3')) else 'normal',
                    reason='below_threshold'
                )
                items_created += 1
        
        # Envoyer email de notification
        if items_created > 0 and user.notification_email and user.email:
            send_shopping_list_email.delay(user.id, shopping_list.id)
        
        if items_created > 0:
            lists_created += 1
    
    return f"{lists_created} listes de courses créées"

@shared_task
def send_shopping_list_email(user_id, shopping_list_id):
    """
    Envoyer un email pour notifier de la création d'une liste de courses
    """
    try:
        user = User.objects.get(id=user_id)
        shopping_list = ShoppingList.objects.get(id=shopping_list_id)
        
        subject = f"SANEO - Nouvelle liste de courses : {shopping_list.title}"
        
        message = f"Bonjour {user.first_name or user.username},\n\n"
        message += f"Une nouvelle liste de courses a été générée automatiquement : {shopping_list.title}\n\n"
        message += f"Elle contient {shopping_list.total_items} article(s) :\n\n"
        
        # Lister les items par priorité
        urgent_items = shopping_list.items.filter(priority='urgent')
        high_items = shopping_list.items.filter(priority='high')
        normal_items = shopping_list.items.filter(priority='normal')
        
        if urgent_items.exists():
            message += "🔴 URGENT :\n"
            for item in urgent_items:
                message += f"  - {item.product.name} ({item.suggested_quantity} {item.product.get_unit_display()})\n"
            message += "\n"
        
        if high_items.exists():
            message += "⚠️  PRIORITAIRE :\n"
            for item in high_items[:5]:  # Limiter à 5
                message += f"  - {item.product.name} ({item.suggested_quantity} {item.product.get_unit_display()})\n"
            if high_items.count() > 5:
                message += f"  ... et {high_items.count() - 5} autres produits prioritaires\n"
            message += "\n"
        
        if normal_items.exists():
            message += f"ℹ️  {normal_items.count()} autre(s) produit(s) à acheter\n\n"
        
        message += "Connectez-vous à SANEO pour consulter et gérer votre liste.\n\n"
        message += "Bonnes courses !"
        
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
        
        return f"Email envoyé à {user.email}"
    
    except Exception as e:
        return f"Erreur lors de l'envoi de l'email: {str(e)}"

@shared_task
def cleanup_old_shopping_lists():
    """
    Archiver les anciennes listes terminées (> 90 jours)
    """
    from datetime import timedelta
    threshold_date = timezone.now() - timedelta(days=90)
    
    updated_count = ShoppingList.objects.filter(
        status='completed',
        completed_at__lt=threshold_date
    ).update(status='archived')
    
    return f"{updated_count} listes archivées"

from celery import shared_task
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from datetime import timedelta
from .models import StockBatch, ExpiryAlert
from apps.users.models import User

@shared_task
def check_expiring_products():
    """
    Tâche quotidienne pour vérifier les produits qui expirent
    et créer des alertes
    """
    today = timezone.now().date()
    
    # Pour chaque utilisateur
    for user in User.objects.filter(is_active=True):
        days_threshold = user.notification_expiry_days
        limit_date = today + timedelta(days=days_threshold)
        
        # Lots qui expirent bientôt
        expiring_batches = StockBatch.objects.filter(
            product__user=user,
            expiry_date__isnull=False,
            expiry_date__gt=today,
            expiry_date__lte=limit_date,
            quantity__gt=0
        ).exclude(
            alerts__alert_type='EXPIRING_SOON',
            alerts__alert_date__date=today
        )
        
        # Lots expirés
        expired_batches = StockBatch.objects.filter(
            product__user=user,
            expiry_date__isnull=False,
            expiry_date__lt=today,
            quantity__gt=0
        ).exclude(
            alerts__alert_type='EXPIRED',
            alerts__alert_date__date=today
        )
        
        # Créer les alertes
        alerts_created = []
        
        for batch in expiring_batches:
            alert = ExpiryAlert.objects.create(
                batch=batch,
                alert_type='EXPIRING_SOON'
            )
            alerts_created.append(alert)
        
        for batch in expired_batches:
            alert = ExpiryAlert.objects.create(
                batch=batch,
                alert_type='EXPIRED'
            )
            alerts_created.append(alert)
        
        # Envoyer email si l'utilisateur a activé les notifications
        if user.notification_email and alerts_created and user.email:
            send_expiry_notification_email.delay(user.id, [a.id for a in alerts_created])
    
    return f"Vérification terminée. {len(alerts_created)} alertes créées."

@shared_task
def send_expiry_notification_email(user_id, alert_ids):
    """
    Envoyer un email de notification pour les alertes de péremption
    """
    try:
        user = User.objects.get(id=user_id)
        alerts = ExpiryAlert.objects.filter(id__in=alert_ids)
        
        if not alerts:
            return "Aucune alerte à envoyer"
        
        # Compter les alertes par type
        expiring_count = alerts.filter(alert_type='EXPIRING_SOON').count()
        expired_count = alerts.filter(alert_type='EXPIRED').count()
        
        # Construire le message
        subject = f"SANEO - {expiring_count + expired_count} alerte(s) de péremption"
        
        message = f"Bonjour {user.first_name or user.username},\n\n"
        
        if expired_count > 0:
            message += f"🔴 {expired_count} produit(s) sont périmés :\n"
            for alert in alerts.filter(alert_type='EXPIRED'):
                message += f"  - {alert.batch.product.name} (périmé le {alert.batch.expiry_date})\n"
            message += "\n"
        
        if expiring_count > 0:
            message += f"⚠️  {expiring_count} produit(s) vont bientôt expirer :\n"
            for alert in alerts.filter(alert_type='EXPIRING_SOON'):
                days_left = alert.batch.days_until_expiry
                message += f"  - {alert.batch.product.name} (expire dans {days_left} jour(s))\n"
            message += "\n"
        
        message += "Connectez-vous à SANEO pour gérer vos stocks.\n\n"
        message += "Bonne journée !"
        
        # Envoyer l'email
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
        
        # Marquer les alertes comme envoyées
        alerts.update(email_sent=True)
        
        return f"Email envoyé à {user.email}"
    
    except Exception as e:
        return f"Erreur lors de l'envoi de l'email: {str(e)}"

@shared_task
def cleanup_old_alerts():
    """
    Supprimer les anciennes alertes lues (> 30 jours)
    """
    threshold_date = timezone.now() - timedelta(days=30)
    deleted_count = ExpiryAlert.objects.filter(
        is_read=True,
        alert_date__lt=threshold_date
    ).delete()[0]
    
    return f"{deleted_count} alertes supprimées"

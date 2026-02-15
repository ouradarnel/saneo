import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('saneo')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# Tâches planifiées
app.conf.beat_schedule = {
    'check-expiring-products-daily': {
        'task': 'apps.stocks.tasks.check_expiring_products',
        'schedule': crontab(hour=8, minute=0),  # Tous les jours à 8h
    },
    'generate-monthly-shopping-list': {
        'task': 'apps.shopping.tasks.generate_monthly_shopping_list',
        'schedule': crontab(day_of_month=1, hour=9, minute=0),  # 1er du mois à 9h
    },
}

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')

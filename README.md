# 🏠 SANEO - Gestion de Stock Domestique

Application web de gestion de stocks domestiques avec génération automatique de listes de courses.

## 📋 Table des matières

- [Fonctionnalités](#fonctionnalités)
- [Architecture](#architecture)
- [Installation](#installation)
- [Utilisation](#utilisation)
- [API Documentation](#api-documentation)
- [Développement](#développement)
- [Déploiement](#déploiement)

## ✨ Fonctionnalités

### MVP (Version 1.0)

#### 🏷️ Gestion des Produits
- CRUD complet des produits
- Catégorisation (nourriture, boisson, épices, ménage, hygiène)
- Unité standardisée en pièce
- Gestion des emplacements (frigo, congélateur, placard, cave)
- Seuils minimaux configurables
- Code-barres (optionnel)

#### 📦 Gestion des Stocks
- Stock par lots avec dates de péremption
- Historique complet des mouvements (IN/OUT/ADJUST)
- Alertes de péremption (7 jours avant expiration)
- Vue "À consommer en priorité"
- Statistiques de consommation

#### 🛒 Liste de Courses
- Génération automatique mensuelle (1er du mois)
- Génération manuelle à tout moment
- Organisation par catégories
- Priorisation des articles (urgent/normal)
- Suivi achat réel vs suggéré

#### 📊 Tableau de Bord
- Vue d'ensemble du stock
- Produits à racheter
- Prochaines péremptions
- Top produits consommés
- Statistiques globales

#### 🔔 Notifications
- Emails pour péremptions
- Emails pour listes générées
- Tâches automatisées (Celery)

## 🏗️ Architecture

### Backend
- **Framework**: Django 4.2 + Django REST Framework
- **Base de données**: PostgreSQL 15
- **Cache/Queue**: Redis
- **Task Queue**: Celery + Celery Beat
- **Auth**: JWT (SimpleJWT)
- **API Doc**: Swagger (drf-spectacular)

### Frontend
- **Framework**: Angular 17 (Standalone)
- **Styling**: TailwindCSS
- **HTTP Client**: Built-in HttpClient
- **State**: Services + RxJS

### Infrastructure
- **Containers**: Docker + Docker Compose
- **Reverse Proxy**: Nginx
- **Hot Reload**: Activé en développement

## 🚀 Installation

### Prérequis
- Docker & Docker Compose
- Git

### Étapes

1. **Cloner le projet**
```bash
git clone <repository-url>
cd saneo
```

2. **Configuration de l'environnement**
```bash
cp .env.example .env
# Éditez .env avec vos valeurs
```

3. **Variables importantes dans .env**
```env
# Base de données
POSTGRES_DB=saneo
POSTGRES_USER=saneo_user
POSTGRES_PASSWORD=changeme_production

# Django
SECRET_KEY=generate-a-strong-secret-key
DEBUG=True

# Email (Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

4. **Lancer les conteneurs**
```bash
docker-compose up -d
```

5. **Initialiser la base de données**
```bash
# Migrations
docker-compose exec backend python manage.py migrate

# Créer un superuser
docker-compose exec backend python manage.py createsuperuser

# Charger les catégories par défaut (optionnel)
docker-compose exec backend python manage.py loaddata initial_categories
```

6. **Accéder à l'application**
- Frontend: http://localhost
- API: http://localhost/api/v1/
- Admin Django: http://localhost/admin/
- Documentation API: http://localhost/api/docs/

## 📚 Utilisation

### Premiers pas

1. **Créer des emplacements**
   - Allez dans Paramètres > Emplacements
   - Ajoutez vos emplacements (frigo, placard, etc.)

2. **Ajouter des produits**
   - Catalogue > Nouveau produit
   - Remplissez nom, catégorie, emplacement, seuil

3. **Ajouter du stock**
   - Stock > Nouveau lot
   - Sélectionnez le produit, quantité, date de péremption

4. **Générer une liste de courses**
   - Listes > Générer automatiquement
   - Ou attendez le 1er du mois pour génération auto

### Workflow quotidien

1. **Consommer un produit**
   - Produits > Saisir la quantité sur la ligne du produit
   - Cliquer sur "OK" (consommation rapide automatique)

2. **Vérifier les alertes**
   - Tableau de bord affiche péremptions proches
   - Emails automatiques chaque matin (8h)

3. **Faire les courses**
   - Ouvrir la liste active
   - Cocher les articles achetés
   - Optionnel: saisir prix réels
   - Marquer comme "Terminée"

## 🔧 API Documentation

### Authentification

Toutes les routes API nécessitent un token JWT sauf `/auth/login/` et `/auth/register/`.

**Obtenir un token:**
```bash
POST /api/v1/auth/login/
{
  "username": "user",
  "password": "pass"
}

Response:
{
  "access": "eyJ0eXAiOiJKV1QiLC...",
  "refresh": "eyJ0eXAiOiJKV1QiLC..."
}
```

**Utiliser le token:**
```
Authorization: Bearer <access_token>
```

### Endpoints principaux

#### Produits
```
GET    /api/v1/products/              # Liste
POST   /api/v1/products/              # Créer
GET    /api/v1/products/{id}/         # Détail
PUT    /api/v1/products/{id}/         # Modifier
DELETE /api/v1/products/{id}/         # Supprimer
POST   /api/v1/products/{id}/consume_stock/ # Consommer rapidement le stock du produit
GET    /api/v1/products/to_restock/   # À racheter
GET    /api/v1/products/categories/   # Catégories
GET    /api/v1/products/locations/    # Emplacements
```

#### Stocks
```
GET    /api/v1/stocks/batches/                # Lots
POST   /api/v1/stocks/batches/                # Nouveau lot
GET    /api/v1/stocks/batches/expiring_soon/  # Expire bientôt
GET    /api/v1/stocks/batches/expired/        # Périmés
POST   /api/v1/stocks/batches/{id}/consume/   # Consommer
GET    /api/v1/stocks/movements/              # Mouvements
GET    /api/v1/stocks/alerts/                 # Alertes
GET    /api/v1/stocks/dashboard/summary/      # Résumé
GET    /api/v1/stocks/dashboard/consumption_stats/  # Stats
```

#### Listes de courses
```
GET    /api/v1/shopping/lists/                   # Listes
POST   /api/v1/shopping/lists/                   # Nouvelle liste
POST   /api/v1/shopping/lists/generate_auto/     # Générer auto
GET    /api/v1/shopping/lists/{id}/              # Détail
POST   /api/v1/shopping/lists/{id}/complete/     # Terminer
GET    /api/v1/shopping/lists/{id}/by_category/  # Par catégorie
GET    /api/v1/shopping/items/                   # Items
POST   /api/v1/shopping/items/                   # Nouvel item
POST   /api/v1/shopping/items/{id}/toggle_check/ # Cocher
```

Documentation complète: http://localhost/api/docs/

## 👨‍💻 Développement

### Structure du projet

```
saneo/
├── backend/
│   ├── config/           # Configuration Django
│   ├── apps/
│   │   ├── users/        # Authentification
│   │   ├── products/     # Catalogue produits
│   │   ├── stocks/       # Gestion stocks
│   │   └── shopping/     # Listes de courses
│   └── scripts/          # Scripts utiles
├── frontend/
│   └── src/
│       └── app/
│           ├── core/     # Services, guards, interceptors
│           ├── features/ # Modules fonctionnels
│           └── shared/   # Composants partagés
└── nginx/                # Reverse proxy
```

### Commandes utiles

**Backend:**
```bash
# Shell Django
docker-compose exec backend python manage.py shell

# Créer une migration
docker-compose exec backend python manage.py makemigrations

# Appliquer les migrations
docker-compose exec backend python manage.py migrate

# Tests
docker-compose exec backend python manage.py test

# Collecter les fichiers statiques
docker-compose exec backend python manage.py collectstatic

# Créer des données de test
docker-compose exec backend python manage.py create_test_data
```

**Frontend:**
```bash
# Shell dans le container
docker-compose exec frontend sh

# Installer un package
docker-compose exec frontend npm install <package>

# Générer un composant
docker-compose exec frontend ng generate component features/products/product-list

# Build production
docker-compose exec frontend npm run build
```

**Celery:**
```bash
# Voir les workers
docker-compose exec celery celery -A config inspect active

# Voir les tâches planifiées
docker-compose exec celery celery -A config inspect scheduled

# Lancer une tâche manuellement
docker-compose exec backend python manage.py shell
>>> from apps.stocks.tasks import check_expiring_products
>>> check_expiring_products.delay()
```

**Database:**
```bash
# Backup
docker-compose exec db pg_dump -U saneo_user saneo > backup.sql

# Restore
cat backup.sql | docker-compose exec -T db psql -U saneo_user saneo

# psql shell
docker-compose exec db psql -U saneo_user saneo
```

### Logs
```bash
# Tous les services
docker-compose logs -f

# Backend uniquement
docker-compose logs -f backend

# Celery
docker-compose logs -f celery celery-beat
```

## 🚢 Déploiement en Production

### Préparation

1. **Variables d'environnement**
```env
DEBUG=False
SECRET_KEY=<générer-avec-python-secrets>
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com

# Base de données sécurisée
POSTGRES_PASSWORD=<strong-password>

# Email production
EMAIL_HOST=smtp.sendgrid.net
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=<sendgrid-api-key>
```

2. **Build frontend production**
```bash
docker-compose exec frontend npm run build
```

3. **SSL/TLS**
Ajoutez un certificat (Let's Encrypt recommandé) dans nginx.

### Docker Compose Production

Créer `docker-compose.prod.yml`:
```yaml
version: '3.8'

services:
  backend:
    command: gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 4
    environment:
      DEBUG: False
  
  celery:
    command: celery -A config worker -l info --concurrency=4
  
  # ...autres services
```

Lancer:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 📱 Roadmap iOS

Le backend est **déjà prêt** pour une app iOS. Il suffit de :

1. Créer un projet SwiftUI
2. Utiliser l'API REST existante
3. Implémenter:
   - Scan code-barres (AVFoundation)
   - Notifications push (APNs)
   - Core Data pour cache offline
   - Widgets "Prochaines péremptions"

Endpoints à utiliser: tous ceux décrits dans la section API.

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'Add AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT.

## 👤 Auteur

Développé avec ❤️ pour une meilleure gestion du stock domestique.

## 🆘 Support

- Documentation API: http://localhost/api/docs/
- Issues: GitHub Issues
- Email: support@saneo.local

---

**Bon usage de SANEO ! 🎉**

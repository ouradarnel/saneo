# 🚀 SANEO - Démarrage Rapide

## ✅ Qu'est-ce qui a été généré ?

Un projet **complet et fonctionnel** comprenant:

### Backend (Django + DRF)
- ✅ API REST complète avec JWT
- ✅ 4 applications Django (users, products, stocks, shopping)
- ✅ Modèles de données complets
- ✅ ViewSets et Serializers
- ✅ Celery + Celery Beat pour tâches automatisées
- ✅ Admin Django configuré
- ✅ Email notifications
- ✅ Documentation Swagger (drf-spectacular)

### Frontend (Angular 17)
- ✅ Structure standalone components
- ✅ TailwindCSS configuré
- ✅ Authentification (login/register)
- ✅ Dashboard, produits, stocks, listes de courses
- ✅ Notifications in-app (toasts)

### Infrastructure
- ✅ Docker Compose multi-services
- ✅ PostgreSQL 15
- ✅ Redis pour Celery
- ✅ Nginx reverse proxy
- ✅ Hot-reload en développement

### Documentation
- ✅ README.md complet
- ✅ API_GUIDE.md avec tous les endpoints
- ✅ FRONTEND_DEV_GUIDE.md pour continuer Angular
- ✅ Scripts de démarrage et utilitaires

## 🏃 Lancer le Projet en 3 Minutes

### Option 1: Script Automatique (Recommandé)

```bash
cd saneo
chmod +x start.sh
./start.sh
```

Le script va:
1. Vérifier Docker
2. Créer le fichier .env
3. Démarrer les conteneurs
4. Exécuter les migrations
5. Proposer de créer un admin et des données de test

### Option 2: Manuel

```bash
cd saneo

# 1. Environnement
cp .env.example .env

# 2. Démarrer
docker-compose up -d

# 3. Migrations
docker-compose exec backend python manage.py migrate

# 4. Catégories par défaut
docker-compose exec backend python manage.py load_initial_categories

# 5. Créer un admin
docker-compose exec backend python manage.py createsuperuser

# 6. (Optionnel) Données de test
docker-compose exec backend python manage.py create_test_data
```

## 🌐 Accès aux Services

Une fois démarré:

| Service | URL | Identifiants |
|---------|-----|--------------|
| **Frontend** | http://localhost | - |
| **API** | http://localhost/api/v1/ | Token JWT |
| **API Docs** | http://localhost/api/docs/ | - |
| **Admin** | http://localhost/admin/ | Votre superuser |

### Compte de Test (si créé)
- Username: `demo`
- Password: `demo123`

## 📊 Fonctionnalités Disponibles

### ✅ Complètement Fonctionnel (Backend)
- [x] Authentification JWT
- [x] CRUD Produits avec catégories
- [x] Gestion emplacements
- [x] Stock par lots avec péremption
- [x] Historique mouvements
- [x] Alertes péremption automatiques
- [x] Génération liste de courses (auto + manuelle)
- [x] Statistiques de consommation
- [x] Emails notifications (péremption + listes)
- [x] Tâches planifiées (1er du mois + vérif quotidienne)

### ✅ Frontend Fonctionnel
- [x] Authentification (Login/Register)
- [x] Dashboard avec stats
- [x] CRUD Produits (interface)
- [x] Gestion stocks (interface)
- [x] Listes de courses (interface)
- [x] Notifications in-app

👉 Backend et frontend sont opérationnels. Le `FRONTEND_DEV_GUIDE.md` reste utile pour extensions futures.

## 📖 Documentation

### Pour Développer le Frontend
```bash
cat FRONTEND_DEV_GUIDE.md
```
- Tous les modèles TypeScript
- Services à créer
- Composants suggérés
- Routes complètes
- Exemples de code

### Pour Utiliser l'API
```bash
cat API_GUIDE.md
```
- Tous les endpoints documentés
- Exemples de requêtes
- Codes d'erreur
- Exemples cURL

### Pour Configurer le Projet
```bash
cat README.md
```
- Installation complète
- Architecture détaillée
- Déploiement production
- Roadmap iOS

## 🛠️ Commandes Utiles

### Développement

```bash
# Logs en temps réel
docker-compose logs -f

# Backend uniquement
docker-compose logs -f backend

# Redémarrer un service
docker-compose restart backend

# Shell Django
docker-compose exec backend python manage.py shell

# Tests backend
docker-compose exec backend python manage.py test

# Frontend dev
docker-compose exec frontend sh
```

### Base de Données

```bash
# Backup
docker-compose exec db pg_dump -U saneo_user saneo > backup.sql

# Restore
cat backup.sql | docker-compose exec -T db psql -U saneo_user saneo

# Nouvelle migration
docker-compose exec backend python manage.py makemigrations
docker-compose exec backend python manage.py migrate
```

### Celery (Tâches)

```bash
# Lancer manuellement la vérif péremption
docker-compose exec backend python -c "
from apps.stocks.tasks import check_expiring_products
check_expiring_products.delay()
"

# Lancer manuellement la génération liste
docker-compose exec backend python -c "
from apps.shopping.tasks import generate_monthly_shopping_list
generate_monthly_shopping_list.delay()
"

# Voir les tâches en cours
docker-compose exec celery celery -A config inspect active
```

## 🎯 Prochaines Étapes Recommandées

### Immédiat (Pour tester)
1. Lancer le projet: `./start.sh`
2. Créer des données de test
3. Tester l'API sur http://localhost/api/docs/
4. Se connecter à l'admin Django

### Court Terme (Qualité)
1. Ajouter des tests frontend (Karma/Jasmine)
2. Étendre les tests backend API
3. Ajouter refresh token automatique côté frontend
4. Mettre à jour la documentation API au fil des endpoints
5. Renforcer les validations UX sur les formulaires

### Moyen Terme
1. Tests frontend (Karma/Jasmine)
2. Tests backend (Django TestCase)
3. Optimisations performance
4. PWA (Service Workers)
5. Internationalisation (i18n)

### Long Terme
1. Application iOS (SwiftUI)
2. Scan code-barres
3. Suggestions ML (prédiction consommation)
4. Export/Import données
5. Multi-utilisateurs (partage familial)

## ⚠️ Points Importants

### Email Configuration
Par défaut en mode console (dev). Pour envoyer de vrais emails:

```env
# Dans .env
EMAIL_HOST=smtp.gmail.com
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
EMAIL_USE_TLS=True
```

### Production
Avant de déployer:
- [ ] Changer `SECRET_KEY`
- [ ] `DEBUG=False`
- [ ] Configurer `ALLOWED_HOSTS`
- [ ] SSL/TLS (Let's Encrypt)
- [ ] Variables sensibles en secrets
- [ ] Build frontend: `ng build --configuration production`

### Sécurité
- ✅ JWT avec refresh tokens
- ✅ CORS configuré
- ✅ Permissions par utilisateur
- ✅ Validation des données
- ⚠️ Rate limiting (à ajouter en production)

## 🆘 Problèmes Courants

### Les conteneurs ne démarrent pas
```bash
docker-compose down
docker-compose up -d --build
```

### Migration errors
```bash
docker-compose exec backend python manage.py migrate --run-syncdb
```

### Frontend ne charge pas
```bash
docker-compose exec frontend npm install
docker-compose restart frontend
```

### Permission denied
```bash
chmod +x start.sh
```

## 📞 Support

- Documentation: `README.md`, `API_GUIDE.md`, `FRONTEND_DEV_GUIDE.md`
- API Docs: http://localhost/api/docs/
- Django Admin: http://localhost/admin/

## 🎉 Félicitations !

Vous avez maintenant une application complète de gestion de stock domestique avec:
- ✅ Backend production-ready
- ✅ API REST documentée
- ✅ Base de données structurée
- ✅ Tâches automatisées
- ✅ Infrastructure Docker
- ✅ Frontend fonctionnel

**Le plus dur est fait !** Les prochaines étapes concernent surtout la qualité, les tests et la stabilisation.

---

**Bon développement avec SANEO ! 🏠📦**

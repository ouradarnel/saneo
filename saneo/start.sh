#!/bin/bash

echo "🚀 Démarrage de SANEO..."
echo ""

# Vérifier que Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Installez Docker Desktop puis relancez ce script."
    exit 1
fi

# Vérifier que docker-compose est installé
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose n'est pas installé. Installez-le puis relancez ce script."
    exit 1
fi

# Créer le fichier .env s'il n'existe pas
if [ ! -f .env ]; then
    echo "📝 Création du fichier .env..."
    cp .env.example .env
    echo "✅ Fichier .env créé. Vous pouvez le personnaliser si nécessaire."
fi

# Démarrer les conteneurs
echo ""
echo "🐳 Démarrage des conteneurs Docker..."
docker-compose up -d

# Attendre que la base de données soit prête
echo ""
echo "⏳ Attente de la disponibilité de la base de données..."
sleep 10

# Exécuter les migrations
echo ""
echo "📦 Exécution des migrations..."
docker-compose exec -T backend python manage.py migrate

# Charger les catégories par défaut
echo ""
echo "📂 Chargement des catégories par défaut..."
docker-compose exec -T backend python manage.py load_initial_categories

# Proposer de créer un superuser
echo ""
read -p "❓ Voulez-vous créer un compte administrateur ? (o/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Oo]$ ]]; then
    docker-compose exec backend python manage.py createsuperuser
fi

# Proposer de créer des données de test
echo ""
read -p "❓ Voulez-vous créer des données de test (compte demo/demo123) ? (o/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Oo]$ ]]; then
    docker-compose exec -T backend python manage.py create_test_data
fi

# Collecter les fichiers statiques
echo ""
echo "📁 Collecte des fichiers statiques..."
docker-compose exec -T backend python manage.py collectstatic --noinput

echo ""
echo "✅ SANEO est prêt !"
echo ""
echo "🌐 Accès aux services :"
echo "   - Application:       http://localhost"
echo "   - API:               http://localhost/api/v1/"
echo "   - Documentation API: http://localhost/api/docs/"
echo "   - Admin Django:      http://localhost/admin/"
echo ""
echo "📊 Commandes utiles :"
echo "   - Voir les logs:     docker-compose logs -f"
echo "   - Arrêter:           docker-compose down"
echo "   - Redémarrer:        docker-compose restart"
echo ""
echo "Bon usage de SANEO ! 🎉"

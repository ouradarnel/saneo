# 📡 SANEO API - Guide Complet

## Base URL
```
http://localhost/api/v1/
```

## Authentification

### Obtenir un token JWT
```http
POST /api/v1/auth/login/
Content-Type: application/json

{
  "username": "demo",
  "password": "demo123"
}
```

**Réponse:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### Utiliser le token
Ajouter dans les headers de chaque requête:
```
Authorization: Bearer <access_token>
```

### Rafraîchir le token
```http
POST /api/v1/auth/refresh/
Content-Type: application/json

{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

## Endpoints

### 1. Produits

#### Lister tous les produits
```http
GET /api/v1/products/
```

**Filtres disponibles:**
- `?category=1` - Filtrer par catégorie
- `?default_location=2` - Filtrer par emplacement
- `?search=lait` - Rechercher par nom/marque

**Réponse:**
```json
{
  "count": 10,
  "results": [
    {
      "id": 1,
      "name": "Lait demi-écrémé",
      "category": 2,
      "category_name": "Boisson",
      "unit": "piece",
      "unit_display": "Pièce",
      "threshold": "2.00",
      "total_stock": "3.00",
      "is_below_threshold": false,
      "needs_restock": false,
      "brand": "Lactel"
    }
  ]
}
```

#### Créer un produit
```http
POST /api/v1/products/
Content-Type: application/json

{
  "name": "Œufs bio",
  "category": 1,
  "default_location": 1,
  "threshold": 6,
  "brand": "Bio",
  "auto_add_to_list": true
}
```

Note: l'unité est standardisée côté API à `piece`.

#### Produits à racheter
```http
GET /api/v1/products/to_restock/
```

#### Produits par catégorie
```http
GET /api/v1/products/by_category/
```

#### Consommation rapide d'un produit (sans choisir le lot)
```http
POST /api/v1/products/{id}/consume_stock/
Content-Type: application/json

{
  "quantity": 1,
  "note": "Repas du midi"
}
```

La quantité est automatiquement répartie sur les lots disponibles (priorité aux lots qui expirent d'abord).

### 2. Stocks

#### Lister les lots
```http
GET /api/v1/stocks/batches/
```

**Filtres:**
- `?product=1` - Par produit
- `?location=2` - Par emplacement

**Réponse:**
```json
{
  "results": [
    {
      "id": 1,
      "product": 1,
      "product_name": "Lait demi-écrémé",
      "product_unit": "Pièce",
      "quantity": "1.00",
      "location": 1,
      "location_name": "Réfrigérateur",
      "expiry_date": "2026-03-15",
      "purchase_date": "2026-02-01",
      "is_expired": false,
      "days_until_expiry": 36
    }
  ]
}
```

#### Créer un lot
```http
POST /api/v1/stocks/batches/
Content-Type: application/json

{
  "product": 1,
  "quantity": 2,
  "location": 1,
  "expiry_date": "2026-03-15",
  "purchase_date": "2026-02-07",
  "purchase_price": 3.50,
  "supplier": "Carrefour"
}
```

#### Lots qui expirent bientôt
```http
GET /api/v1/stocks/batches/expiring_soon/?days=7
```

#### Lots expirés
```http
GET /api/v1/stocks/batches/expired/
```

#### À consommer en priorité
```http
GET /api/v1/stocks/batches/to_consume_first/
```

#### Consommer un lot
```http
POST /api/v1/stocks/batches/{id}/consume/
Content-Type: application/json

{
  "quantity": 0.5,
  "note": "Préparation petit-déjeuner"
}
```

#### Mouvements de stock
```http
GET /api/v1/stocks/movements/
```

**Filtres:**
- `?product=1`
- `?type=OUT` (IN, OUT, ADJUST)
- `?ordering=-date`

#### Créer un mouvement
```http
POST /api/v1/stocks/movements/
Content-Type: application/json

{
  "product": 1,
  "batch": 1,
  "type": "OUT",
  "quantity": 1,
  "note": "Consommation"
}
```

#### Alertes de péremption
```http
GET /api/v1/stocks/alerts/
```

**Filtres:**
- `?alert_type=EXPIRING_SOON`
- `?is_read=false`

#### Alertes non lues
```http
GET /api/v1/stocks/alerts/unread/
```

#### Marquer une alerte comme lue
```http
POST /api/v1/stocks/alerts/{id}/mark_read/
```

#### Résumé du stock
```http
GET /api/v1/stocks/dashboard/summary/
```

**Réponse:**
```json
{
  "total_products": 25,
  "total_batches": 42,
  "products_below_threshold": 5,
  "products_out_of_stock": 2,
  "batches_expiring_soon": 3,
  "batches_expired": 1,
  "total_value": "234.50"
}
```

#### Statistiques de consommation
```http
GET /api/v1/stocks/dashboard/consumption_stats/?days=30
```

**Réponse:**
```json
[
  {
    "product__name": "Lait demi-écrémé",
    "product__id": 1,
    "total_consumed": "12.00",
    "count": 6
  }
]
```

### 3. Listes de Courses

#### Lister les listes
```http
GET /api/v1/shopping/lists/
```

**Filtres:**
- `?status=active`
- `?is_auto_generated=true`

**Réponse:**
```json
{
  "results": [
    {
      "id": 1,
      "title": "Liste automatique - 07/02/2026",
      "status": "active",
      "status_display": "Active",
      "is_auto_generated": true,
      "total_items": 8,
      "checked_items": 3,
      "completion_percentage": 37,
      "estimated_total_cost": "45.80",
      "created_at": "2026-02-07T09:00:00Z"
    }
  ]
}
```

#### Créer une liste
```http
POST /api/v1/shopping/lists/
Content-Type: application/json

{
  "title": "Courses du week-end",
  "notes": "Ne pas oublier les fruits"
}
```

#### Générer une liste automatiquement
```http
POST /api/v1/shopping/lists/generate_auto/
```

**Réponse:**
```json
{
  "message": "Liste générée avec 8 articles",
  "list": {
    "id": 5,
    "title": "Liste automatique - 07/02/2026",
    "items": [...]
  }
}
```

#### Détail d'une liste
```http
GET /api/v1/shopping/lists/{id}/
```

**Réponse:**
```json
{
  "id": 1,
  "title": "Liste automatique",
  "status": "active",
  "total_items": 8,
  "items": [
    {
      "id": 1,
      "product": 1,
      "product_name": "Lait",
      "product_unit": "Pièce",
      "category_name": "Boisson",
      "suggested_quantity": "2.00",
      "priority": "high",
      "priority_display": "Haute",
      "reason": "below_threshold",
      "is_checked": false
    }
  ]
}
```

#### Items par catégorie
```http
GET /api/v1/shopping/lists/{id}/by_category/
```

#### Activer une liste
```http
POST /api/v1/shopping/lists/{id}/activate/
```

#### Terminer une liste
```http
POST /api/v1/shopping/lists/{id}/complete/
Content-Type: application/json

{
  "auto_update_stock": true
}
```

**Si `auto_update_stock: true`**: Crée automatiquement des lots de stock pour les items cochés.

#### Ajouter un item à une liste
```http
POST /api/v1/shopping/items/
Content-Type: application/json

{
  "shopping_list": 1,
  "product": 5,
  "suggested_quantity": 1,
  "priority": "normal",
  "reason": "manual",
  "notes": "Promo en cours"
}
```

#### Cocher/décocher un item
```http
POST /api/v1/shopping/items/{id}/toggle_check/
```

#### Définir quantité/prix réels
```http
POST /api/v1/shopping/items/{id}/set_actual/
Content-Type: application/json

{
  "actual_quantity": 2,
  "actual_cost": 5.80
}
```

### 4. Catégories

#### Lister les catégories
```http
GET /api/v1/products/categories/
```

**Réponse:**
```json
[
  {
    "id": 1,
    "name": "nourriture",
    "name_display": "Nourriture",
    "icon": "🍞",
    "color": "#F59E0B",
    "product_count": 15
  }
]
```

### 5. Emplacements

#### Lister les emplacements
```http
GET /api/v1/products/locations/
```

#### Créer un emplacement
```http
POST /api/v1/products/locations/
Content-Type: application/json

{
  "name": "frigo",
  "description": "Réfrigérateur principal"
}
```

## Codes d'Erreur

| Code | Signification |
|------|---------------|
| 200  | Succès |
| 201  | Créé |
| 400  | Requête invalide |
| 401  | Non authentifié |
| 403  | Non autorisé |
| 404  | Non trouvé |
| 500  | Erreur serveur |

## Pagination

Les endpoints de liste supportent la pagination:
```
GET /api/v1/products/?page=2&page_size=20
```

**Réponse:**
```json
{
  "count": 50,
  "next": "http://localhost/api/v1/products/?page=3",
  "previous": "http://localhost/api/v1/products/?page=1",
  "results": [...]
}
```

## Exemples cURL

### Login
```bash
curl -X POST http://localhost/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"demo123"}'
```

### Lister les produits
```bash
curl -X GET http://localhost/api/v1/products/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Créer un produit
```bash
curl -X POST http://localhost/api/v1/products/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pâtes",
    "category": 1,
    "threshold": 1
  }'
```

### Générer liste de courses
```bash
curl -X POST http://localhost/api/v1/shopping/lists/generate_auto/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Documentation Interactive

Accédez à la documentation Swagger complète:
```
http://localhost/api/docs/
```

Vous pouvez y tester tous les endpoints directement depuis le navigateur.

---

**Besoin d'aide ?** Consultez le README.md ou ouvrez une issue sur GitHub.

# 🎨 Guide de Développement Frontend - SANEO

## Structure Complète à Implémenter

### 1. Core (Services principaux)

#### `src/app/core/services/api.service.ts`
```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  get<T>(endpoint: string) {
    return this.http.get<T>(`${this.baseUrl}${endpoint}`);
  }

  post<T>(endpoint: string, data: any) {
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, data);
  }

  put<T>(endpoint: string, data: any) {
    return this.http.put<T>(`${this.baseUrl}${endpoint}`, data);
  }

  delete<T>(endpoint: string) {
    return this.http.delete<T>(`${this.baseUrl}${endpoint}`);
  }
}
```

#### `src/app/core/services/auth.service.ts`
```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';

interface LoginResponse {
  access: string;
  refresh: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenSubject = new BehaviorSubject<string | null>(
    localStorage.getItem('access_token')
  );
  
  token$ = this.tokenSubject.asObservable();

  constructor(private http: HttpClient) {}

  login(username: string, password: string) {
    return this.http.post<LoginResponse>('/api/v1/auth/login/', {
      username,
      password
    }).pipe(
      tap(response => {
        localStorage.setItem('access_token', response.access);
        localStorage.setItem('refresh_token', response.refresh);
        this.tokenSubject.next(response.access);
      })
    );
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.tokenSubject.next(null);
  }

  isAuthenticated(): boolean {
    return !!this.tokenSubject.value;
  }
}
```

#### `src/app/core/interceptors/auth.interceptor.ts`
```typescript
import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('access_token');
  
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  
  return next(req);
};
```

### 2. Features (Modules fonctionnels)

#### Products
- `product-list.component.ts` - Liste des produits
- `product-form.component.ts` - Formulaire création/édition
- `product-detail.component.ts` - Détails d'un produit
- `product.service.ts` - Service API produits

#### Stocks
- `stock-list.component.ts` - Liste des lots
- `stock-form.component.ts` - Ajout de stock
- `expiry-alerts.component.ts` - Alertes péremption
- `stock-movements.component.ts` - Historique mouvements
- `stock.service.ts` - Service API stocks

#### Shopping
- `shopping-lists.component.ts` - Listes de courses
- `shopping-list-detail.component.ts` - Détail d'une liste
- `shopping-item.component.ts` - Item de liste
- `shopping.service.ts` - Service API shopping

#### Dashboard
- `dashboard.component.ts` - Tableau de bord principal
- `stats-card.component.ts` - Cartes de statistiques
- `consumption-chart.component.ts` - Graphiques

### 3. Shared (Composants réutilisables)

#### Components
- `button.component.ts` - Bouton personnalisé
- `card.component.ts` - Carte générique
- `modal.component.ts` - Modale
- `loader.component.ts` - Loader
- `toast.component.ts` - Notifications toast

#### Pipes
- `date-format.pipe.ts` - Format de date FR
- `unit-display.pipe.ts` - Affichage unités
- `category-icon.pipe.ts` - Icônes catégories

### 4. Models

#### `src/app/core/models/product.model.ts`
```typescript
export interface Product {
  id: number;
  name: string;
  category: number;
  category_name: string;
  unit: string;
  unit_display: string;
  default_location?: number;
  location_name?: string;
  threshold: number;
  barcode?: string;
  brand?: string;
  notes?: string;
  auto_add_to_list: boolean;
  total_stock: number;
  is_below_threshold: boolean;
  needs_restock: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  name_display: string;
  icon: string;
  color: string;
  product_count: number;
}

export interface Location {
  id: number;
  name: string;
  name_display: string;
  description: string;
}
```

#### `src/app/core/models/stock.model.ts`
```typescript
export interface StockBatch {
  id: number;
  product: number;
  product_name: string;
  product_unit: string;
  quantity: number;
  location?: number;
  location_name?: string;
  expiry_date?: string;
  purchase_date: string;
  purchase_price?: number;
  supplier?: string;
  notes?: string;
  is_expired: boolean;
  days_until_expiry?: number;
}

export interface StockMovement {
  id: number;
  product: number;
  product_name: string;
  batch?: number;
  type: 'IN' | 'OUT' | 'ADJUST';
  type_display: string;
  quantity: number;
  date: string;
  note: string;
  user_name: string;
}
```

#### `src/app/core/models/shopping.model.ts`
```typescript
export interface ShoppingList {
  id: number;
  title: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  status_display: string;
  is_auto_generated: boolean;
  notes: string;
  total_items: number;
  checked_items: number;
  completion_percentage: number;
  estimated_total_cost: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface ShoppingListItem {
  id: number;
  product: number;
  product_name: string;
  product_unit: string;
  category_name: string;
  suggested_quantity: number;
  actual_quantity?: number;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  priority_display: string;
  reason: string;
  reason_display: string;
  estimated_cost?: number;
  actual_cost?: number;
  is_checked: boolean;
  notes: string;
}
```

### 5. Environments

#### `src/environments/environment.ts`
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost/api/v1'
};
```

#### `src/environments/environment.prod.ts`
```typescript
export const environment = {
  production: true,
  apiUrl: '/api/v1'
};
```

## Routes à Implémenter

```typescript
export const routes: Routes = [
  { path: '', component: HomeComponent },
  { 
    path: 'auth',
    children: [
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent }
    ]
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard]
  },
  {
    path: 'products',
    canActivate: [authGuard],
    children: [
      { path: '', component: ProductListComponent },
      { path: 'new', component: ProductFormComponent },
      { path: ':id', component: ProductDetailComponent },
      { path: ':id/edit', component: ProductFormComponent }
    ]
  },
  {
    path: 'stocks',
    canActivate: [authGuard],
    children: [
      { path: '', component: StockListComponent },
      { path: 'alerts', component: ExpiryAlertsComponent },
      { path: 'movements', component: StockMovementsComponent }
    ]
  },
  {
    path: 'shopping',
    canActivate: [authGuard],
    children: [
      { path: '', component: ShoppingListsComponent },
      { path: ':id', component: ShoppingListDetailComponent }
    ]
  }
];
```

## Composants TailwindCSS Prêts à l'Emploi

### Bouton
```html
<button class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 
               focus:outline-none focus:ring-2 focus:ring-primary-500 
               disabled:opacity-50 disabled:cursor-not-allowed transition">
  Cliquez-moi
</button>
```

### Carte
```html
<div class="bg-white rounded-lg shadow-sm hover:shadow-md transition p-6">
  <h3 class="text-lg font-bold mb-2">Titre</h3>
  <p class="text-gray-600">Contenu</p>
</div>
```

### Badge (Priorité)
```html
<span class="px-2 py-1 text-xs font-medium rounded-full"
      [ngClass]="{
        'bg-red-100 text-red-800': priority === 'urgent',
        'bg-orange-100 text-orange-800': priority === 'high',
        'bg-blue-100 text-blue-800': priority === 'normal',
        'bg-gray-100 text-gray-800': priority === 'low'
      }">
  {{ priority }}
</span>
```

### Formulaire
```html
<div class="space-y-4">
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-1">
      Nom du produit
    </label>
    <input type="text" 
           class="w-full px-3 py-2 border border-gray-300 rounded-lg 
                  focus:outline-none focus:ring-2 focus:ring-primary-500"
           placeholder="Ex: Lait">
  </div>
</div>
```

## Prochaines Étapes

1. **Implémenter l'authentification** (Login/Register)
2. **Créer le Dashboard** avec statistiques
3. **Module Produits** (CRUD complet)
4. **Module Stocks** avec alertes
5. **Module Shopping** avec génération auto
6. **Tests** (Karma + Jasmine)
7. **Build production** et optimisations

## Commandes Utiles

```bash
# Générer un composant
ng generate component features/products/product-list

# Générer un service
ng generate service core/services/product

# Générer un guard
ng generate guard core/guards/auth

# Build production
ng build --configuration production

# Tests
ng test

# Linter
ng lint
```

Bon développement ! 🚀

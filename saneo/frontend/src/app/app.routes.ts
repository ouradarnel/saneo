import { Routes } from '@angular/router';
import { authGuard, guestOnlyGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'about',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'auth/login',
    canActivate: [guestOnlyGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'auth/register',
    canActivate: [guestOnlyGuard],
    loadComponent: () =>
      import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'products',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/products/product-list/product-list.component').then(
            (m) => m.ProductListComponent
          ),
      },
      {
        path: 'new',
        loadComponent: () =>
          import('./features/products/product-form/product-form.component').then(
            (m) => m.ProductFormComponent
          ),
      },
      {
        path: ':id/edit',
        loadComponent: () =>
          import('./features/products/product-form/product-form.component').then(
            (m) => m.ProductFormComponent
          ),
      },
    ],
  },
  {
    path: 'stocks',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/stocks/stock-list/stock-list.component').then(
            (m) => m.StockListComponent
          ),
      },
      {
        path: 'alerts',
        loadComponent: () =>
          import('./features/stocks/expiry-alerts/expiry-alerts.component').then(
            (m) => m.ExpiryAlertsComponent
          ),
      },
    ],
  },
  {
    path: 'shopping',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/shopping/shopping-lists/shopping-lists.component').then(
            (m) => m.ShoppingListsComponent
          ),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./features/shopping/shopping-list-detail/shopping-list-detail.component').then(
            (m) => m.ShoppingListDetailComponent
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: ''
  }
];

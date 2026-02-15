import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { ToastContainerComponent } from './shared/toast/toast-container.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, ToastContainerComponent],
  template: `
    <div class="min-h-screen">
      <app-toast-container />
      <nav class="sticky top-0 z-40 border-b border-orange-100 bg-white/90 backdrop-blur">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="h-16 flex items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <a [routerLink]="authService.isAuthenticated() ? '/dashboard' : '/about'" class="inline-flex items-center gap-2 text-2xl font-black text-primary-700 tracking-tight">
                <img src="assets/logo-saneo.svg" alt="SANEO" class="h-8 w-8 rounded-lg shadow-sm" />
                <span>SANEO</span>
              </a>
              <p class="hidden md:block text-xs text-gray-500">Stock simple au quotidien</p>
            </div>
            <div class="flex items-center gap-2 text-sm">
              <ng-container *ngIf="authService.isAuthenticated(); else guestActions">
                <button
                  type="button"
                  class="btn-secondary px-3 py-1.5"
                  (click)="logout()"
                >
                  Déconnexion
                </button>
              </ng-container>
              <ng-template #guestActions>
                <a routerLink="/auth/login" class="btn-link">Connexion</a>
                <a
                  routerLink="/auth/register"
                  class="btn-primary px-3 py-1.5"
                >
                  Inscription
                </a>
              </ng-template>
            </div>
          </div>

          <div *ngIf="authService.isAuthenticated(); else publicNav" class="pb-3">
            <div class="flex items-center gap-2 overflow-x-auto text-sm">
              <a
                routerLink="/dashboard"
                routerLinkActive="bg-primary-100 text-primary-800 border-primary-200"
                class="px-3 py-1.5 rounded-full border border-orange-100 bg-white text-gray-700 whitespace-nowrap"
              >
                Dashboard
              </a>
              <a
                routerLink="/products"
                routerLinkActive="bg-primary-100 text-primary-800 border-primary-200"
                class="px-3 py-1.5 rounded-full border border-orange-100 bg-white text-gray-700 whitespace-nowrap"
              >
                Produits
              </a>
              <a
                routerLink="/shopping"
                routerLinkActive="bg-primary-100 text-primary-800 border-primary-200"
                class="px-3 py-1.5 rounded-full border border-orange-100 bg-white text-gray-700 whitespace-nowrap"
              >
                Courses
              </a>
              <a
                routerLink="/stocks"
                routerLinkActive="bg-primary-100 text-primary-800 border-primary-200"
                class="px-3 py-1.5 rounded-full border border-orange-100 bg-white text-gray-700 whitespace-nowrap"
              >
                Détails stock
              </a>
              <a
                routerLink="/about"
                routerLinkActive="bg-primary-100 text-primary-800 border-primary-200"
                class="px-3 py-1.5 rounded-full border border-orange-100 bg-white text-gray-700 whitespace-nowrap"
              >
                À propos
              </a>
            </div>
          </div>

          <ng-template #publicNav>
            <div class="pb-3">
              <a
                routerLink="/about"
                routerLinkActive="bg-primary-100 text-primary-800 border-primary-200"
                class="inline-flex px-3 py-1.5 rounded-full border border-orange-100 bg-white text-gray-700 text-sm"
              >
                À propos
              </a>
            </div>
          </ng-template>
        </div>
      </nav>
      
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <router-outlet />
      </main>
    </div>
  `
})
export class AppComponent {
  constructor(
    readonly authService: AuthService,
    private readonly router: Router
  ) {}

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/about']);
      },
      error: () => {
        this.router.navigate(['/about']);
      },
    });
  }
}

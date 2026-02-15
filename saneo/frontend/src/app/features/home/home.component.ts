import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-8">
      <div class="card p-8 text-center">
        <h2 class="page-title mb-4">
          À propos de SANEO
        </h2>
        <p class="text-lg md:text-xl text-gray-600 mb-6">
          SANEO aide à suivre ton stock sans complexité, pour éviter le gaspillage et simplifier les courses.
        </p>
        <div class="flex justify-center space-x-4">
          <a
            routerLink="/dashboard"
            class="btn-primary px-6 py-3"
          >
            Ouvrir l'application
          </a>
          <a
            *ngIf="!authService.isAuthenticated()"
            routerLink="/auth/register"
            class="btn-secondary px-6 py-3"
          >
            Créer un compte
          </a>
        </div>
      </div>

      <div class="grid md:grid-cols-3 gap-6">
        <div class="card-lift p-6">
          <div class="text-4xl mb-4">📦</div>
          <h3 class="text-xl font-bold mb-2">Suivi précis</h3>
          <p class="text-gray-600">
            Suivi des lots, quantités, emplacements et dates de péremption.
          </p>
        </div>

        <div class="card-lift p-6">
          <div class="text-4xl mb-4">🛒</div>
          <h3 class="text-xl font-bold mb-2">Courses intelligentes</h3>
          <p class="text-gray-600">
            Génération automatique des listes selon seuils et consommations.
          </p>
        </div>

        <div class="card-lift p-6">
          <div class="text-4xl mb-4">⏰</div>
          <h3 class="text-xl font-bold mb-2">Alertes utiles</h3>
          <p class="text-gray-600">
            Alertes de péremption et notifications pour anticiper les achats.
          </p>
        </div>

        <div class="card-lift p-6">
          <div class="text-4xl mb-4">📊</div>
          <h3 class="text-xl font-bold mb-2">Vision globale</h3>
          <p class="text-gray-600">
            Dashboard de stock, ruptures, péremptions et tendances de consommation.
          </p>
        </div>

        <div class="card-lift p-6">
          <div class="text-4xl mb-4">🏷️</div>
          <h3 class="text-xl font-bold mb-2">Organisation simple</h3>
          <p class="text-gray-600">
            Produits classés par catégories avec emplacements personnalisables.
          </p>
        </div>

        <div class="card-lift p-6">
          <div class="text-4xl mb-4">🔒</div>
          <h3 class="text-xl font-bold mb-2">Compte personnel</h3>
          <p class="text-gray-600">
            Données sécurisées par compte avec authentification JWT.
          </p>
        </div>
      </div>

      <div class="bg-orange-50 border border-orange-100 rounded-2xl p-8">
        <h3 class="text-2xl font-bold mb-4">Ce que couvre la version actuelle</h3>
        <ul class="space-y-2 text-gray-700">
          <li>Compte personnel sécurisé.</li>
          <li>Produits + actions rapides quotidiennes.</li>
          <li>Courses automatiques selon le stock réel.</li>
          <li>Détails de lots et alertes en mode avancé.</li>
        </ul>
      </div>

      <div class="bg-gray-100 rounded-lg p-6 text-center">
        <p class="text-gray-600 mb-2">
          SANEO est en amélioration continue.
        </p>
        <p class="text-sm text-gray-500">
          Documentation API disponible sur
          <a href="/api/docs/" target="_blank" class="btn-link font-medium">
            /api/docs/
          </a>
        </p>
        <p class="text-xs text-gray-400 mt-2">
          Stack: Django + DRF, PostgreSQL, Redis/Celery, Angular standalone.
        </p>
      </div>
    </div>
  `
})
export class HomeComponent {
  constructor(readonly authService: AuthService) {}
}

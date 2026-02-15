import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { StockSummary } from '../../core/models/dashboard.model';
import { StockDashboardService } from '../../core/services/stock-dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="space-y-6">
      <header>
        <h2 class="page-title">Dashboard</h2>
        <p class="page-subtitle">Vue rapide de ton stock et des actions à faire.</p>
      </header>

      <p *ngIf="loading" class="text-gray-600">Chargement des statistiques...</p>
      <p *ngIf="error" class="text-red-600">{{ error }}</p>

      <div *ngIf="summary" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article class="card-lift p-4">
          <p class="text-sm text-gray-500">Produits</p>
          <p class="text-3xl font-bold">{{ summary.total_products }}</p>
        </article>
        <article class="card-lift p-4">
          <p class="text-sm text-gray-500">Ruptures</p>
          <p class="text-3xl font-bold text-red-600">{{ summary.products_out_of_stock }}</p>
        </article>
        <article class="card-lift p-4">
          <p class="text-sm text-gray-500">Péremptions proches</p>
          <p class="text-3xl font-bold text-orange-600">{{ summary.batches_expiring_soon }}</p>
        </article>
        <article class="card-lift p-4">
          <p class="text-sm text-gray-500">Lots périmés</p>
          <p class="text-3xl font-bold text-red-700">{{ summary.batches_expired }}</p>
        </article>
      </div>

      <div *ngIf="summary" class="card p-6">
        <p class="text-gray-700">Lots en stock: <span class="font-semibold">{{ summary.total_batches }}</span></p>
        <p class="text-gray-700">Produits sous seuil: <span class="font-semibold">{{ summary.products_below_threshold }}</span></p>
        <p class="text-gray-700">Valeur stock estimée: <span class="font-semibold">{{ summary.total_value }} €</span></p>
      </div>
    </section>
  `,
})
export class DashboardComponent implements OnInit {
  loading = true;
  error = '';
  summary: StockSummary | null = null;

  constructor(private readonly dashboardService: StockDashboardService) {}

  ngOnInit(): void {
    this.dashboardService.getSummary().subscribe({
      next: (summary) => {
        this.summary = summary;
      },
      error: () => {
        this.error = 'Impossible de charger le dashboard.';
      },
      complete: () => {
        this.loading = false;
      },
    });
  }
}

import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ExpiryAlert } from '../../../core/models/stock.model';
import { NotificationService } from '../../../core/services/notification.service';
import { StockService } from '../services/stock.service';

@Component({
  selector: 'app-expiry-alerts',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="space-y-6">
      <header class="flex items-center justify-between gap-4">
        <div>
          <h2 class="page-title">Alertes de péremption</h2>
          <p class="page-subtitle">Alertes non lues à traiter.</p>
        </div>
        <a routerLink="/stocks" class="btn-secondary">Retour stocks</a>
      </header>

      <p *ngIf="loading" class="text-gray-600">Chargement des alertes...</p>
      <p *ngIf="error" class="text-red-600">{{ error }}</p>

      <div *ngIf="!loading && alerts.length === 0" class="card p-6 text-gray-600">
        Aucune alerte non lue.
      </div>

      <div *ngIf="alerts.length > 0" class="space-y-3">
        <article *ngFor="let alert of alerts" class="card-lift p-4 flex items-center justify-between gap-4">
          <div>
            <p class="font-semibold" [class.text-red-700]="alert.alert_type === 'EXPIRED'" [class.text-orange-700]="alert.alert_type === 'EXPIRING_SOON'">
              {{ alert.alert_type_display }} - {{ alert.product_name }}
            </p>
            <p class="text-sm text-gray-600">
              Péremption: {{ alert.expiry_date || '-' }}
              <span *ngIf="alert.days_until_expiry !== null">({{ alert.days_until_expiry }} jour(s))</span>
            </p>
          </div>
          <button
            type="button"
            (click)="markRead(alert.id)"
            class="btn-primary px-3 py-1.5"
          >
            Marquer lu
          </button>
        </article>
      </div>
    </section>
  `,
})
export class ExpiryAlertsComponent implements OnInit {
  loading = true;
  error = '';
  alerts: ExpiryAlert[] = [];

  constructor(
    private readonly stockService: StockService,
    private readonly notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadAlerts();
  }

  loadAlerts(): void {
    this.loading = true;
    this.error = '';

    this.stockService.getUnreadAlerts().subscribe({
      next: (alerts) => {
        this.alerts = alerts;
      },
      error: () => {
        this.error = 'Impossible de charger les alertes.';
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  markRead(alertId: number): void {
    this.stockService.markAlertRead(alertId).subscribe({
      next: () => {
        this.alerts = this.alerts.filter((alert) => alert.id !== alertId);
        this.notificationService.show('Alerte marquée comme lue.', 'success');
      },
      error: () => {
        this.error = 'Impossible de marquer cette alerte comme lue.';
        this.notificationService.show(this.error, 'error');
      },
    });
  }
}

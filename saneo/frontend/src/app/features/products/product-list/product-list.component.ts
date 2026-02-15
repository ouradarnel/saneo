import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProductListItem } from '../../../core/models/product.model';
import { NotificationService } from '../../../core/services/notification.service';
import { StockService } from '../../stocks/services/stock.service';
import { ProductService } from '../services/product.service';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="space-y-6">
      <header class="flex items-center justify-between gap-4">
        <div class="min-w-0">
          <h2 class="page-title">Produits</h2>
          <p class="page-subtitle">Écran principal: consommer et ajouter vite.</p>
        </div>
        <div class="flex items-center gap-2 flex-wrap justify-end">
          <a routerLink="/stocks" class="btn-secondary">
            Détails stock
          </a>
          <a routerLink="/products/new" class="btn-primary">
            Nouveau produit
          </a>
        </div>
      </header>

      <div class="card p-4">
        <input
          [(ngModel)]="search"
          (ngModelChange)="loadProducts()"
          placeholder="Rechercher un produit..."
          class="field"
        />
      </div>

      <p *ngIf="loading" class="text-gray-600">Chargement des produits...</p>
      <p *ngIf="error" class="text-red-600">{{ error }}</p>

      <div *ngIf="!loading && products.length === 0" class="card p-6 text-gray-600">
        Aucun produit trouvé.
      </div>

      <div *ngIf="products.length > 0" class="md:hidden space-y-3">
        <article *ngFor="let product of products" class="card p-4 space-y-3">
          <div>
            <p class="font-semibold text-gray-900">{{ product.name }}</p>
            <p class="text-xs text-gray-500">
              {{ product.category_name }} <span *ngIf="product.brand">· {{ product.brand }}</span>
            </p>
          </div>

          <span
            class="inline-flex px-2 py-1 text-xs rounded-full font-medium"
            [class.bg-red-100]="product.needs_restock"
            [class.text-red-700]="product.needs_restock"
            [class.bg-orange-100]="!product.needs_restock && product.is_below_threshold"
            [class.text-orange-700]="!product.needs_restock && product.is_below_threshold"
            [class.bg-yellow-100]="!product.needs_restock && !product.is_below_threshold"
            [class.text-yellow-800]="!product.needs_restock && !product.is_below_threshold"
          >
            {{ stockStatusIcon(product) }} {{ product.total_stock }} {{ product.unit_display }} / seuil {{ product.threshold }}
          </span>

          <div class="flex items-center gap-2">
            <button
              type="button"
              (click)="quickConsume(product, 1)"
              [disabled]="isRunningQuickAction(product.id)"
              class="btn-danger px-2 py-1"
            >
              -1
            </button>
            <button
              type="button"
              (click)="quickConsume(product, 2)"
              [disabled]="isRunningQuickAction(product.id)"
              class="btn-danger px-2 py-1"
            >
              -2
            </button>
            <button
              type="button"
              (click)="quickAdd(product, 1)"
              [disabled]="isRunningQuickAction(product.id)"
              class="btn-success px-2 py-1"
            >
              +1
            </button>
          </div>

          <div class="flex items-center gap-2">
            <input
              type="number"
              step="0.01"
              min="0"
              [(ngModel)]="consumeInputs[product.id]"
              (focus)="prefillConsume(product.id)"
              (keydown.enter)="consumeStock(product); $event.preventDefault()"
              class="w-24 field px-2 py-1"
              placeholder="Qté"
            />
            <button
              type="button"
              (click)="consumeStock(product)"
              [disabled]="isRunningQuickAction(product.id)"
              class="btn-primary px-3 py-1"
            >
              {{ isRunningQuickAction(product.id) ? '...' : 'OK' }}
            </button>
            <a
              [routerLink]="['/products', product.id, 'edit']"
              class="btn-link"
              [class.pointer-events-none]="isRunningQuickAction(product.id)"
              [class.opacity-50]="isRunningQuickAction(product.id)"
            >
              Modifier
            </a>
          </div>
        </article>
      </div>

      <div *ngIf="products.length > 0" class="card overflow-x-auto hidden md:block">
        <table class="min-w-[860px] text-sm">
          <thead class="bg-gray-100 text-gray-700">
            <tr>
              <th class="text-left px-4 py-3">Nom</th>
              <th class="text-left px-4 py-3">Stock</th>
              <th class="text-left px-4 py-3">Rapide</th>
              <th class="text-left px-4 py-3">Quantité perso</th>
              <th class="text-left px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let product of products" class="border-t border-gray-100">
              <td class="px-4 py-3">
                <p class="font-medium text-gray-900">{{ product.name }}</p>
                <p class="text-xs text-gray-500">
                  {{ product.category_name }} <span *ngIf="product.brand">· {{ product.brand }}</span>
                </p>
              </td>
              <td class="px-4 py-3">
                <span
                  class="px-2 py-1 text-xs rounded-full font-medium"
                  [class.bg-red-100]="product.needs_restock"
                  [class.text-red-700]="product.needs_restock"
                  [class.bg-orange-100]="!product.needs_restock && product.is_below_threshold"
                  [class.text-orange-700]="!product.needs_restock && product.is_below_threshold"
                  [class.bg-yellow-100]="!product.needs_restock && !product.is_below_threshold"
                  [class.text-yellow-800]="!product.needs_restock && !product.is_below_threshold"
                >
                  {{ stockStatusIcon(product) }} {{ product.total_stock }} {{ product.unit_display }} / seuil {{ product.threshold }}
                </span>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    (click)="quickConsume(product, 1)"
                    [disabled]="isRunningQuickAction(product.id)"
                    class="btn-danger px-2 py-1"
                  >
                    -1
                  </button>
                  <button
                    type="button"
                    (click)="quickConsume(product, 2)"
                    [disabled]="isRunningQuickAction(product.id)"
                    class="btn-danger px-2 py-1"
                  >
                    -2
                  </button>
                  <button
                    type="button"
                    (click)="quickAdd(product, 1)"
                    [disabled]="isRunningQuickAction(product.id)"
                    class="btn-success px-2 py-1"
                  >
                    +1
                  </button>
                </div>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    [(ngModel)]="consumeInputs[product.id]"
                    (focus)="prefillConsume(product.id)"
                    (keydown.enter)="consumeStock(product); $event.preventDefault()"
                    class="w-24 field px-2 py-1"
                    placeholder="Qté"
                  />
                  <button
                    type="button"
                    (click)="consumeStock(product)"
                    [disabled]="isRunningQuickAction(product.id)"
                    class="btn-primary px-3 py-1"
                  >
                    {{ isRunningQuickAction(product.id) ? '...' : 'OK' }}
                  </button>
                </div>
              </td>
              <td class="px-4 py-3">
                <a
                  [routerLink]="['/products', product.id, 'edit']"
                  class="btn-link"
                  [class.pointer-events-none]="isRunningQuickAction(product.id)"
                  [class.opacity-50]="isRunningQuickAction(product.id)"
                >
                  Modifier
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `,
})
export class ProductListComponent implements OnInit {
  loading = true;
  error = '';
  search = '';
  products: ProductListItem[] = [];
  consumeInputs: Record<number, string | number> = {};
  private readonly runningQuickActionProductIds = new Set<number>();

  constructor(
    private readonly productService: ProductService,
    private readonly stockService: StockService,
    private readonly notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading = true;
    this.error = '';

    this.productService.list(this.search).subscribe({
      next: (response) => {
        this.products = [...response.results].sort((a, b) => {
          const urgencyA = (a.needs_restock ? 2 : 0) + (a.is_below_threshold ? 1 : 0);
          const urgencyB = (b.needs_restock ? 2 : 0) + (b.is_below_threshold ? 1 : 0);
          if (urgencyA !== urgencyB) {
            return urgencyB - urgencyA;
          }
          return a.name.localeCompare(b.name);
        });
      },
      error: () => {
        this.error = 'Impossible de charger les produits.';
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  consumeStock(product: ProductListItem): void {
    const rawValue = this.consumeInputs[product.id];
    const quantity = Number(String(rawValue ?? '').replace(',', '.'));
    if (!quantity || quantity <= 0) {
      this.error = 'Saisis une quantité valide à consommer.';
      this.notificationService.show(this.error, 'error');
      return;
    }

    this.consumeInputs[product.id] = quantity;
    this.quickConsume(product, quantity);
  }

  prefillConsume(productId: number): void {
    const current = this.consumeInputs[productId];
    const parsed = Number(String(current ?? '').replace(',', '.'));
    if (!parsed || parsed <= 0) {
      this.consumeInputs[productId] = 1;
    }
  }

  quickConsume(product: ProductListItem, quantity: number): void {
    if (!quantity || quantity <= 0) {
      return;
    }

    this.error = '';
    this.runningQuickActionProductIds.add(product.id);
    this.productService.consumeStock(product.id, quantity).subscribe({
      next: () => {
        this.consumeInputs[product.id] = 0;
        this.notificationService.showAction(
          'Action enregistrée.',
          'Annuler',
          () => this.undoConsume(product, quantity),
          'success',
          6000
        );
        this.loadProducts();
      },
      error: (err) => {
        this.error = err?.error?.error || 'Impossible de consommer ce produit.';
        this.notificationService.show(this.error, 'error');
      },
      complete: () => {
        this.runningQuickActionProductIds.delete(product.id);
      },
    });
  }

  quickAdd(product: ProductListItem, quantity: number): void {
    if (!quantity || quantity <= 0) {
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    this.error = '';
    this.runningQuickActionProductIds.add(product.id);
    this.stockService.createBatch({
      product: product.id,
      quantity,
      location: product.default_location,
      expiry_date: null,
      purchase_date: today,
      purchase_price: null,
      supplier: '',
      notes: 'Ajout rapide depuis produits',
    }).subscribe({
      next: () => {
        this.notificationService.showAction(
          'Action enregistrée.',
          'Annuler',
          () => this.undoAdd(product, quantity),
          'success',
          6000
        );
        this.loadProducts();
      },
      error: () => {
        this.error = "Impossible d'ajouter du stock.";
        this.notificationService.show(this.error, 'error');
      },
      complete: () => {
        this.runningQuickActionProductIds.delete(product.id);
      },
    });
  }

  isRunningQuickAction(productId: number): boolean {
    return this.runningQuickActionProductIds.has(productId);
  }

  stockStatusIcon(product: ProductListItem): string {
    if (product.needs_restock) {
      return '⛔';
    }

    if (product.is_below_threshold) {
      return '⚠️';
    }

    return '✅';
  }

  private undoConsume(product: ProductListItem, quantity: number): void {
    const today = new Date().toISOString().slice(0, 10);
    this.runningQuickActionProductIds.add(product.id);
    this.stockService.createBatch({
      product: product.id,
      quantity,
      location: product.default_location,
      expiry_date: null,
      purchase_date: today,
      purchase_price: null,
      supplier: '',
      notes: 'Annulation consommation rapide',
    }).subscribe({
      next: () => {
        this.notificationService.show('Action annulée.', 'info');
        this.loadProducts();
      },
      error: () => {
        this.notificationService.show("Impossible d'annuler l'action.", 'error');
      },
      complete: () => {
        this.runningQuickActionProductIds.delete(product.id);
      },
    });
  }

  private undoAdd(product: ProductListItem, quantity: number): void {
    this.runningQuickActionProductIds.add(product.id);
    this.productService.consumeStock(product.id, quantity, 'Annulation ajout rapide').subscribe({
      next: () => {
        this.notificationService.show('Action annulée.', 'info');
        this.loadProducts();
      },
      error: () => {
        this.notificationService.show("Impossible d'annuler l'action.", 'error');
      },
      complete: () => {
        this.runningQuickActionProductIds.delete(product.id);
      },
    });
  }
}
